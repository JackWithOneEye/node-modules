use crate::dsp::{
    allpass_filter::AllpassFilter, fast_math, phase_counter::PhaseCounter, vasv_filter::VASVFilter,
};
use std::f32::consts::TAU as TWO_PI;
use wasm_bindgen::prelude::*;
use wasm_utils::IOBufferPtrs;

#[wasm_bindgen]
#[derive(IOBufferPtrs)]
pub struct Phaser {
    buffer_frame_length: usize,
    channel_count: usize,

    sample_rate_inv: f32,
    phase_counter: PhaseCounter,

    stage1_apfs: Vec<AllpassFilter>,
    stage2_apfs: Vec<AllpassFilter>,
    stage3_apfs: Vec<AllpassFilter>,
    stage4_apfs: Vec<AllpassFilter>,

    // IO buffers
    #[io_buffer]
    input_buffer: Vec<f32>,
    #[io_buffer]
    output_buffer: Vec<f32>,

    // parameter buffers
    #[io_buffer]
    rate_buffer: Vec<f32>,
}

const ONE_THIRD: f32 = 1.0 / 3.0;

#[wasm_bindgen]
impl Phaser {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize, sample_rate: f32, channel_count: usize) -> Self {
        crate::utils::set_panic_hook();

        let mut stage1_apfs: Vec<AllpassFilter> = Vec::with_capacity(channel_count);
        let mut stage2_apfs: Vec<AllpassFilter> = Vec::with_capacity(channel_count);
        let mut stage3_apfs: Vec<AllpassFilter> = Vec::with_capacity(channel_count);
        let mut stage4_apfs: Vec<AllpassFilter> = Vec::with_capacity(channel_count);
        for _ in 0..channel_count {
            stage1_apfs.push(AllpassFilter::new(sample_rate));
            stage2_apfs.push(AllpassFilter::new(sample_rate));
            stage3_apfs.push(AllpassFilter::new(sample_rate));
            stage4_apfs.push(AllpassFilter::new(sample_rate));
        }
        Self {
            buffer_frame_length,
            channel_count,

            sample_rate_inv: 1.0 / sample_rate,
            phase_counter: PhaseCounter::new(),

            stage1_apfs,
            stage2_apfs,
            stage3_apfs,
            stage4_apfs,

            input_buffer: vec![0.0; buffer_frame_length * channel_count],
            output_buffer: vec![0.0; buffer_frame_length * channel_count],

            rate_buffer: vec![0.0; buffer_frame_length],
        }
    }

    pub fn process(&mut self) {
        let mut channel_offset = 0;
        for channel in 0..self.channel_count {
            let apf1 = &mut self.stage1_apfs[channel];
            let apf2 = &mut self.stage2_apfs[channel];
            let apf3 = &mut self.stage3_apfs[channel];
            let apf4 = &mut self.stage4_apfs[channel];

            for n in 0..self.buffer_frame_length {
                let sample_index = channel_offset + n;
                let sample = self.input_buffer[sample_index];

                let phase_incr = self.rate_buffer[n] * self.sample_rate_inv;
                let arg = self.phase_counter.advance(phase_incr);
                let bipolar = Self::triangle_wave(arg, phase_incr);
                let unipolar = bipolar.mul_add(0.5, 0.5);

                let f_min = 160.0;
                let f_max = 16000.0;

                let apf1_fc = f_min + (unipolar * (f_max - f_min));
                apf1.set_params(apf1_fc);
                let (alpha1, s1) = apf1.get_state();

                let apf2_fc = apf1_fc; // 33.0 + (unipolar * (3300.0 - 33.0));
                apf2.set_params(apf2_fc);
                let (alpha2, s2) = apf2.get_state();

                let apf3_fc = apf1_fc; // 48.0 + (unipolar * (4800.0 - 48.0));
                apf3.set_params(apf3_fc);
                let (alpha3, s3) = apf3.get_state();

                let apf4_fc = apf1_fc; // 98.0 + (unipolar * (9800.0 - 98.0));
                apf4.set_params(apf4_fc);
                let (alpha4, s4) = apf4.get_state();

                let gamma1 = alpha4;
                let gamma2 = alpha3 * gamma1;
                let gamma3 = alpha2 * gamma2;
                let gamma4 = alpha1 * gamma3;

                let fdbk = 0.25;
                let alpha0 = 1.0 / (1.0 + fdbk * gamma4);
                let s0 = gamma3 * s1 + gamma2 * s2 + gamma1 * s3 + s4;

                let sample = alpha0 * (sample - fdbk * s0);
                let apf1_out = apf1.process(sample);
                let apf2_out = apf2.process(apf1_out);
                let apf3_out = apf3.process(apf2_out);
                let apf4_out = apf4.process(apf3_out);

                self.output_buffer[sample_index] = 0.707 * (sample + apf4_out);
            }
            channel_offset += self.buffer_frame_length;
        }
    }

    pub fn reset(&mut self) {
        self.phase_counter.reset();

        self.stage1_apfs.iter_mut().for_each(AllpassFilter::reset);
        self.stage2_apfs.iter_mut().for_each(AllpassFilter::reset);
    }

    #[inline(always)]
    fn sine_wave(arg: f32) -> f32 {
        let arg1 = (arg + 0.25).fract();
        if arg1 < 0.5 {
            return fast_math::sin(TWO_PI * (arg1 - 0.25));
        }
        0.0 - fast_math::sin(TWO_PI * (arg1 - 0.75))
    }

    #[inline(always)]
    fn triangle_wave(arg: f32, increment: f32) -> f32 {
        let arg1 = (arg + 0.25).fract();
        let arg2 = (arg + 0.75).fract();
        let mut y = arg * 4.0;
        if y >= 3.0 {
            y -= 4.0;
        } else if y > 1.0 {
            y = 2.0 - y;
        }

        y +=
            4.0 * increment * (Self::polyblamp(arg1, increment) - Self::polyblamp(arg2, increment));
        y
    }

    #[inline(always)]
    fn polyblamp(arg: f32, increment: f32) -> f32 {
        if arg < increment {
            let t = arg / increment - 1.0;
            return -ONE_THIRD * (t * t * t);
        }

        if arg > 1.0 - increment {
            let t = (arg - 1.0) / increment + 1.0;
            return ONE_THIRD * (t * t * t);
        }

        0.0
    }
}
