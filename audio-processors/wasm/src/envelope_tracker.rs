use wasm_bindgen::prelude::*;

use crate::{
    dsp::{
        envelope_filter::{self, EnvelopeFilter},
        envelope_follower::EnvelopeFollower,
        smoothed_value::SmoothedValue,
    },
    linear_smoothed_value, utils,
};

#[wasm_bindgen]
pub struct EnvelopeTracker {
    buffer_frame_length: usize,

    envelope_follower: EnvelopeFollower,

    // parameters
    sensitivity: SmoothedValue,
    threshold: SmoothedValue,

    note_currently_on: bool,

    // IO buffers
    input_buffer: Vec<f32>,
    modulation_output_buffer: Vec<f32>,
    trigger_output_buffer: Vec<f32>,
}

const TRIGGER_UPPER_THRESHOLD: f32 = 0.01;
const TRIGGER_LOWER_THRESHOLD: f32 = 0.0075;

#[wasm_bindgen]
impl EnvelopeTracker {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize, sample_rate: f32) -> EnvelopeTracker {
        utils::set_panic_hook();

        EnvelopeTracker {
            buffer_frame_length,

            envelope_follower: EnvelopeFollower::new({
                let mut envelope_filter = EnvelopeFilter::new(sample_rate, 0.368_f32.ln());
                envelope_filter.set_attack(1.5);
                envelope_filter.set_release(5.0);
                envelope_filter.set_type(envelope_filter::LevelCalcType::RMS);
                envelope_filter
            }),

            sensitivity: linear_smoothed_value!(1.0, sample_rate, 0.05),
            threshold: linear_smoothed_value!(-60.0, sample_rate, 0.05),

            note_currently_on: false,

            input_buffer: vec![0.0; buffer_frame_length],
            modulation_output_buffer: vec![0.0; buffer_frame_length],
            trigger_output_buffer: vec![0.0; buffer_frame_length],
        }
    }

    pub fn input_ptr(&mut self) -> *mut f32 {
        &mut self.input_buffer[0]
    }

    pub fn modulation_output_ptr(&mut self) -> *mut f32 {
        &mut self.modulation_output_buffer[0]
    }

    pub fn trigger_output_ptr(&mut self) -> *mut f32 {
        &mut self.trigger_output_buffer[0]
    }

    pub fn process(&mut self, sensitivity: f32, threshold: f32) {
        self.sensitivity.set_target_value(sensitivity);
        self.threshold.set_target_value(threshold);

        for n in 0..self.buffer_frame_length {
            self.envelope_follower
                .set_sensitivity(self.sensitivity.get_next_value());
            self.envelope_follower
                .set_threshold(self.threshold.get_next_value());

            let sample = self.input_buffer[n];
            let envelope_result = self.envelope_follower.process(sample);

            if !self.note_currently_on && envelope_result.modulation >= TRIGGER_UPPER_THRESHOLD {
                self.note_currently_on = true;
            } else if self.note_currently_on
                && envelope_result.modulation <= TRIGGER_LOWER_THRESHOLD
            {
                self.note_currently_on = false;
            }

            self.modulation_output_buffer[n] = envelope_result.modulation;
            self.trigger_output_buffer[n] = if self.note_currently_on { 1.0 } else { 0.0 };
        }
    }

    pub fn reset(&mut self) {
        self.sensitivity.reset();
        self.threshold.reset();
    }
}
