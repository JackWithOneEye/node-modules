use rustfft::num_traits::ToPrimitive;
use std::f32::consts::TAU as TWO_PI;
use wasm_bindgen::prelude::*;

use crate::{
    dsp::{fast_math, phase_counter::PhaseCounter, smoothed_value::SmoothedValue},
    linear_smoothed_value,
};

const FRAC_1_2PI: f32 = 1.0 / TWO_PI;

#[wasm_bindgen]
pub struct LFO {
    // sample_rate: f32,
    sample_rate_inv: f32,

    phase_counter: PhaseCounter,

    frequency: f32,
    phase_increment: SmoothedValue,

    rsh_counter: u32,
    rsh_state: SmoothedValue,

    phase_shift_buffer: Vec<f32>,
    output_buffer: Vec<f32>,
}

const ONE_THIRD: f32 = 1.0 / 3.0;

#[wasm_bindgen]
impl LFO {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize, sample_rate: f32) -> LFO {
        LFO {
            // sample_rate,
            sample_rate_inv: 1.0 / sample_rate,

            phase_counter: PhaseCounter::new(),

            frequency: 0.0,
            phase_increment: linear_smoothed_value!(0.0, sample_rate, 0.05),

            rsh_counter: 0,
            rsh_state: linear_smoothed_value!(0.0, sample_rate, 0.0001),

            phase_shift_buffer: vec![0.0; buffer_frame_length],
            output_buffer: vec![0.0; buffer_frame_length],
        }
    }

    pub fn phase_shift_ptr(&mut self) -> *mut f32 {
        &mut self.phase_shift_buffer[0]
    }

    pub fn output_ptr(&mut self) -> *mut f32 {
        &mut self.output_buffer[0]
    }

    pub fn process(&mut self, frequency: f32, polarity: LFOPolarity, waveform: LFOWaveform) {
        if self.frequency != frequency {
            self.phase_increment
                .set_target_value(frequency * self.sample_rate_inv);
            self.frequency = frequency;
        }

        for (out, phase_shift) in self
            .output_buffer
            .iter_mut()
            .zip(self.phase_shift_buffer.iter().map(|v| v * FRAC_1_2PI))
        {
            let increment = self.phase_increment.get_next_value();

            let mut arg = self.phase_counter.advance(increment);
            arg = (arg + phase_shift).fract();

            let bipolar = match waveform {
                LFOWaveform::Sine => Self::sine_wave(arg),
                LFOWaveform::Triangle => Self::triangle_wave(arg, increment),
                LFOWaveform::Ramp => Self::ramp_wave(arg, increment),
                LFOWaveform::Saw => Self::saw_wave(arg, increment),
                LFOWaveform::Square => Self::square_wave(arg, increment),
                LFOWaveform::RSH => {
                    let thresh = 1.0 / (2.0 * increment);
                    self.rsh_counter = if self.rsh_counter >= thresh.to_u32().unwrap() {
                        self.rsh_state.set_target_value(
                            js_sys::Math::random().to_f32().unwrap().mul_add(2.0, -1.0),
                        );
                        0
                    } else {
                        self.rsh_counter + 1
                    };
                    self.rsh_state.get_next_value()
                }
            };

            *out = match polarity {
                LFOPolarity::Bipolar => bipolar,
                LFOPolarity::Unipolar => bipolar.mul_add(0.5, 0.5),
            }
        }
    }

    pub fn reset(&mut self) {
        self.phase_counter.reset();
        self.phase_increment.reset();

        self.rsh_counter = 0;
        self.rsh_state.set_current_and_target_value(0.0);
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

        // 1.0 - 2.0 * (2.0 * arg - 1.0).abs()
        // let abs = (arg + arg - 1.0).abs();
        // 1.0 - (abs + abs)
        y
    }

    #[inline(always)]
    fn ramp_wave(arg: f32, increment: f32) -> f32 {
        1.0 - (arg + arg) + Self::polyblep(arg, increment)
    }

    #[inline(always)]
    fn saw_wave(arg: f32, increment: f32) -> f32 {
        let arg1 = (arg + 0.5).fract();
        (arg1 + arg1) - 1.0 - Self::polyblep(arg1, increment)
    }

    #[inline(always)]
    fn square_wave(arg: f32, increment: f32) -> f32 {
        let arg1 = (arg + 0.5).fract();
        let mut y: f32 = if arg < 0.5 { 1.0 } else { -1.0 };
        y += Self::polyblep(arg, increment) - Self::polyblep(arg1, increment);
        y
    }

    #[inline(always)]
    fn polyblep(arg: f32, increment: f32) -> f32 {
        if arg < increment {
            let t = arg / increment - 1.0;
            return -(t * t);
        }

        if arg > 1.0 - increment {
            let t = (arg - 1.0) / increment + 1.0;
            return t * t;
        }

        0.0
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

#[wasm_bindgen]
pub enum LFOPolarity {
    Bipolar,
    Unipolar,
}

#[wasm_bindgen]
pub enum LFOWaveform {
    Sine,
    Triangle,
    Saw,
    Ramp,
    Square,
    RSH,
}
