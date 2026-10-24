use wasm_bindgen::prelude::*;
use wasm_utils::IOBufferPtrs;

use crate::{
    dsp::{
        dc_blocker::DCBlocker,
        gru::{GruCoefficients, GruUnit},
        smoothed_value::SmoothedValue,
    },
    linear_smoothed_value,
};

/// GRU distortion from the yaGRUd plugin (`GRUBlock`):
/// input gain -> GRU unit -> optional DC filter -> output gain.
#[wasm_bindgen]
#[derive(IOBufferPtrs)]
pub struct Distortion {
    buffer_frame_length: usize,
    channel_count: usize,

    units: Vec<GruUnit>,
    dc_filters: Vec<DCBlocker>,

    #[io_buffer]
    input_buffer: Vec<f32>,
    #[io_buffer]
    output_buffer: Vec<f32>,

    // parameters (smoothed over 20ms like the plugin)
    input_gain: SmoothedValue,
    w_f: SmoothedValue,
    w_h: SmoothedValue,
    u_f: SmoothedValue,
    u_h: SmoothedValue,
    b_f: SmoothedValue,
    output_gain: SmoothedValue,
}

const SMOOTHING_SECONDS: f32 = 0.02;
const DC_FILTER_COEFFICIENT: f32 = 0.995;

#[wasm_bindgen]
impl Distortion {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize, sample_rate: f32, channel_count: usize) -> Distortion {
        crate::utils::set_panic_hook();

        Distortion {
            buffer_frame_length,
            channel_count,

            units: std::iter::repeat_with(GruUnit::new)
                .take(channel_count)
                .collect(),
            dc_filters: std::iter::repeat_with(|| {
                DCBlocker::with_coefficient(DC_FILTER_COEFFICIENT)
            })
            .take(channel_count)
            .collect(),

            input_buffer: vec![0.0; buffer_frame_length * channel_count],
            output_buffer: vec![0.0; buffer_frame_length * channel_count],

            input_gain: linear_smoothed_value!(0.0, sample_rate, SMOOTHING_SECONDS),
            w_f: linear_smoothed_value!(2.0, sample_rate, SMOOTHING_SECONDS),
            w_h: linear_smoothed_value!(1.0, sample_rate, SMOOTHING_SECONDS),
            u_f: linear_smoothed_value!(0.0, sample_rate, SMOOTHING_SECONDS),
            u_h: linear_smoothed_value!(0.0, sample_rate, SMOOTHING_SECONDS),
            b_f: linear_smoothed_value!(0.0, sample_rate, SMOOTHING_SECONDS),
            output_gain: linear_smoothed_value!(0.0, sample_rate, SMOOTHING_SECONDS),
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub fn process(
        &mut self,
        input_gain_db: f32,
        w_f: f32,
        w_h: f32,
        u_f: f32,
        u_h: f32,
        b_f: f32,
        output_gain_db: f32,
        dc_filter: bool,
    ) {
        self.input_gain.set_target_value(input_gain_db);
        self.w_f.set_target_value(w_f);
        self.w_h.set_target_value(w_h);
        self.u_f.set_target_value(u_f);
        self.u_h.set_target_value(u_h);
        self.b_f.set_target_value(b_f);
        self.output_gain.set_target_value(output_gain_db);

        for n in 0..self.buffer_frame_length {
            let input_gain = 10.0_f32.powf(self.input_gain.get_next_value() / 20.0);
            let output_gain = 10.0_f32.powf(self.output_gain.get_next_value() / 20.0);
            let coefficients = GruCoefficients {
                w_f: self.w_f.get_next_value(),
                w_h: self.w_h.get_next_value(),
                u_f: self.u_f.get_next_value(),
                u_h: self.u_h.get_next_value(),
                b_f: self.b_f.get_next_value(),
            };

            let mut channel_offset = 0;
            for channel in 0..self.channel_count {
                let i = n + channel_offset;
                let mut y =
                    self.units[channel].process(self.input_buffer[i] * input_gain, &coefficients);
                if dc_filter {
                    y = self.dc_filters[channel].process(y);
                }
                self.output_buffer[i] = y * output_gain;
                channel_offset += self.buffer_frame_length;
            }
        }
    }

    pub fn reset(&mut self) {
        self.units.iter_mut().for_each(GruUnit::reset);
        self.dc_filters.iter_mut().for_each(DCBlocker::reset);
        self.input_gain.reset();
        self.w_f.reset();
        self.w_h.reset();
        self.u_f.reset();
        self.u_h.reset();
        self.b_f.reset();
        self.output_gain.reset();
    }
}
