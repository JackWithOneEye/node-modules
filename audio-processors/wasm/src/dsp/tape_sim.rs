use super::vasv_filter::VASVFilter;

pub struct TapeSimFilter {
    bpf: VASVFilter,
}

const TAPE_BANDPASS_OUTPUT_GAIN: f32 = 3.98; // approx. 12dB

impl TapeSimFilter {
    pub fn new(sample_rate: f32) -> TapeSimFilter {
        let mut bpf = VASVFilter::new(sample_rate);
        bpf.set_params(725.0, 0.33, 1.0, 0.0, 0.0, 0.0);
        TapeSimFilter { bpf }
    }

    pub fn process(&mut self, x: f32) -> f32 {
        let mut y = tape_sim_soft_clipper(x);
        y = TAPE_BANDPASS_OUTPUT_GAIN * self.bpf.process(y);
        y
    }

    pub fn reset(&mut self) {
        self.bpf.reset();
    }
}


#[inline(always)]
fn tape_sim_soft_clipper(x: f32) -> f32 {
    x.tanh()
}
