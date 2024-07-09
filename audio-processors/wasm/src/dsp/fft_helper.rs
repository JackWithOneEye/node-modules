use std::{f32::consts::TAU, sync::Arc};

use rustfft::{
    num_complex::{Complex, Complex32},
    num_traits::cast::FromPrimitive,
    Fft, FftPlanner,
};

pub struct FftHelper {
    fft: Arc<dyn Fft<f32>>,
    inv_fft: Arc<dyn Fft<f32>>,
    // scratch_buffer: Vec<Complex32>,
    scratch_buffer: Box<[Complex32]>,
    normalisation_factor: f32,

    len: usize,
}

impl FftHelper {
    pub fn new(len: usize) -> FftHelper {
        let mut planner = FftPlanner::<f32>::new();
        let buf: Vec<Complex32> = vec![Complex32 { re: 0.0, im: 0.0 }; len];

        FftHelper {
            fft: planner.plan_fft_forward(len),
            inv_fft: planner.plan_fft_inverse(len),
            scratch_buffer: buf.into_boxed_slice(),
            normalisation_factor: {
                let denom: f32 = FromPrimitive::from_usize(len).unwrap();
                1.0 / denom
            },
            len,
        }
    }

    pub fn fft(&mut self, buffer: &mut [Complex<f32>], normalise: bool) {
        assert!(buffer.len() == self.len);

        self.fft
            .process_with_scratch(buffer, &mut self.scratch_buffer);

        if normalise {
            buffer.iter_mut().for_each(|freq_bin| {
                *freq_bin *= self.normalisation_factor;
            });
        }
    }

    pub fn inv_fft(&mut self, buffer: &mut [Complex<f32>]) {
        assert!(buffer.len() == self.len);

        self.inv_fft
            .process_with_scratch(buffer, &mut self.scratch_buffer);
    }

    pub fn complex_to_real(input: &[Complex<f32>], output: &mut [f32]) {
        input
            .iter()
            .map(|c| c.re)
            .zip(output.iter_mut())
            .for_each(|(re, out)| *out = re);
    }

    pub fn hanning_window(len: usize) -> Vec<f32> {
        let two_pi = TAU;
        let denom = 1.0 / (len - 1) as f32;
        (0..len)
            .map(|i| 0.5 - (f32::cos((i as f32 * two_pi) * denom) * 0.5))
            .collect()
    }

    pub fn real_to_complex(input: &[f32], output: &mut [Complex<f32>]) {
        input.iter().zip(output.iter_mut()).for_each(|(i, out)| {
            out.re = *i;
            out.im = 0.0;
        });
    }
}
