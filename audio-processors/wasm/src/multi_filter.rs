use crate::dsp::{smoothed_value::SmoothedValue, vasv_filter::VASVFilter};
use crate::{linear_smoothed_value, multiplicative_smoothed_value};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct MultiFilter {
    buffer_frame_length: usize,
    channel_count: usize,
    filters: Vec<VASVFilter>,

    // IO buffers
    input_buffer: Vec<f32>,
    bpf_out_buffer: Vec<f32>,
    bsf_out_buffer: Vec<f32>,
    hpf_out_buffer: Vec<f32>,
    lpf_out_buffer: Vec<f32>,

    // parameters
    f_c: SmoothedValue,
    q: SmoothedValue,
}

#[wasm_bindgen]
impl MultiFilter {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize, sample_rate: f32, channel_count: usize) -> MultiFilter {
        crate::utils::set_panic_hook();

        let mut filters: Vec<VASVFilter> = Vec::with_capacity(channel_count);
        for _ in 0..channel_count {
            filters.push(VASVFilter::new(sample_rate));
        }
        MultiFilter {
            buffer_frame_length,
            channel_count,
            filters,
            input_buffer: vec![0.0; buffer_frame_length * channel_count],
            bpf_out_buffer: vec![0.0; buffer_frame_length * channel_count],
            bsf_out_buffer: vec![0.0; buffer_frame_length * channel_count],
            hpf_out_buffer: vec![0.0; buffer_frame_length * channel_count],
            lpf_out_buffer: vec![0.0; buffer_frame_length * channel_count],

            f_c: multiplicative_smoothed_value!(1000.0, sample_rate, 0.1),
            q: linear_smoothed_value!(0.707, sample_rate, 0.1),
        }
    }

    pub fn input_ptr(&mut self) -> *mut f32 {
        &mut self.input_buffer[0]
    }

    pub fn bpf_out_ptr(&mut self) -> *mut f32 {
        &mut self.bpf_out_buffer[0]
    }

    pub fn bsf_out_ptr(&mut self) -> *mut f32 {
        &mut self.bsf_out_buffer[0]
    }

    pub fn hpf_out_ptr(&mut self) -> *mut f32 {
        &mut self.hpf_out_buffer[0]
    }

    pub fn lpf_out_ptr(&mut self) -> *mut f32 {
        &mut self.lpf_out_buffer[0]
    }

    pub fn process(&mut self, f_c: f32, q: f32) {
        self.f_c.set_target_value(f_c);
        self.q.set_target_value(q);

        for n in 0..self.buffer_frame_length {
            let next_f_c = self.f_c.get_next_value();
            let next_q = self.q.get_next_value();

            let mut channel_offset = 0;
            for channel in 0..self.channel_count {
                let channel_filter = &mut self.filters[channel];
                channel_filter.set_params(next_f_c, next_q, 1.0, 1.0, 1.0, 1.0);

                let sample_index = channel_offset + n;
                let sample = self.input_buffer[sample_index];
                let (bpf, bsf, hpf, lpf) = channel_filter.process_multi_out(sample);
                self.bpf_out_buffer[sample_index] = bpf;
                self.bsf_out_buffer[sample_index] = bsf;
                self.hpf_out_buffer[sample_index] = hpf;
                self.lpf_out_buffer[sample_index] = lpf;

                channel_offset += self.buffer_frame_length;
            }
        }
    }

    pub fn reset(&mut self) {
        self.filters.iter_mut().for_each(VASVFilter::reset);
        self.f_c.reset();
        self.q.reset();
    }
}
