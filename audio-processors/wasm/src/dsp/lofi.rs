pub struct BitCrusher {
    bits: f32,
    // step: f32,
    // step_inv: f32,
    max_value: f32,
    max_value_inv: f32,

    modifier: f32,
    modifier_inv: f32,
}

const MAX_BITS: f32 = 32.0;

impl BitCrusher {
    pub fn new() -> BitCrusher {
        // let step = 0.5_f32.powf(MAX_BITS - 1.0);
        let max_value = 2.0_f32.powf(MAX_BITS) - 1.0;
        BitCrusher {
            bits: MAX_BITS,
            // step,
            // step_inv: 1.0 / step,
            max_value,
            max_value_inv: 1.0 / max_value,
            modifier: 1.0,
            modifier_inv: 1.0,
        }
    }

    pub fn process(&self, x: f32) -> f32 {
        if self.bits < MAX_BITS {
            // self.step * ((x * self.step_inv) + 0.5).trunc()
            (x * self.max_value * self.modifier_inv).round() * self.max_value_inv * self.modifier
        } else {
            x
        }
    }

    pub fn set_bits(&mut self, bits: f32) {
        if self.bits == bits {
            return;
        }
        self.bits = bits;
        // self.step = 0.5_f32.powf(self.bits - 1.0);
        // self.step_inv = 1.0 / self.step;
        self.max_value = 2.0_f32.powf(bits) - 1.0;
        self.max_value_inv = 1.0 / self.max_value;
    }

    pub fn set_modifier(&mut self, modifier: f32) {
        self.modifier = modifier;
        self.modifier_inv = if modifier == 0.0 { 
            1.0
        } else {
            1.0 / modifier
        };
    }
}

pub struct Decimator {
    phasor: f32,
    reduction: f32,
    shift: f32,

    current_output: f32,
}

impl Decimator {
    pub fn new() -> Decimator {
        Decimator {
            phasor: 0.0,
            reduction: 1.0,
            shift: 0.0,
            current_output: 0.0,
        }
    }

    pub fn process(&mut self, x: f32) -> f32 {
        self.phasor += self.reduction;
        if self.phasor + self.shift >= 1.0 {
            self.phasor -= 1.0;
            self.current_output = x;
        }
        self.current_output
    }

    pub fn reset(&mut self) {
        self.phasor = 0.0;
        self.current_output = 0.0;
    }

    pub fn set_reduction(&mut self, reduction: f32) {
        self.reduction = reduction;
    }

    pub fn set_shift(&mut self, shift: f32) {
        self.shift = shift;
    }
}
