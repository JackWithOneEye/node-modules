use std::f32::consts::FRAC_PI_2;

use wasm_bindgen::prelude::*;
use wasm_utils::IOBufferPtrs;

use crate::{
    dsp::{deep_fryer, smoothed_value::SmoothedValue},
    linear_smoothed_value,
};

#[wasm_bindgen]
#[derive(IOBufferPtrs)]
pub struct DeepFryer {
    buffer_frame_length: usize,
    deep_fryers: Vec<deep_fryer::DeepFryer>,

    #[io_buffer]
    input_buffer: Vec<f32>,
    #[io_buffer]
    output_buffer: Vec<f32>,

    // parameters
    dry_wet_mix: f32,
    dry_gain: SmoothedValue,
    wet_gain: SmoothedValue,
    overlap: SmoothedValue,
    amp_bits: SmoothedValue,
    phase_bits: SmoothedValue,
    sig_bits: SmoothedValue,
}

#[wasm_bindgen]
impl DeepFryer {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize, sample_rate: f32, channel_count: usize) -> DeepFryer {
        crate::utils::set_panic_hook();

        DeepFryer {
            buffer_frame_length,
            deep_fryers: (0..channel_count)
                .map(|_| deep_fryer::DeepFryer::new())
                .collect(),

            input_buffer: vec![0.0; buffer_frame_length * channel_count],
            output_buffer: vec![0.0; buffer_frame_length * channel_count],

            dry_wet_mix: 1.0,
            dry_gain: linear_smoothed_value!(0.0, sample_rate, 0.05),
            wet_gain: linear_smoothed_value!(1.0, sample_rate, 0.05),
            overlap: linear_smoothed_value!(0.5, sample_rate, 0.05),
            amp_bits: linear_smoothed_value!(32.0, sample_rate, 0.05),
            phase_bits: linear_smoothed_value!(32.0, sample_rate, 0.05),
            sig_bits: linear_smoothed_value!(32.0, sample_rate, 0.05),
        }
    }

    pub fn process(
        &mut self,
        dry_wet_mix: f32,
        magnitude: u8,
        overlap: f32,
        generations: u32,
        amp_bits: f32,
        phase_bits: f32,
        sig_bits: f32,
    ) {
        if dry_wet_mix != self.dry_wet_mix {
            self.dry_gain
                .set_target_value((FRAC_PI_2 * (1.0 - dry_wet_mix)).sin());
            self.wet_gain
                .set_target_value((FRAC_PI_2 * dry_wet_mix).sin());
            self.dry_wet_mix = dry_wet_mix;
        }

        self.overlap.set_target_value(overlap);
        self.amp_bits.set_target_value(amp_bits);
        self.phase_bits.set_target_value(phase_bits);
        self.sig_bits.set_target_value(sig_bits);

        for n in 0..self.buffer_frame_length {
            let dry_gain = self.dry_gain.get_next_value();
            let wet_gain = self.wet_gain.get_next_value();
            let overlap = self.overlap.get_next_value();
            let amp_bits = self.amp_bits.get_next_value();
            let phase_bits = self.phase_bits.get_next_value();
            let sig_bits = self.sig_bits.get_next_value();

            let mut channel_offset = 0;
            for deep_fryer in self.deep_fryers.iter_mut() {
                deep_fryer.set_magnitude(magnitude);
                deep_fryer.set_overlap(overlap);
                deep_fryer.set_generations(generations);
                deep_fryer.set_amp_bits(amp_bits);
                deep_fryer.set_phase_bits(phase_bits);
                deep_fryer.set_sig_bits(sig_bits);

                let i = channel_offset + n;
                let sample = self.input_buffer[i];
                self.output_buffer[i] = dry_gain * sample + wet_gain * deep_fryer.process(sample);

                channel_offset += self.buffer_frame_length;
            }
        }
    }

    pub fn reset(&mut self) {
        self.deep_fryers.iter_mut().for_each(|df| df.reset());
        self.dry_gain.reset();
        self.wet_gain.reset();
        self.overlap.reset();
        self.amp_bits.reset();
        self.phase_bits.reset();
        self.sig_bits.reset();
    }
}
