use web_sys::console;

use crate::dsp::{circular_buffer::InterpolationType, linkwitz_riley_filter::LinkwitzRileyFilter};

use super::{
    circular_buffer::CircularBuffer,
    tape_sim::TapeSimFilter,
    vasv_filter::{pre_feedback_loop_hipass, VASVFilter},
};

// const MIN_READ_DELAY: f32 = 0.0;

#[derive(Copy, Clone, PartialEq)]
enum GrainDirection {
    Forward,
    Reverse,
}

struct GrainOutputProcessParams {
    read_index: f32,

    // delay in samples behind the input_buffer write head
    delay: f32,

    output_size: f32,
    overlap_width: f32,

    active: bool,
    direction: GrainDirection,
}

struct StretchState {
    stretching: bool,
    trigger_stretch: bool,
    grain_index: usize,
    repeat_index: usize,
}

pub struct GranularProcessor {
    sample_rate: f32,

    input_buffer: CircularBuffer,
    input_buffer_size: usize,
    current_input_size: f32,

    written_samples_ctr: f32,

    output_1_process_params: GrainOutputProcessParams,
    output_2_process_params: GrainOutputProcessParams,

    output_lowpass: VASVFilter,
    output_tape_sim_bandpass: TapeSimFilter,
    output_pre_feedback_hipass: VASVFilter,
    anti_aliasing_lowpass: LinkwitzRileyFilter,

    stretch_factor: u8,
    next_stretch_factor: u8,
    stretch_state: StretchState,
}

