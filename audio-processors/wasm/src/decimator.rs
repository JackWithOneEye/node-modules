use wasm_bindgen::prelude::*;

use crate::{
    dsp::{lofi, smoothed_value::SmoothedValue},
    linear_smoothed_value,
};

#[wasm_bindgen]
pub struct Decimator {
    buffer_frame_length: usize,
    channel_count: usize,
    decimators: Vec<lofi::Decimator>,

    // IO buffers
    input_buffer: Vec<f32>,
    output_buffer: Vec<f32>,

    // parameters
    reduction: SmoothedValue,
    stereo_shift: SmoothedValue,
}

#[wasm_bindgen]
impl Decimator {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize, sample_rate: f32, channel_count: usize) -> Decimator {
        crate::utils::set_panic_hook();

        let mut decimators: Vec<lofi::Decimator> = Vec::with_capacity(channel_count);
        for _ in 0..channel_count {
            decimators.push(lofi::Decimator::new());
        }

        Decimator {
            buffer_frame_length,
            channel_count,
            decimators,

            input_buffer: vec![0.0; buffer_frame_length * channel_count],
            output_buffer: vec![0.0; buffer_frame_length * channel_count],

            reduction: linear_smoothed_value!(1.0, sample_rate, 0.05),
            stereo_shift: linear_smoothed_value!(0.0, sample_rate, 0.05),
        }
    }

    pub fn input_ptr(&mut self) -> *mut f32 {
        &mut self.input_buffer[0]
    }

    pub fn output_ptr(&mut self) -> *mut f32 {
        &mut self.output_buffer[0]
    }

    pub fn process(&mut self, reduction: f32, stereo_shift: f32) {
        self.reduction.set_target_value(reduction);
        self.stereo_shift.set_target_value(stereo_shift);

        for n in 0..self.buffer_frame_length {
            let next_reduction = self.reduction.get_next_value();
            let next_stereo_shift = self.stereo_shift.get_next_value();

            let mut channel_offset = 0;
            let mut odd_channel = false;
            for ch in 0..self.channel_count {
                let decimator = &mut self.decimators[ch];
                decimator.set_reduction(next_reduction);
                if odd_channel {
                    decimator.set_shift(next_stereo_shift);
                }

                let i = n + channel_offset;
                self.output_buffer[i] = decimator.process(self.input_buffer[i]);
                
                channel_offset += self.buffer_frame_length;
                odd_channel = true;
            }
        }
    }

    pub fn reset(&mut self) {
        self.decimators.iter_mut().for_each(lofi::Decimator::reset);
        self.reduction.reset();
        self.stereo_shift.reset();
    }
}
