use wasm_bindgen::prelude::*;

use crate::{dsp::smoothed_value::SmoothedValue, linear_smoothed_value, utils};

#[wasm_bindgen]
pub struct PitchTracker {
    buffer_frame_length: usize,

    pitch_tracker: crate::dsp::pitch_tracker::PitchTracker,

    frequency: SmoothedValue,
    harmonic_threshold: SmoothedValue,

    // IO buffers
    input_buffer: Vec<f32>,
    output_buffer: Vec<f32>,
}

#[wasm_bindgen]
impl PitchTracker {
    #[wasm_bindgen(constructor)]
    pub fn new(
        buffer_frame_length: usize,
        sample_rate: f32,
        window_size_samples: usize,
    ) -> PitchTracker {
        utils::set_panic_hook();

        PitchTracker {
            buffer_frame_length,

            pitch_tracker: crate::dsp::pitch_tracker::PitchTracker::new(
                sample_rate,
                window_size_samples,
            ),

            frequency: linear_smoothed_value!(0.0, sample_rate, 0.005),
            harmonic_threshold: linear_smoothed_value!(0.1, sample_rate, 0.05),

            input_buffer: vec![0.0; buffer_frame_length],
            output_buffer: vec![0.0; buffer_frame_length],
        }
    }

    pub fn input_ptr(&mut self) -> *mut f32 {
        &mut self.input_buffer[0]
    }

    pub fn output_ptr(&mut self) -> *mut f32 {
        &mut self.output_buffer[0]
    }

    pub fn process(&mut self, harmonic_threshold: f32) {
        self.harmonic_threshold.set_target_value(harmonic_threshold);
        for n in 0..self.buffer_frame_length {
            self.pitch_tracker
                .set_harmonic_threshold(self.harmonic_threshold.get_next_value());

            let freq = self.pitch_tracker.get_pitch(self.input_buffer[n]);
            self.frequency.set_target_value(freq);
            self.output_buffer[n] = self.frequency.get_next_value();
        }
    }

    pub fn reset(&mut self) {
        self.pitch_tracker.reset();
        self.frequency.reset();
        self.harmonic_threshold.reset();
    }
}
