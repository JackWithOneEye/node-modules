use std::{collections::HashMap, f32::consts::TAU};

use rustfft::num_complex::Complex;

use super::{circular_buffer::CircularBuffer, fft_helper::FftHelper, lofi::BitCrusher};

const MIN_FFT_LEN_MAGNITUDE: u8 = 2;
const MAX_FFT_LEN_MAGNITUDE: u8 = 11;
const FRAC_1_2PI: f32 = 1.0 / TAU;

fn make_mag_to_len(capacity: usize) -> HashMap<u8, usize> {
    let mut mag_to_len: HashMap<u8, usize> = HashMap::with_capacity(capacity);
    for mag in MIN_FFT_LEN_MAGNITUDE..=MAX_FFT_LEN_MAGNITUDE {
        mag_to_len.insert(mag, 2_usize.pow(mag.into()));
    }
    mag_to_len
}

struct FrameOutputProcessParams {
    read_index: usize,
    read_offset: usize,
}

pub struct DeepFryer {
    fft_helpers: HashMap<u8, FftHelper>,
    windows: HashMap<u8, Vec<f32>>,
    mag_to_len: HashMap<u8, usize>,

    in_buffer: CircularBuffer,

    fft_buffer: Vec<Complex<f32>>,

    fft_in_buffer: Vec<f32>,
    fft_in_ctr: usize,
    fft_frame_len: usize,

    out_buffer: CircularBuffer,

    output_1_process_params: FrameOutputProcessParams,
    output_2_process_params: FrameOutputProcessParams,

    amp_bit_crusher: BitCrusher,
    phase_bit_crusher: BitCrusher,
    sig_bit_crusher: BitCrusher,

    // params
    magnitude: u8,
    overlap: f32,
    generations: u32,

    next_magnitude: u8,
}

impl DeepFryer {
    pub fn new() -> DeepFryer {
        let capacity = (MAX_FFT_LEN_MAGNITUDE - MIN_FFT_LEN_MAGNITUDE + 1) as usize;
        let mag_to_len = make_mag_to_len(capacity);
        let default_mag = 10_u8;
        let max_frame_len = *mag_to_len.get(&MAX_FFT_LEN_MAGNITUDE).unwrap();
        DeepFryer {
            fft_helpers: {
                let mut fft_helpers: HashMap<u8, FftHelper> = HashMap::with_capacity(capacity);
                for (mag, len) in &mag_to_len {
                    fft_helpers.insert(*mag, FftHelper::new(*len));
                }
                fft_helpers
            },
            windows: {
                let mut windows: HashMap<u8, Vec<f32>> = HashMap::with_capacity(capacity);
                for (mag, len) in &mag_to_len {
                    windows.insert(*mag, FftHelper::hanning_window(*len));
                }
                windows
            },

            in_buffer: CircularBuffer::new(max_frame_len * 2),

            fft_buffer: vec![Complex { re: 0.0, im: 0.0 }; max_frame_len],

            fft_in_buffer: vec![0.0; max_frame_len],
            fft_in_ctr: 0,
            fft_frame_len: *mag_to_len.get(&default_mag).unwrap(),

            out_buffer: CircularBuffer::new(max_frame_len * 4),
            output_1_process_params: FrameOutputProcessParams {
                read_index: 0,
                read_offset: 0,
            },
            output_2_process_params: FrameOutputProcessParams {
                read_index: 0,
                read_offset: 0,
            },

            amp_bit_crusher: BitCrusher::new(),
            phase_bit_crusher: BitCrusher::new(),
            sig_bit_crusher: BitCrusher::new(),

            magnitude: default_mag,
            overlap: 0.5,
            generations: 1,

            next_magnitude: default_mag,

            mag_to_len,
        }
    }

