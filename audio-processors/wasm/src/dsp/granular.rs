use super::{
    circular_buffer::{cubic_interpolation, CircularBuffer},
    tape_sim::TapeSimFilter,
    vasv_filter::{pre_feedback_loop_hipass, VASVFilter},
};

struct GrainOutputProcessParams {
    read_index: usize,
    read_offset: usize,
    trigger_stretch: bool,
    stretch_multiplier: usize,
}

pub struct GranularProcessor {
    input_buffer: CircularBuffer,
    current_input_size: f32,

    output_buffer: CircularBuffer,
    current_output_size: usize,
    written_samples_ctr: usize,

    output_1_process_params: GrainOutputProcessParams,
    output_2_process_params: GrainOutputProcessParams,

    output_lowpass: VASVFilter, // controllable
    output_tape_sim_bandpass: TapeSimFilter,
    output_pre_feedback_hipass: VASVFilter,

    stretch_ctr: u8,
    stretch_factor: u8,
    next_stretch_factor: u8,
}

impl GranularProcessor {
    pub fn new(
        sample_rate: f32,
        max_grain_size_sec: usize,
        max_pitch_shift_octaves: usize,
    ) -> GranularProcessor {
        let max_output_buffer_size = max_grain_size_sec * sample_rate as usize;
        let max_input_buffer_size = max_output_buffer_size * max_pitch_shift_octaves;

        GranularProcessor {
            input_buffer: CircularBuffer::new(2 * max_input_buffer_size),
            current_input_size: 0.0,

            output_buffer: CircularBuffer::new(4 * max_output_buffer_size),
            current_output_size: 0,
            written_samples_ctr: 0,

            output_1_process_params: GrainOutputProcessParams {
                read_index: 0,
                read_offset: 0,
                trigger_stretch: false,
                stretch_multiplier: 1,
            },
            output_2_process_params: GrainOutputProcessParams {
                read_index: 0,
                read_offset: 0,
                trigger_stretch: false,
                stretch_multiplier: 1,
            },

            output_lowpass: VASVFilter::new(sample_rate),
            output_tape_sim_bandpass: TapeSimFilter::new(sample_rate), //create_tape_sim_bandpass(sample_rate),
            output_pre_feedback_hipass: pre_feedback_loop_hipass(sample_rate),

            stretch_ctr: 0,
            stretch_factor: 1,
            next_stretch_factor: 1,
        }
    }

    pub fn current_stretch_factor(&self) -> u8 {
        self.stretch_factor
    }

    pub fn input_size(&self) -> f32 {
        self.current_input_size
    }

    pub fn reset(&mut self) {
        self.input_buffer.reset();
        self.output_buffer.reset();
        self.written_samples_ctr = 0;

        self.output_1_process_params.read_index = 0;
        self.output_1_process_params.read_offset = 0;
        self.output_1_process_params.trigger_stretch = false;
        self.output_1_process_params.stretch_multiplier = 1;

        self.output_2_process_params.read_index = 0;
        self.output_2_process_params.read_offset = 0;
        self.output_2_process_params.trigger_stretch = false;
        self.output_2_process_params.stretch_multiplier = 1;

        self.output_lowpass.reset();
        self.output_tape_sim_bandpass.reset();
        self.output_pre_feedback_hipass.reset();

        self.next_stretch_factor = self.stretch_factor;
    }

