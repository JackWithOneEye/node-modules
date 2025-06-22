use std::{collections::HashMap, f32::consts::TAU as TWO_PI};

use wasm_bindgen::prelude::*;

use crate::{
    dsp::{
        fast_math, phase_counter::PhaseCounter, smoothed_value::SmoothedValue,
        utils::make_pitch_factors,
    },
    multiplicative_smoothed_value,
};

const FRAC_1_2PI: f32 = 1.0 / TWO_PI;

#[wasm_bindgen]
pub struct FMOscillator {
    buffer_frame_length: usize,
    channel_count: usize,
    sample_rate_inv: f32,

    pitch_factors: HashMap<i32, f32>,
    pitch_factor: SmoothedValue,
    phase_counter: PhaseCounter,

    // parameter buffers
    frequency_buffer: Vec<f32>,
    phase_shift_buffer: Vec<f32>,

    // IO buffers
    output_buffer: Vec<f32>,
}

#[wasm_bindgen]
impl FMOscillator {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize, sample_rate: f32, channel_count: usize) -> FMOscillator {
        FMOscillator {
            buffer_frame_length,
            channel_count,
            sample_rate_inv: 1.0 / sample_rate,

            pitch_factors: make_pitch_factors(2),
            pitch_factor: multiplicative_smoothed_value!(1.0, sample_rate, 0.05),
            phase_counter: PhaseCounter::new(),

            frequency_buffer: vec![0.0; buffer_frame_length],
            phase_shift_buffer: vec![0.0; buffer_frame_length],
            output_buffer: vec![0.0; buffer_frame_length * channel_count],
        }
    }

    pub fn frequency_ptr(&mut self) -> *mut f32 {
        &mut self.frequency_buffer[0]
    }

    pub fn phase_shift_ptr(&mut self) -> *mut f32 {
        &mut self.phase_shift_buffer[0]
    }

    pub fn output_ptr(&mut self) -> *mut f32 {
        &mut self.output_buffer[0]
    }

    pub fn process(&mut self, pitch_shift: i32) {
        let pitch_shift_factor = self.pitch_factors.get(&pitch_shift).unwrap_or(&1.0);
        self.pitch_factor.set_target_value(*pitch_shift_factor);

        for n in 0..self.buffer_frame_length {
            let increment = self.frequency_buffer[n]
                * self.pitch_factor.get_next_value()
                * self.sample_rate_inv;
            let mut arg = self.phase_counter.advance(increment);
            arg = (arg + (self.phase_shift_buffer[n] * FRAC_1_2PI)).fract();

            let arg1 = (arg + 0.25).fract();
            self.output_buffer[n] = if arg1 < 0.5 {
                fast_math::sin(TWO_PI * (arg1 - 0.25))
            } else {
                0.0 - fast_math::sin(TWO_PI * (arg1 - 0.75))
            };
        }

        for channel in 1..self.channel_count {
            let offset = channel * self.buffer_frame_length;
            for n in 0..self.buffer_frame_length {
                self.output_buffer[offset + n] = self.output_buffer[n];
            }
        }
    }

    pub fn reset(&mut self) {
        self.phase_counter.reset();
    }
}
