use std::f32::consts::TAU;

pub struct DCBlocker {
    x1: f32,
    y1: f32,
    r: f32,
}

impl DCBlocker {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            x1: 0.0,
            y1: 0.0,
            r: (-TAU * 5.0 / sample_rate).exp(),
        }
    }

    pub fn process(&mut self, x: f32) -> f32 {
        let y = x - self.x1 + self.r * self.y1;
        self.x1 = x;
        self.y1 = y;
        y
    }

    pub fn reset(&mut self) {
        self.x1 = 0.0;
        self.y1 = 0.0;
    }
}
