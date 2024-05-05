use wasm_bindgen::prelude::*;

use crate::{
    dsp::{lofi, smoothed_value::SmoothedValue},
    linear_smoothed_value,
};

#[wasm_bindgen]
pub struct BitCrusher {
    bit_crusher: lofi::BitCrusher,
    buffer_frame_length: usize,
    channel_count: usize,

    // IO buffers
    input_buffer: Vec<f32>,
    output_buffer: Vec<f32>,

    // parameters
    bits: SmoothedValue,
}

#[wasm_bindgen]
impl BitCrusher {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize, sample_rate: f32, channel_count: usize) -> BitCrusher {
        crate::utils::set_panic_hook();

        BitCrusher {
            bit_crusher: lofi::BitCrusher::new(),
            buffer_frame_length,
            channel_count,

            input_buffer: vec![0.0; buffer_frame_length * channel_count],
            output_buffer: vec![0.0; buffer_frame_length * channel_count],

            bits: linear_smoothed_value!(32.0, sample_rate, 0.05),
        }
    }

    pub fn input_ptr(&mut self) -> *mut f32 {
        &mut self.input_buffer[0]
    }

    pub fn output_ptr(&mut self) -> *mut f32 {
        &mut self.output_buffer[0]
    }

    pub fn process(&mut self, bits: f32) {
        self.bits.set_target_value(bits);

        for n in 0..self.buffer_frame_length {
            self.bit_crusher.set_bits(self.bits.get_next_value());

            let mut channel_offset = 0;
            for _ in 0..self.channel_count {
                let i = n + channel_offset;
                self.output_buffer[i] = self.bit_crusher.process(self.input_buffer[i]);
                channel_offset += self.buffer_frame_length;
            }
        }
    }

    pub fn reset(&mut self) {
        self.bits.reset();
    }
}
