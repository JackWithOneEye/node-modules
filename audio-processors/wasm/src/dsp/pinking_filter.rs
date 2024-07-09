pub struct PinkingFilter {
    sample_rate: f32,
    state: (f32, f32, f32, f32, f32, f32, f32),
}

impl PinkingFilter {
    pub fn new(sample_rate: f32) -> PinkingFilter {
        PinkingFilter {
            sample_rate,
            state: (0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0),
        }
    }

    pub fn process(&mut self, x: f32) -> f32 {
        let (s0, s1, s2, s3, s4, s5, s6) = self.state;
        self.state = (
            0.99886 * s0 + x * 0.0555179,
            0.99332 * s1 + x * 0.0750759,
            0.96900 * s2 + x * 0.1538520,
            0.86650 * s3 + x * 0.3104856,
            0.55000 * s4 + x * 0.5329522,
            -0.7616 * s5 - x * 0.0168980,
            s6,
        );

        let y = (self.state.0
            + self.state.1
            + self.state.2
            + self.state.3
            + self.state.4
            + self.state.5
            + self.state.6
            + x * 0.5362)
            * 0.115830421;

        self.state.6 = x * 0.115926;

        y
    }

    pub fn reset(&mut self) {
        self.state = (0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    }
}