    pub fn process(&mut self, sample: f32) -> f32 {
        let overlap_width = ((self.fft_frame_len as f32) * self.overlap) as usize;
        let stride = self.fft_frame_len - overlap_width - 1;

        if self.fft_in_ctr > stride {
            self.fft_in_ctr = 0;
            self.process_fft();
            self.magnitude = self.next_magnitude;
            self.fft_frame_len = *self.mag_to_len.get(&self.magnitude).unwrap();
            if self.output_1_process_params.read_index >= self.fft_frame_len {
                self.output_1_process_params.read_index = 0;
                self.output_1_process_params.read_offset = 0;
                self.output_2_process_params.read_offset = self.fft_frame_len;
            } else if self.output_2_process_params.read_index >= self.fft_frame_len {
                self.output_2_process_params.read_index = 0;
                self.output_2_process_params.read_offset = 0;
                self.output_1_process_params.read_offset = self.fft_frame_len
            }
        }

        let o1_out = if self.output_1_process_params.read_index < self.fft_frame_len {
            let frame_start = self.fft_frame_len + self.output_1_process_params.read_offset;
            let buffer_out = self
                .out_buffer
                .read(frame_start - self.output_1_process_params.read_index);
            self.output_1_process_params.read_index += 1;
            buffer_out
        } else {
            0.0
        };

        let o2_out = if self.output_2_process_params.read_index < self.fft_frame_len {
            let frame_start = self.fft_frame_len + self.output_2_process_params.read_offset;
            let buffer_out = self
                .out_buffer
                .read(frame_start - self.output_2_process_params.read_index);
            self.output_2_process_params.read_index += 1;
            buffer_out
        } else {
            0.0
        };

        self.in_buffer.write(sample);
        self.fft_in_ctr += 1;

        o1_out + o2_out
    }

    pub fn reset(&mut self) {
        self.in_buffer.reset();
        self.out_buffer.reset();

        self.output_1_process_params.read_index = 0;
        self.output_1_process_params.read_offset = 0;

        self.output_2_process_params.read_index = 0;
        self.output_2_process_params.read_offset = 0;
    }

    pub fn set_amp_bits(&mut self, amp_bits: f32) {
        self.amp_bit_crusher.set_bits(amp_bits);
    }

    pub fn set_generations(&mut self, generations: u32) {
        self.generations = generations;
    }

    pub fn set_magnitude(&mut self, magnitude: u8) {
        if magnitude == self.next_magnitude {
            return;
        }
        if let Some(_) = self.mag_to_len.get(&magnitude) {
            self.next_magnitude = magnitude;
        }
    }

    pub fn set_overlap(&mut self, overlap: f32) {
        self.overlap = overlap;
    }

    pub fn set_phase_bits(&mut self, phase_bits: f32) {
        self.phase_bit_crusher.set_bits(phase_bits);
    }

    pub fn set_sig_bits(&mut self, sig_bits: f32) {
        self.sig_bit_crusher.set_bits(sig_bits);
    }

    fn process_fft(&mut self) {
        let frame_len = self.fft_frame_len;
        let window = self.windows.get(&self.magnitude).unwrap();
        let in_buffer = &self.in_buffer;

        self.fft_in_buffer[0..frame_len]
            .iter_mut()
            .enumerate()
            .for_each(|(i, sample)| *sample = in_buffer.read(frame_len - i) * window[i]);

        let fft_buffer = &mut self.fft_buffer[0..frame_len];
        FftHelper::real_to_complex(&self.fft_in_buffer[0..frame_len], fft_buffer);

        let fft_helper = self.fft_helpers.get_mut(&self.magnitude).unwrap();
        let amp_bit_crusher = &mut self.amp_bit_crusher;
        let phase_bit_crusher = &self.phase_bit_crusher;
        let sig_bit_crusher = &self.sig_bit_crusher;

        for _ in 0..self.generations {
            fft_helper.fft(fft_buffer, true);

            // process
            let max_freq = fft_buffer
                .iter()
                .map(|c| c.norm())
                .fold(0.0_f32, |a, b| a.max(b));
            amp_bit_crusher.set_modifier(2.0 * max_freq);
            fft_buffer.iter_mut().for_each(|f| {
                let (amp, phase) = f.to_polar();
                *f = Complex::from_polar(
                    amp_bit_crusher.process(amp),
                    phase_bit_crusher.process(phase * FRAC_1_2PI) * TAU,
                );
            });
            fft_helper.inv_fft(fft_buffer);

            // post process
            fft_buffer
                .iter_mut()
                .for_each(|c| c.re = sig_bit_crusher.process(c.re));
        }

        let out_buffer = &mut self.out_buffer;
        fft_buffer.iter().for_each(|c| out_buffer.write(c.re));
    }
}
