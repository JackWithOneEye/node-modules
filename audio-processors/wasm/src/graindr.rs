use wasm_bindgen::prelude::*;

use crate::{
    dsp::{
        delay::Delay,
        envelope_filter::{EnvelopeFilter, LevelCalcType},
        envelope_follower::EnvelopeFollower,
        granular::{GranularProcessor, PlaybackDirection},
        linkwitz_riley_filter::{LinkwitzRileyFilter, LinkwitzRileyFilterType},
        smoothed_value::SmoothedValue,
        utils::{make_fine_tune_factors, make_pitch_factors},
    },
    linear_smoothed_value, multiplicative_smoothed_value, utils,
};
use std::{collections::HashMap, f32::consts::FRAC_PI_2};

#[wasm_bindgen]
pub struct Graindr {
    buffer_frame_length: usize,
    channel_count: usize,

    graindr: Vec<GraindrProcessor>,

    fine_tune_factors: HashMap<i32, f32>,
    pitch_factors: HashMap<i32, f32>,

    // parameters
    dry_wet_mix: f32,
    dry_gain: SmoothedValue,
    wet_gain: SmoothedValue,

    pitch_factor: SmoothedValue,

    ms_to_samples_factor: f32,

    // IO buffers
    input_buffer: Vec<f32>,
    output_buffer: Vec<f32>,

    // parameter buffers
    feedback_buffer: Vec<f32>,
    grain_size_ms_buffer: Vec<f32>,
    hi_cut_freq_buffer: Vec<f32>,
    shimmer_buffer: Vec<f32>,
    texture_buffer: Vec<f32>,
}

#[wasm_bindgen]
impl Graindr {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize, sample_rate: f32, channel_count: usize) -> Graindr {
        utils::set_panic_hook();

        let mut proc_vec: Vec<GraindrProcessor> = Vec::with_capacity(channel_count);
        for _ in 0..channel_count {
            proc_vec.push(GraindrProcessor::new(sample_rate));
        }
        Graindr {
            buffer_frame_length,
            channel_count,
            graindr: proc_vec,
            fine_tune_factors: make_fine_tune_factors(),
            pitch_factors: make_pitch_factors(),

            dry_wet_mix: 0.0,
            dry_gain: linear_smoothed_value!(1.0, sample_rate, 0.05),
            wet_gain: linear_smoothed_value!(0.0, sample_rate, 0.05),
            pitch_factor: multiplicative_smoothed_value!(1.0, sample_rate, 0.05),

            ms_to_samples_factor: 0.001 * sample_rate,

            input_buffer: vec![0.0; buffer_frame_length * channel_count],
            output_buffer: vec![0.0; buffer_frame_length * channel_count],

            feedback_buffer: vec![0.0; buffer_frame_length],
            grain_size_ms_buffer: vec![0.0; buffer_frame_length],
            hi_cut_freq_buffer: vec![0.0; buffer_frame_length],
            shimmer_buffer: vec![0.0; buffer_frame_length],
            texture_buffer: vec![0.0; buffer_frame_length],
        }
    }

    pub fn feedback_ptr(&mut self) -> *mut f32 {
        &mut self.feedback_buffer[0]
    }

    pub fn grain_size_ms_ptr(&mut self) -> *mut f32 {
        &mut self.grain_size_ms_buffer[0]
    }

    pub fn hi_cut_freq_ptr(&mut self) -> *mut f32 {
        &mut self.hi_cut_freq_buffer[0]
    }

    pub fn input_ptr(&mut self) -> *mut f32 {
        &mut self.input_buffer[0]
    }

    pub fn output_ptr(&mut self) -> *mut f32 {
        &mut self.output_buffer[0]
    }

    pub fn shimmer_ptr(&mut self) -> *mut f32 {
        &mut self.shimmer_buffer[0]
    }

    pub fn texture_ptr(&mut self) -> *mut f32 {
        &mut self.texture_buffer[0]
    }

    pub fn process(
        &mut self,
        dry_wet_mix: f32,
        pitch_shift: i32,
        fine_tune: i32,
        stretch: u8,
        playback_direction: u8,
        tone_type: u8,
    ) {
        if dry_wet_mix != self.dry_wet_mix {
            self.dry_gain
                .set_target_value((FRAC_PI_2 * (1.0 - dry_wet_mix)).sin());
            self.wet_gain
                .set_target_value((FRAC_PI_2 * dry_wet_mix).sin());
            self.dry_wet_mix = dry_wet_mix;
        }

        let pitch_shift_factor = self.pitch_factors.get(&pitch_shift).unwrap_or(&1.0);
        let fine_tune_factor = self.fine_tune_factors.get(&fine_tune).unwrap_or(&1.0);

        self.pitch_factor
            .set_target_value(pitch_shift_factor * fine_tune_factor);

        let playback_direction = playback_direction.into();
        let tone_type = tone_type.into();

        for n in 0..self.buffer_frame_length {
            let next_dry_gain = self.dry_gain.get_next_value();
            let next_wet_gain = self.wet_gain.get_next_value();
            let next_grain_size = self.grain_size_ms_buffer[n] * self.ms_to_samples_factor;
            let next_pitch_factor = self.pitch_factor.get_next_value();
            let next_texture = self.texture_buffer[n];
            let next_shimmer = self.shimmer_buffer[n];
            let next_feedback = self.feedback_buffer[n];
            let next_hi_cut_freq = self.hi_cut_freq_buffer[n];

            let mut channel_offset = 0;
            for channel in 0..self.channel_count {
                let channel_graindr = &mut self.graindr[channel];

                let sample_index = channel_offset + n;

                let sample = self.input_buffer[sample_index];

                self.output_buffer[sample_index] = next_dry_gain * sample
                    + next_wet_gain
                        * channel_graindr.process(
                            sample,
                            next_grain_size,
                            next_pitch_factor,
                            next_texture,
                            next_feedback,
                            next_shimmer,
                            playback_direction,
                            tone_type,
                            next_hi_cut_freq,
                            stretch,
                        );

                channel_offset += self.buffer_frame_length;
            }
        }
    }

    pub fn reset(&mut self) {
        self.graindr.iter_mut().for_each(GraindrProcessor::reset);
        self.dry_gain.reset();
        self.wet_gain.reset();
        self.pitch_factor.reset();
    }
}

