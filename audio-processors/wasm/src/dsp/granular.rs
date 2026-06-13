use crate::dsp::{
    circular_buffer::cubic_interpolation, linkwitz_riley_filter::LinkwitzRileyFilter,
};

use super::{
    circular_buffer::{CircularBuffer, InterpolationType},
    tape_sim::TapeSimFilter,
    vasv_filter::{pre_feedback_loop_hipass, VASVFilter},
};

struct GrainOutputProcessParams {
    read_index: f32,

    // the still active grain must compensate for the new chunk of
    // samples written into the output buffer after the stride
    read_offset: f32,

    output_size: f32,
    overlap_width: f32,

    trigger_stretch: bool,
    stretch_multiplier: f32,
}

pub struct GranularProcessor {
    sample_rate: f32,

    input_buffer: CircularBuffer,
    current_input_size: f32,

    output_buffer: CircularBuffer,
    current_output_size: f32,
    current_overlap_width: f32,
    written_samples_ctr: f32,

    output_1_process_params: GrainOutputProcessParams,
    output_2_process_params: GrainOutputProcessParams,

    output_lowpass: VASVFilter, // controllable
    output_tape_sim_bandpass: TapeSimFilter,
    output_pre_feedback_hipass: VASVFilter,
    anti_aliasing_lowpass: LinkwitzRileyFilter,

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
            sample_rate,

            input_buffer: CircularBuffer::new(2 * max_input_buffer_size),
            current_input_size: 0.0,

            output_buffer: CircularBuffer::new(4 * max_output_buffer_size),
            current_output_size: 0.0,
            current_overlap_width: 0.0,
            written_samples_ctr: 0.0,

            output_1_process_params: GrainOutputProcessParams {
                read_index: 0.0,
                read_offset: 0.0,
                output_size: 0.0,
                overlap_width: 0.0,
                trigger_stretch: false,
                stretch_multiplier: 1.0,
            },
            output_2_process_params: GrainOutputProcessParams {
                read_index: 0.0,
                read_offset: 0.0,
                output_size: 0.0,
                overlap_width: 0.0,
                trigger_stretch: false,
                stretch_multiplier: 1.0,
            },

            output_lowpass: VASVFilter::new(sample_rate),
            output_tape_sim_bandpass: TapeSimFilter::new(sample_rate),
            output_pre_feedback_hipass: pre_feedback_loop_hipass(sample_rate),
            anti_aliasing_lowpass: LinkwitzRileyFilter::new(sample_rate),

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
        self.written_samples_ctr = 0.0;

        self.current_output_size = 0.0;
        self.current_overlap_width = 0.0;

        self.output_1_process_params.read_index = 0.0;
        self.output_1_process_params.read_offset = 0.0;
        self.output_1_process_params.output_size = 0.0;
        self.output_1_process_params.overlap_width = 0.0;
        self.output_1_process_params.trigger_stretch = false;
        self.output_1_process_params.stretch_multiplier = 1.0;

        self.output_2_process_params.read_index = 0.0;
        self.output_2_process_params.read_offset = 0.0;
        self.output_2_process_params.output_size = 0.0;
        self.output_2_process_params.overlap_width = 0.0;
        self.output_2_process_params.trigger_stretch = false;
        self.output_2_process_params.stretch_multiplier = 1.0;

        self.output_lowpass.reset();
        self.output_tape_sim_bandpass.reset();
        self.output_pre_feedback_hipass.reset();
        self.anti_aliasing_lowpass.reset();

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
        self.current_input_size = grain_size_samples * pitch_shift_factor;

        self.next_stretch_factor = stretch_factor;
        if trigger_stretch {
            self.output_1_process_params.trigger_stretch = true;
            self.output_2_process_params.trigger_stretch = true;
        }

        let stride = self.current_output_size - self.current_overlap_width - 1.0;
        if self.written_samples_ctr > stride {
            self.written_samples_ctr = 0.0;

            let mut stretch_multiplier_incr: f32 = 0.0;

            self.stretch_ctr += 1;
            if self.stretch_ctr >= self.stretch_factor {
                self.stretch_ctr = 0;
            } else {
                stretch_multiplier_incr = 1.0;
            }
            self.stretch_factor = self.next_stretch_factor;

            self.current_output_size = grain_size_samples;
            self.current_overlap_width = grain_size_samples * overlap;

            self.resample_input(
                self.current_input_size,
                self.current_output_size,
                pitch_shift_factor,
            );

            if self.output_1_process_params.read_index >= self.output_1_process_params.output_size {
                Self::reset_grain_output(
                    &mut self.output_1_process_params,
                    &mut self.output_2_process_params,
                    stretch_multiplier_incr,
                    self.current_output_size,
                    self.current_overlap_width,
                    self.output_buffer.write_index(),
                );
            } else if self.output_2_process_params.read_index
                >= self.output_2_process_params.output_size
            {
                Self::reset_grain_output(
                    &mut self.output_2_process_params,
                    &mut self.output_1_process_params,
                    stretch_multiplier_incr,
                    self.current_output_size,
                    self.current_overlap_width,
                    self.output_buffer.write_index(),
                );
            } else {
                self.output_1_process_params.read_offset += self.current_output_size;
                self.output_2_process_params.read_offset += self.current_output_size;
            }
        }

