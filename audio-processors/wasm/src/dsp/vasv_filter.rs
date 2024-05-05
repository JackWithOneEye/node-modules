use std::f32::consts::PI;

use crate::{dB_2_gain, gain_2_dB};

use super::fast_math;

fn peak_gain_for_q(q: f32) -> f32 {
    if q <= 0.707 {
        return 1.0;
    }

    let q2 = q * q;
    q2 / (q2 - 0.25).powf(0.5)
}

struct FilterCoeffs {
    alpha: f32,
    alpha_0: f32,
    half_peek: f32,
    r: f32,
    rho: f32,
    sigma: f32,
}

struct FilterParams {
    f_c: f32,
    q: f32,
    bsf_mix: f32,
    bpf_mix: f32,
    hpf_mix: f32,
    lpf_mix: f32,
}

pub struct VASVFilter {
    sample_rate: f32,
    sample_rate_inv: f32,
    coeffs: FilterCoeffs,
    params: FilterParams,
    state: (f32, f32),
}

impl VASVFilter {
    pub fn new(sample_rate: f32) -> VASVFilter {
        VASVFilter {
            sample_rate,
            sample_rate_inv: 1.0 / sample_rate,
            coeffs: FilterCoeffs {
                alpha: 0.0,
                alpha_0: 0.0,
                half_peek: 1.0,
                r: 0.707,
                rho: 1.414,
                sigma: 0.0,
            },
            params: FilterParams {
                f_c: 1000.0,
                q: 0.707,
                bsf_mix: 0.0,
                bpf_mix: 0.0,
                hpf_mix: 0.0,
                lpf_mix: 0.0,
            },
            state: (0.0, 0.0),
        }
    }

    pub fn reset(&mut self) {
        self.state = (0.0, 0.0);
    }

    pub fn set_params(
        &mut self,
        f_c: f32,
        q: f32,
        bpf_mix: f32,
        bsf_mix: f32,
        hpf_mix: f32,
        lpf_mix: f32,
    ) {
        let f_c_changed = self.params.f_c != f_c;
        let q_changed = self.params.q != q;
        self.params = FilterParams {
            f_c,
            q,
            bpf_mix,
            bsf_mix,
            hpf_mix,
            lpf_mix,
        };
        self.calc_coeffs(f_c_changed, q_changed);
    }

    pub fn process(&mut self, x: f32) -> f32 {
        let (bpf, bsf, hpf, lpf) = self.process_multi_out(x);

        self.params.bpf_mix * bpf
            + self.params.bsf_mix * bsf
            + self.params.hpf_mix * hpf
            + self.params.lpf_mix * lpf
    }

    pub fn process_multi_out(&mut self, x: f32) -> (f32, f32, f32, f32) {
        let alpha = self.coeffs.alpha;
        let (sn_1, sn_2) = self.state;

        let hpf = self.coeffs.alpha_0 * (x - self.coeffs.rho * sn_1 - sn_2);
        let bpf = alpha * hpf + sn_1;
        let lpf = alpha * bpf + sn_2;
        let bsf = hpf + lpf;
        let lpf2 = lpf + self.coeffs.sigma * sn_1;

        self.state = (alpha * hpf + bpf, alpha * bpf + lpf);

        (bpf, bsf, hpf, lpf2)
    }

    fn calc_coeffs(&mut self, f_c_changed: bool, q_changed: bool) {
        if !f_c_changed && !q_changed {
            return;
        }

        let sample_rate = self.sample_rate;
        let f_c = self.params.f_c;
        let q = self.params.q;

        if f_c_changed {
            self.coeffs.alpha = fast_math::tan(PI * f_c * self.sample_rate_inv);
            self.coeffs.sigma = (4.0 * f_c * f_c) / (self.coeffs.alpha * sample_rate * sample_rate);
        }

        if q_changed {
            let peak_db = gain_2_dB!(peak_gain_for_q(q));
            if peak_db > 0.0 {
                self.coeffs.half_peek = dB_2_gain!(-peak_db * 0.5);
            }
            self.coeffs.r = 1.0 / (2.0 * q);
        }

        let alpha = self.coeffs.alpha;
        let r = self.coeffs.r;

        self.coeffs.rho = 2.0 * r + alpha;
        self.coeffs.alpha_0 = 1.0 / (1.0 + 2.0 * r * alpha + alpha * alpha);
    }
}

pub fn pre_feedback_loop_hipass(sample_rate: f32) -> VASVFilter {
    let mut hipass = VASVFilter::new(sample_rate);
    hipass.set_params(100.0, 0.707, 0.0, 0.0, 1.0, 0.0);
    hipass
}