impl GranularProcessor {
    pub fn new(
        sample_rate: f32,
        max_grain_size_sec: usize,
        max_pitch_shift_octaves: usize,
    ) -> GranularProcessor {
        let input_buffer_size =
            2 * (max_grain_size_sec * sample_rate as usize) * max_pitch_shift_octaves;

        GranularProcessor {
            sample_rate,

            input_buffer: CircularBuffer::new(input_buffer_size),
            input_buffer_size,
            current_input_size: 0.0,

            written_samples_ctr: 0.0,

            output_1_process_params: GrainOutputProcessParams {
                read_index: 0.0,
                delay: 0.0,
                output_size: 0.0,
                overlap_width: 0.0,
                active: false,
                direction: GrainDirection::Forward,
            },
            output_2_process_params: GrainOutputProcessParams {
                read_index: 0.0,
                delay: 0.0,
                output_size: 0.0,
                overlap_width: 0.0,
                active: false,
                direction: GrainDirection::Forward,
            },

            output_lowpass: VASVFilter::new(sample_rate),
            output_tape_sim_bandpass: TapeSimFilter::new(sample_rate),
            output_pre_feedback_hipass: pre_feedback_loop_hipass(sample_rate),
            anti_aliasing_lowpass: LinkwitzRileyFilter::new(sample_rate),

            stretch_factor: 1,
            next_stretch_factor: 1,
            stretch_state: StretchState {
                stretching: false,
                trigger_stretch: false,
                grain_index: 0,
                repeat_index: 0,
            },
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
        self.written_samples_ctr = 0.0;

        self.output_1_process_params.read_index = 0.0;
        self.output_1_process_params.delay = 0.0;
        self.output_1_process_params.output_size = 0.0;
        self.output_1_process_params.overlap_width = 0.0;
        self.output_1_process_params.active = false;
        self.output_1_process_params.direction = GrainDirection::Forward;

        self.output_2_process_params.read_index = 0.0;
        self.output_2_process_params.delay = 0.0;
        self.output_2_process_params.output_size = 0.0;
        self.output_2_process_params.overlap_width = 0.0;
        self.output_2_process_params.active = false;
        self.output_2_process_params.direction = GrainDirection::Forward;

        self.output_lowpass.reset();
        self.output_tape_sim_bandpass.reset();
        self.output_pre_feedback_hipass.reset();
        self.anti_aliasing_lowpass.reset();

        self.next_stretch_factor = self.stretch_factor;
        self.stretch_state.stretching = false;
        self.stretch_state.trigger_stretch = false;
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

        // on note-on: deactivate both grains so they respawn cleanly
        // if trigger_stretch {
        //     self.output_1_process_params.active = false;
        //     self.output_2_process_params.active = false;
        // }
        if trigger_stretch {
            self.stretch_state.trigger_stretch = true;
            // console::log_2(&stretch_factor.into(), &trigger_stretch.into());
        }

        let overlap_width = grain_size_samples * overlap;
        let stride = grain_size_samples - overlap_width;

        if self.written_samples_ctr >= stride {
            self.written_samples_ctr = 0.0;

            self.stretch_factor = self.next_stretch_factor;

            if self.stretch_state.trigger_stretch && self.stretch_factor > 1 {
                self.stretch_state.stretching = true;
                self.stretch_state.grain_index = 0;
                self.stretch_state.repeat_index = 0;
                self.stretch_state.trigger_stretch = false;
            } else if self.stretch_factor <= 1 {
                self.stretch_state.stretching = false;
            }

            let mut stretch_lookback_samples: f32 = 0.0;
            if self.stretch_state.stretching {
                stretch_lookback_samples = stride
                    * ((self.stretch_state.grain_index * (self.stretch_factor as usize - 1)
                        + self.stretch_state.repeat_index) as f32);

                if stretch_lookback_samples
                    > self.input_buffer_size as f32
                        - (grain_size_samples * pitch_shift_factor).ceil()
                {
                    stretch_lookback_samples = 0.0;
                    self.stretch_state.grain_index = 0;
                    self.stretch_state.repeat_index = 0;
                }

                self.stretch_state.repeat_index += 1;
                if self.stretch_state.repeat_index >= self.stretch_factor as usize {
                    self.stretch_state.grain_index += 1;
                    self.stretch_state.repeat_index = 0;
                }
            }

            if !self.output_1_process_params.active {
                Self::spawn_grain(
                    &mut self.output_1_process_params,
                    grain_size_samples,
                    overlap_width,
                    pitch_shift_factor,
                    match playback_direction {
                        PlaybackDirection::Alternate => GrainDirection::Forward,
                        PlaybackDirection::Reverse => GrainDirection::Reverse,
                        _ => GrainDirection::Forward,
                    },
                    stretch_lookback_samples,
                );
            } else if !self.output_2_process_params.active {
                Self::spawn_grain(
                    &mut self.output_2_process_params,
                    grain_size_samples,
                    overlap_width,
                    pitch_shift_factor,
                    match playback_direction {
                        PlaybackDirection::Alternate => GrainDirection::Reverse,
                        PlaybackDirection::Reverse => GrainDirection::Reverse,
                        _ => GrainDirection::Forward,
                    },
                    stretch_lookback_samples,
                );
            }
        }

        let o1_out = Self::process_grain(
            &self.input_buffer,
            &mut self.output_1_process_params,
            pitch_shift_factor,
        );
        let o2_out = Self::process_grain(
            &self.input_buffer,
            &mut self.output_2_process_params,
            pitch_shift_factor,
        );

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
    fn process_grain(
        input_buffer: &CircularBuffer,
        grain: &mut GrainOutputProcessParams,
        pitch_shift_factor: f32,
    ) -> f32 {
        if !grain.active || grain.read_index >= grain.output_size {
            grain.active = false;
            return 0.0;
        }

        let window = window_func(grain.read_index, grain.output_size, grain.overlap_width);
        let sample = input_buffer.read_fractional(grain.delay, InterpolationType::Cubic);
        grain.delay += match grain.direction {
            GrainDirection::Forward => 1.0 - pitch_shift_factor,
            GrainDirection::Reverse => 1.0 + pitch_shift_factor,
        };
        grain.read_index += 1.0;

        sample * window
    }

    #[inline]
    fn spawn_grain(
        grain: &mut GrainOutputProcessParams,
        output_size: f32,
        overlap_width: f32,
        pitch_shift_factor: f32,
        direction: GrainDirection,
        stretch_lookback_samples: f32,
    ) {
        grain.delay = stretch_lookback_samples
            + match direction {
                GrainDirection::Forward => {
                    if pitch_shift_factor > 1.0 {
                        pitch_shift_factor * output_size
                    } else {
                        output_size
                    }
                }
                GrainDirection::Reverse => 0.0,
            };

        grain.read_index = 0.0;
        grain.output_size = output_size;
        grain.overlap_width = overlap_width;
        grain.active = true;
        grain.direction = direction;
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