#[derive(Copy, Clone)]
pub enum ToneType {
    Digital,
    Tape,
}

impl From<u8> for ToneType {
    fn from(val: u8) -> Self {
        match val {
            0 => ToneType::Digital,
            1 => ToneType::Tape,
            _ => panic!("Value {} cannot be transformed to ToneType!", val),
        }
    }
}

struct GraindrProcessor {
    // time stretching
    envelope_follower: EnvelopeFollower,
    envelope_follower_active: bool,
    note_on: bool,
    pre_envelope_filter: LinkwitzRileyFilter,

    granular_processor: GranularProcessor,
    delay: Delay,
}

const MAX_GRAIN_SIZE_SEC: usize = 1;
const MAX_PITCH_SHIFT_FACTOR: usize = 2;

impl GraindrProcessor {
    pub fn new(sample_rate: f32) -> GraindrProcessor {
        GraindrProcessor {
            envelope_follower: {
                let mut envelope_filter = EnvelopeFilter::new(sample_rate, 0.368_f32.ln());
                envelope_filter.set_attack(1.5);
                envelope_filter.set_release(5.0);
                envelope_filter.set_type(LevelCalcType::RMS);

                let mut envelope_follower = EnvelopeFollower::new(envelope_filter);
                envelope_follower.set_sensitivity(0.25);
                envelope_follower.set_threshold(-60.0);
                envelope_follower
            },
            envelope_follower_active: false,
            note_on: false,
            pre_envelope_filter: {
                let mut pre_envelope_filter = LinkwitzRileyFilter::new(sample_rate);
                pre_envelope_filter.set_filter_type(LinkwitzRileyFilterType::Lowpass);
                pre_envelope_filter.set_cutoff_frequency(1500.0);
                pre_envelope_filter
            },

            granular_processor: GranularProcessor::new(
                sample_rate,
                MAX_GRAIN_SIZE_SEC,
                MAX_PITCH_SHIFT_FACTOR,
            ),
            delay: Delay::new(sample_rate, MAX_GRAIN_SIZE_SEC * sample_rate as usize),
        }
    }

    pub fn process(
        &mut self,
        x: f32,
        grain_size_samples: f32,
        pitch_factor: f32,
        texture: f32,
        feedback: f32,
        shimmer: f32,
        playback_direction: PlaybackDirection,
        tone_type: ToneType,
        hi_cut_freq: f32,
        stretch_factor: u8,
    ) -> f32 {
        let activate_env_follower = self.granular_processor.current_stretch_factor() > 1;
        match (activate_env_follower, self.envelope_follower_active) {
            (true, false) => {
                // activate
                self.pre_envelope_filter.reset();
                self.envelope_follower.reset();
                self.note_on = false;
                self.envelope_follower_active = true;
            }
            (false, true) => {
                // deactvate
                self.envelope_follower_active = false;
            }
            _ => (),
        }

        let mut trigger_stretch = false;
        if self.envelope_follower_active {
            let pre_env_filter_out = self.pre_envelope_filter.process(x);
            let env_follower_result = self.envelope_follower.process(pre_env_filter_out);
            match self.note_on {
                true if env_follower_result.modulation < 0.001 => {
                    self.note_on = false;
                }
                false if env_follower_result.modulation >= 0.001 => {
                    self.note_on = true;
                    trigger_stretch = true;
                }
                _ => (),
            }
        }

        let tape_sim = matches!(tone_type, ToneType::Tape);

        let granular_proc_out = self.granular_processor.process(
            x,
            grain_size_samples,
            texture * 0.5,
            pitch_factor,
            shimmer,
            hi_cut_freq,
            tape_sim,
            playback_direction,
            stretch_factor,
            trigger_stretch,
        );

        self.delay.process(
            granular_proc_out,
            self.granular_processor.input_size(),
            feedback,
            tape_sim,
        )
    }

    pub fn reset(&mut self) {
        self.granular_processor.reset();
        self.envelope_follower.reset();
        self.envelope_follower_active = self.granular_processor.current_stretch_factor() > 1;
        self.note_on = false;
        self.pre_envelope_filter.reset();
        self.delay.reset();
    }
}
