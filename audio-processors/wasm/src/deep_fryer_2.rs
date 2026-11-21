use std::f32::consts::FRAC_PI_2;

use wasm_bindgen::prelude::*;
use wasm_utils::IOBufferPtrs;

use crate::{
    dsp::{mdct_codec::MdctCodec, smoothed_value::SmoothedValue},
    linear_smoothed_value,
};

#[wasm_bindgen]
#[derive(IOBufferPtrs)]
pub struct DeepFryer2 {
    buffer_frame_length: usize,
    channel_count: usize,
    codec: MdctCodec,

    #[io_buffer]
    input_buffer: Vec<f32>,
    #[io_buffer]
    output_buffer: Vec<f32>,

    // parameters
    dry_wet_mix: f32,
    dry_gain: SmoothedValue,
    wet_gain: SmoothedValue,
}

#[wasm_bindgen]
impl DeepFryer2 {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize, sample_rate: f32, channel_count: usize) -> DeepFryer2 {
        crate::utils::set_panic_hook();

        DeepFryer2 {
            buffer_frame_length,
            channel_count,
            codec: MdctCodec::new(sample_rate, channel_count),

            input_buffer: vec![0.0; buffer_frame_length * channel_count],
            output_buffer: vec![0.0; buffer_frame_length * channel_count],

            dry_wet_mix: 1.0,
            dry_gain: linear_smoothed_value!(0.0, sample_rate, 0.05),
            wet_gain: linear_smoothed_value!(1.0, sample_rate, 0.05),
        }
    }

    /// `hop_size_index` selects one of 64, 128, 192, 256, 384, 576, 768, 1024, 1536, 2048.
    pub fn process(&mut self, dry_wet_mix: f32, kbps: f32, hop_size_index: usize) {
        if dry_wet_mix != self.dry_wet_mix {
            self.dry_gain
                .set_target_value((FRAC_PI_2 * (1.0 - dry_wet_mix)).sin());
            self.wet_gain
                .set_target_value((FRAC_PI_2 * dry_wet_mix).sin());
            self.dry_wet_mix = dry_wet_mix;
        }

        self.codec.set_kbps(kbps);
        self.codec.set_hop_size_index(hop_size_index);

        for n in 0..self.buffer_frame_length {
            let dry_gain = self.dry_gain.get_next_value();
            let wet_gain = self.wet_gain.get_next_value();

            for channel in 0..self.channel_count {
                let i = channel * self.buffer_frame_length + n;
                let (wet, dry) = self.codec.process(channel, self.input_buffer[i]);
                self.output_buffer[i] = dry_gain * dry + wet_gain * wet;
            }
        }
    }

    pub fn reset(&mut self) {
        self.codec.reset();
        self.dry_gain.reset();
        self.wet_gain.reset();
    }
}