        let mut o1_out = 0.0;
        if self.output_1_process_params.read_index < self.output_1_process_params.output_size {
            let params = &self.output_1_process_params;
            let window = window_func(params.read_index, params.output_size, params.overlap_width);
            let grain_start = params.stretch_multiplier * params.output_size + params.read_offset;

            let buffer_out = match playback_direction {
                PlaybackDirection::Reverse => self.output_buffer.read_fractional(
                    grain_start - params.output_size + params.read_index + 1.0,
                    InterpolationType::Cubic,
                ),
                _ => self
                    .output_buffer
                    .read_fractional(grain_start - params.read_index, InterpolationType::Cubic),
            };
            self.output_1_process_params.read_index += 1.0;
            o1_out = buffer_out * window;
        }

        let mut o2_out = 0.0;
        if self.output_2_process_params.read_index < self.output_2_process_params.output_size {
            let params = &self.output_2_process_params;
            let window = window_func(params.read_index, params.output_size, params.overlap_width);
            let grain_start = params.stretch_multiplier * params.output_size + params.read_offset;

            let buffer_out = match playback_direction {
                PlaybackDirection::Forward => self
                    .output_buffer
                    .read_fractional(grain_start - params.read_index, InterpolationType::Cubic),
                _ => self.output_buffer.read_fractional(
                    grain_start - params.output_size + params.read_index + 1.0,
                    InterpolationType::Cubic,
                ),
            };
            self.output_2_process_params.read_index += 1.0;
            o2_out = buffer_out * window;
        }

        let mut out_sum = o1_out + o2_out;

        if tape_sim {
            out_sum = self.output_tape_sim_bandpass.process(out_sum);
        }

        self.output_lowpass
            .set_params(hi_cut_hz, 0.707, 0.0, 0.0, 0.0, 1.0);
        out_sum = self.output_lowpass.process(out_sum);

        let mut input_buffer_in = x + feedback * self.output_pre_feedback_hipass.process(out_sum);
        if pitch_shift_factor > 1.05 {
            let nyquist_limit = self.sample_rate / (2.0 * pitch_shift_factor);
            self.anti_aliasing_lowpass
                .set_cutoff_frequency(nyquist_limit);
            input_buffer_in = self.anti_aliasing_lowpass.process(input_buffer_in);
        } else {
            self.anti_aliasing_lowpass.reset();
        }

        self.input_buffer.write(input_buffer_in);

        self.written_samples_ctr += 1.0;

        out_sum
    }

    #[inline]
    fn resample_input(&mut self, input_size: f32, output_size: f32, factor: f32) {
        let mut current_pos: f32 = 0.0;

        let mut os = output_size;
        let os_fract = output_size.fract();
        let offset = if os_fract > 0.0 {
            factor * (1.0 - os_fract)
        } else {
            0.0
        };

        while os > 0.0 {
            let delay = input_size + offset - current_pos;

            let y = self
                .input_buffer
                .read_fractional(delay, InterpolationType::Cubic);

            self.output_buffer.write(y);
            current_pos += factor;
            os -= 1.0;
        }
    }

    #[inline]
    fn reset_grain_output(
        params: &mut GrainOutputProcessParams,
        other_params: &mut GrainOutputProcessParams,
        stretch_multiplier_incr: f32,
        output_size: f32,
        overlap_width: f32,
        write_index: usize,
    ) {
        params.read_index = 0.0;
        params.read_offset = 0.0;
        params.output_size = output_size;
        params.overlap_width = overlap_width;

        other_params.read_offset += output_size;

        if params.trigger_stretch
            || (write_index > 0 && write_index < (output_size.ceil() as usize))
        {
            params.stretch_multiplier = 1.0;
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
fn window_func(n: f32, output_size: f32, overlap_width: f32) -> f32 {
    if n < overlap_width {
        n / overlap_width
    } else if n >= output_size - overlap_width {
        (output_size - n) / overlap_width
    } else {
        1.0
    }
}
