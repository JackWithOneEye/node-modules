use std::f32::consts::TAU;

use crate::dsp::fast_math;

pub struct AllpassFilter {
    sample_rate: f32,
    sample_rate_inv: f32,

    f_c: f32,
    alpha: f32,
    state: f32,
}

impl AllpassFilter {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            sample_rate,
            sample_rate_inv: 1.0 / sample_rate,

            f_c: 1000.0,
            alpha: 0.0,
            state: 0.0,
        }
    }

    pub fn get_state(&self) -> (f32, f32) {
        (self.alpha, self.state)
    }

    pub fn set_params(&mut self, f_c: f32) {
        if f_c == self.f_c {
            return;
        }
        self.f_c = f_c;

        let wd = TAU * self.f_c;
        let wa = 2.0 * self.sample_rate * fast_math::tan(wd * self.sample_rate_inv * 0.5);
        let g = wa * self.sample_rate_inv * 0.5;
        self.alpha = g / (1.0 + g);
    }

    pub fn process(&mut self, x: f32) -> f32 {
        let x1 = self.alpha * (x - self.state);
        let x2 = x1 + self.state;

        self.state = x1 + x2;

        2.0 * x2 - x
    }

    pub fn reset(&mut self) {
        self.state = 0.0;
    }
}
