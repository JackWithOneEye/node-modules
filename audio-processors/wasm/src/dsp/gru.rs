/// Single-unit GRU (gated recurrent unit) waveshaper, ported from the yaGRUd plugin
/// (https://github.com/JackWithOneEye/yaGRUd, `GRUUnit::processAudioSample`).
///
/// f[n] = sigmoid(W_f * x[n] + U_f * y[n-1] + b_f)
/// y[n] = (1 - f[n]) * y[n-1] + f[n] * tanh(W_h * x[n] + U_h * f[n] * y[n-1])
pub struct GruUnit {
    y1: f32,
}

pub struct GruCoefficients {
    pub w_f: f32,
    pub w_h: f32,
    pub u_f: f32,
    pub u_h: f32,
    pub b_f: f32,
}

impl GruUnit {
    pub fn new() -> Self {
        Self { y1: 0.0 }
    }

    pub fn process(&mut self, x: f32, c: &GruCoefficients) -> f32 {
        let f = sigmoid(c.w_f * x + c.u_f * self.y1 + c.b_f);
        let y = (1.0 - f) * self.y1 + f * (c.w_h * x + c.u_h * f * self.y1).tanh();
        self.y1 = y;
        y
    }

    pub fn reset(&mut self) {
        self.y1 = 0.0;
    }
}

#[inline(always)]
fn sigmoid(x: f32) -> f32 {
    1.0 / (1.0 + (-x).exp())
}
