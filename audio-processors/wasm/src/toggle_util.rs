use wasm_bindgen::prelude::*;

use crate::{dsp::smoothed_value::SmoothedValue, linear_smoothed_value};

#[wasm_bindgen]
pub struct ToggleUtil {
    a_gain: SmoothedValue,
    b_gain: SmoothedValue,
    is_a: bool,
}

#[wasm_bindgen]
impl ToggleUtil {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> ToggleUtil {
        crate::utils::set_panic_hook();
        ToggleUtil {
            a_gain: linear_smoothed_value!(1.0, sample_rate, 0.05),
            b_gain: linear_smoothed_value!(0.0, sample_rate, 0.05),
            is_a: true,
        }
    }

    pub fn mix(&mut self, a_sample: f32, b_sample: f32) -> f32 {
        a_sample * self.a_gain.get_next_value() + b_sample * self.b_gain.get_next_value()
    }

    pub fn to_a(&mut self) {
        if !self.is_a {
            self.a_gain.set_target_value(1.0);
            self.b_gain.set_target_value(0.0);
            self.is_a = true;
        }
    }

    pub fn to_b(&mut self) {
        if self.is_a {
            self.a_gain.set_target_value(0.0);
            self.b_gain.set_target_value(1.0);
            self.is_a = false;
        }
    }
}
