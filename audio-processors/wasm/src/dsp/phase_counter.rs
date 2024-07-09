// use std::f32::consts::TAU as TWO_PI;

// const FRAC_1_2PI: f32 = 1.0 / TWO_PI;

pub struct PhaseCounter {
    phase: f32,
}

impl PhaseCounter {
    pub fn new() -> PhaseCounter {
        PhaseCounter { phase: 0.0 }
    }

    pub fn advance(&mut self, increment: f32) -> f32 {
        assert!(increment >= 0.0);

        let last = self.phase;
        let next = (last + increment).fract();
        self.phase = next;

        // let offset = phase_shift_rad * FRAC_1_2PI;
        // last + offset
        last
    }

    pub fn reset(&mut self) {
        self.phase = 0.0;
    }
}
