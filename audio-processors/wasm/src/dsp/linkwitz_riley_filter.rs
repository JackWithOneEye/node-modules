 use std::f32::consts::{PI, SQRT_2};

 #[derive(Copy, Clone)]
pub enum LinkwitzRileyFilterType {
    Lowpass,
    Highpass,
    Allpass,
}

impl From<u8> for LinkwitzRileyFilterType {
     fn from(val: u8) -> Self {
        match val {
            0 => LinkwitzRileyFilterType::Lowpass,
            1 => LinkwitzRileyFilterType::Highpass,
            2 => LinkwitzRileyFilterType::Allpass,
            _ => panic!("Value {} cannot be transformed to LinkwitzRileyFilterType!", val),
        }
    }
}

pub struct LinkwitzRileyFilter {
    cutoff_freq: f32,
    filter_type: LinkwitzRileyFilterType,
    sample_rate: f32,
    state: (f32, f32, f32, f32),

    // coeffs
    g: f32,
    h: f32,
}

const R_2: f32 = SQRT_2;

impl LinkwitzRileyFilter {
    pub fn new(sample_rate: f32) -> LinkwitzRileyFilter {
        let g = LinkwitzRileyFilter::calc_g(1000.0, sample_rate);
        LinkwitzRileyFilter {
            cutoff_freq: 1000.0,
            filter_type: LinkwitzRileyFilterType::Lowpass,
            sample_rate,
            state: (0.0, 0.0, 0.0, 0.0),

            // coeffs
            g,
            h: LinkwitzRileyFilter::calc_h(g),
        }
    }

    pub fn process(&mut self, x: f32) -> f32 {
        let (s_1, s_2, s_3, s_4) = self.state;
        let g = self.g;

        let y_h = (x - (R_2 + g) * s_1 - s_2) * self.h;

        let y_b = g.mul_add(y_h, s_1);
        self.state.0 = g.mul_add(y_h, y_b);

        let y_l = g.mul_add(y_b, s_2);
        self.state.1 = g.mul_add(y_b, y_l);

        if let LinkwitzRileyFilterType::Allpass = self.filter_type {
            return y_l - R_2 * y_b + y_h;
        }

        let is_lowpass = matches!(self.filter_type, LinkwitzRileyFilterType::Lowpass);

        let base = if is_lowpass { y_l } else { y_h };

        let y_h2 = (base - (R_2 + g) * s_3 - s_4) * self.h;

        let y_b2 = g.mul_add(y_h2, s_3);
        self.state.2 = g.mul_add(y_h2, y_b2);

        let y_l2 = g.mul_add(y_b2, s_4);
        self.state.3 = g.mul_add(y_b2, y_l2);

        if is_lowpass {
            return y_l2;
        }
        y_h2
    }

    pub fn reset(&mut self) {
        self.state = (0.0, 0.0, 0.0, 0.0);
    }

    pub fn set_cutoff_frequency(&mut self, cutoff_freq: f32) {
        if self.cutoff_freq == cutoff_freq {
            return;
        }

        self.cutoff_freq = cutoff_freq;
        self.g = LinkwitzRileyFilter::calc_g(cutoff_freq, self.sample_rate);
        self.h = LinkwitzRileyFilter::calc_h(self.g);
    }

    pub fn set_filter_type(&mut self, filter_type: LinkwitzRileyFilterType) {
        self.filter_type = filter_type;
    }

    fn calc_g(cutoff_freq: f32, sample_rate: f32) -> f32 {
        (PI * cutoff_freq / sample_rate).tan()
    }

    fn calc_h(g: f32) -> f32 {
        1.0 / (1.0 + R_2 * g + g * g)
    }
}