    pub fn process(
        &mut self,
        x: f32,
        grain_size_samples: f32,
        overlap: f32,
        pitch_shift_factor: f32,
        feedback: f32,
        hi_cut_hz: f32,
        tape_sim: bool,
        playback_direction: PlaybackDirection,
        stretch_factor: u8,
        trigger_stretch: bool,
    ) -> f32 {
        self.current_output_size = grain_size_samples as usize;
        self.current_input_size = grain_size_samples * pitch_shift_factor;

        let overlap_width = (grain_size_samples * overlap) as usize;
        let stride = self.current_output_size - overlap_width - 1;

        self.next_stretch_factor = stretch_factor;
        if trigger_stretch {
            self.output_1_process_params.trigger_stretch = true;
            self.output_2_process_params.trigger_stretch = true;
        }

        if self.written_samples_ctr > stride {
            self.written_samples_ctr = 0;

            let mut stretch_multiplier_incr: usize = 0;

            self.stretch_ctr += 1;
            if self.stretch_ctr >= self.stretch_factor {
                self.stretch_ctr = 0;
            } else {
                stretch_multiplier_incr = 1;
            }
            self.stretch_factor = self.next_stretch_factor;

            self.resample_input(
                self.current_input_size,
                self.current_output_size,
                pitch_shift_factor,
            );

            if self.output_1_process_params.read_index >= self.current_output_size {
                Self::reset_grain_output(
                    &mut self.output_1_process_params,
                    &mut self.output_2_process_params,
                    stretch_multiplier_incr,
                    self.current_output_size,
                    self.output_buffer.write_index(),
                );
            } else if self.output_2_process_params.read_index >= self.current_output_size {
                Self::reset_grain_output(
                    &mut self.output_2_process_params,
                    &mut self.output_1_process_params,
                    stretch_multiplier_incr,
                    self.current_output_size,
                    self.output_buffer.write_index(),
                );
            }
        }

        let mut o1_out = 0.0;
        if self.output_1_process_params.read_index < self.current_output_size {
            let window = window_func(
                self.output_1_process_params.read_index,
                self.current_output_size,
                overlap_width,
            );
            let grain_start = self.output_1_process_params.stretch_multiplier
                * self.current_output_size
                + self.output_1_process_params.read_offset;

            let buffer_out = match playback_direction {
                PlaybackDirection::Reverse => self.output_buffer.read(
                    grain_start - self.current_output_size
                        + self.output_1_process_params.read_index
                        + 1,
                ),
                _ => self
                    .output_buffer
                    .read(grain_start - self.output_1_process_params.read_index),
            };
            self.output_1_process_params.read_index += 1;
            o1_out = buffer_out * window;
        }

        let mut o2_out = 0.0;
        if self.output_2_process_params.read_index < self.current_output_size {
            let window = window_func(
                self.output_2_process_params.read_index,
                self.current_output_size,
                overlap_width,
            );
            let grain_start = self.output_2_process_params.stretch_multiplier
                * self.current_output_size
                + self.output_2_process_params.read_offset;

            let buffer_out = match playback_direction {
                PlaybackDirection::Forward => self
                    .output_buffer
                    .read(grain_start - self.output_2_process_params.read_index),
                _ => self.output_buffer.read(
                    grain_start - self.current_output_size
                        + self.output_2_process_params.read_index
                        + 1,
                ),
            };
            self.output_2_process_params.read_index += 1;
            o2_out = buffer_out * window;
        }

        let mut out_sum = o1_out + o2_out;

        if tape_sim {
            out_sum = self.output_tape_sim_bandpass.process(out_sum);
        }

        self.output_lowpass
            .set_params(hi_cut_hz, 0.707, 0.0, 0.0, 0.0, 1.0);
        out_sum = self.output_lowpass.process(out_sum);

        self.input_buffer
            .write(x + feedback * self.output_pre_feedback_hipass.process(out_sum));

        self.written_samples_ctr += 1;

        out_sum
    }

    #[inline]
    fn resample_input(&mut self, input_size: f32, output_size: usize, factor: f32) {
        let mut phasor: f32 = 0.0;
        let mut current_pos: usize = 0;

        for _ in 0..output_size {
            let delay = input_size - current_pos as f32;
            let mut y = self.input_buffer.read_fractional(delay, false);

            if phasor != 0.0 {
                let y0 = self.input_buffer.read_fractional(delay + 1.0, false);
                let y1 = y;
                let y2 = self.input_buffer.read_fractional(delay - 1.0, false);
                let y3 = self.input_buffer.read_fractional(delay - 2.0, false);

                y = cubic_interpolation(y0, y1, y2, y3, phasor);
            }
            self.output_buffer.write(y);
            phasor += factor;
            while phasor >= 1.0 {
                phasor -= 1.0;
                current_pos += 1;
            }
        }
    }

    #[inline]
    fn reset_grain_output(
        params: &mut GrainOutputProcessParams,
        other_params: &mut GrainOutputProcessParams,
        stretch_multiplier_incr: usize,
        output_size: usize,
        write_index: usize,
    ) {
        params.read_index = 0;
        params.read_offset = 0;
        other_params.read_offset = output_size;

        if params.trigger_stretch || (write_index > 0 && write_index < output_size) {
            params.stretch_multiplier = 1;
        } else {
            params.stretch_multiplier = other_params.stretch_multiplier + stretch_multiplier_incr;
        }
        params.trigger_stretch = false;
    }
}

#[derive(Copy, Clone)]
pub enum PlaybackDirection {
    Forward,
    Reverse,
    Alternate,
}

impl From<u8> for PlaybackDirection {
    fn from(val: u8) -> Self {
        match val {
            0 => PlaybackDirection::Forward,
            1 => PlaybackDirection::Reverse,
            2 => PlaybackDirection::Alternate,
            _ => panic!("Value {} cannot be transformed to PlaybackDirection!", val),
        }
    }
}

#[inline(always)]
fn window_func(n: usize, output_size: usize, overlap_width: usize) -> f32 {
    if n < overlap_width {
        n as f32 / overlap_width as f32
    } else if n >= output_size - overlap_width {
        (output_size - n - 1) as f32 / overlap_width as f32
    } else {
        1.0
    }
}
