use crate::dsp::{allpass_filter::AllpassFilter, phase_counter::PhaseCounter};
use wasm_bindgen::prelude::*;
use wasm_utils::IOBufferPtrs;

#[wasm_bindgen]
#[derive(IOBufferPtrs)]
pub struct Phaser {
    buffer_frame_length: usize,
    channel_count: usize,

    phase_counter: PhaseCounter,

    apfs: [Vec<AllpassFilter>; MAX_STAGES],

    // IO buffers
    #[io_buffer]
    input_buffer: Vec<f32>,
    #[io_buffer]
    output_buffer: Vec<f32>,

    // parameter buffers
    #[io_buffer]
    modulation_buffer: Vec<f32>,
    #[io_buffer]
    depth_buffer: Vec<f32>,
    #[io_buffer]
    intensity_buffer: Vec<f32>,
}

const MAX_STAGES: usize = 6;

const FREQS_STD: [[f32; 2]; MAX_STAGES] = [
    [32.0, 1500.0],
    [68.0, 3400.0],
    [96.0, 4800.0],
    [212.0, 10000.0],
    [320.0, 16000.0],
    [636.0, 20480.0],
];

// const FREQS_IDEAL: [[f32; 2]; MAX_STAGES] = [
//     [16.0, 1600.0],
//     [33.0, 3300.0],
//     [48.0, 4800.0],
//     [98.0, 9800.0],
//     [160.0, 16000.0],
//     [260.0, 20480.0],
// ];

#[wasm_bindgen]
impl Phaser {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize, sample_rate: f32, channel_count: usize) -> Self {
        crate::utils::set_panic_hook();

        let mut apfs: [Vec<AllpassFilter>; MAX_STAGES] = Default::default();
        apfs.iter_mut().for_each(|stage| {
            *stage = std::iter::repeat_with(|| AllpassFilter::new(sample_rate))
                .take(channel_count)
                .collect();
        });
        Self {
            buffer_frame_length,
            channel_count,

            phase_counter: PhaseCounter::new(),

            apfs,

            input_buffer: vec![0.0; buffer_frame_length * channel_count],
            output_buffer: vec![0.0; buffer_frame_length * channel_count],

            modulation_buffer: vec![0.0; buffer_frame_length],
            depth_buffer: vec![0.0; buffer_frame_length],
            intensity_buffer: vec![0.0; buffer_frame_length],
        }
    }

    pub fn process(&mut self, stages: usize) {
        let mut channel_offset = 0;
        for channel in 0..self.channel_count {
            for n in 0..self.buffer_frame_length {
                let sample_index = channel_offset + n;
                let sample = self.input_buffer[sample_index];

                let mod_val = self.depth_buffer[n] * self.modulation_buffer[n];

                let mut alphas: [f32; MAX_STAGES] = [0.0; MAX_STAGES];
                let mut states: [f32; MAX_STAGES] = [0.0; MAX_STAGES];
                for i in 0..stages {
                    let fc = Self::calc_fc(mod_val, FREQS_STD[i][0], FREQS_STD[i][1]);
                    self.apfs[i][channel].set_params(fc);
                    let (alpha, s) = self.apfs[i][channel].get_state();
                    alphas[i] = alpha;
                    states[i] = s;
                }

                let mut gammas: [f32; MAX_STAGES] = [0.0; MAX_STAGES];
                gammas[0] = alphas[stages - 1];
                for i in 1..stages {
                    gammas[i] = alphas[stages - i - 1] * gammas[i - 1];
                }

                let fdbk = self.intensity_buffer[n];
                let alpha0 = 1.0 / (1.0 + fdbk * gammas[stages - 1]);
                let mut s0 = states[stages - 1];
                for i in 0..(stages - 1) {
                    s0 += gammas[stages - 2 - i] * states[i];
                }

                let mut stage_out = alpha0 * (sample - fdbk * s0);
                for i in 0..stages {
                    stage_out = self.apfs[i][channel].process(stage_out);
                }

                self.output_buffer[sample_index] = 0.707 * (sample + stage_out);
            }
            channel_offset += self.buffer_frame_length;
        }
    }

    pub fn reset(&mut self) {
        self.phase_counter.reset();

        for i in 0..MAX_STAGES {
            self.apfs[i].iter_mut().for_each(AllpassFilter::reset);
        }
    }

    #[inline(always)]
    fn calc_fc(mod_val: f32, min: f32, max: f32) -> f32 {
        min + (1.0 + mod_val) * 0.5 * (max - min)
    }
}
