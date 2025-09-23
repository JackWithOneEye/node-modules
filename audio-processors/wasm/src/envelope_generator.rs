use js_sys::Array;
use wasm_bindgen::prelude::*;
use wasm_utils::IOBufferPtrs;
use web_sys::console::log;

use crate::dsp::analog_eg::AnalogEG;

#[wasm_bindgen]
#[derive(IOBufferPtrs)]
pub struct EnvelopeGenerator {
    envelope_generator: AnalogEG,
    buffer_frame_length: usize,
    note_on: bool,
    prev_flag: f32,
    prev_retrig: f32,

    #[io_buffer]
    trigger_input_buffer: Vec<f32>,
    #[io_buffer]
    retrigger_input_buffer: Vec<f32>,
    #[io_buffer]
    velocity_input_buffer: Vec<f32>,
    #[io_buffer]
    output_buffer: Vec<f32>,
}

#[wasm_bindgen]
impl EnvelopeGenerator {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize, sample_rate: f32) -> EnvelopeGenerator {
        crate::utils::set_panic_hook();

        EnvelopeGenerator {
            envelope_generator: AnalogEG::new(sample_rate),
            buffer_frame_length,
            note_on: false,
            prev_flag: 0.0,
            prev_retrig: 0.0,
            trigger_input_buffer: vec![0.0; buffer_frame_length],
            retrigger_input_buffer: vec![0.0; buffer_frame_length],
            velocity_input_buffer: vec![1.0; buffer_frame_length],
            output_buffer: vec![0.0; buffer_frame_length],
        }
    }

    pub fn process(
        &mut self,
        attack_msec: f32,
        decay_msec: f32,
        sustain_lvl: f32,
        release_msec: f32,
        apply_velocity: bool,
    ) {
        self.envelope_generator.set_params(
            attack_msec,
            decay_msec,
            sustain_lvl,
            release_msec,
            apply_velocity,
        );

        for n in 0..self.buffer_frame_length {
            let flag = self.trigger_input_buffer[n];
            let retrigger = self.prev_retrig == 0.0 && self.retrigger_input_buffer[n] == 1.0;
            let velocity = self.velocity_input_buffer[n].clamp(0.0, 1.0);

            if (self.prev_flag == 0.0 && flag == 1.0) || (retrigger && self.note_on) {
                let arr = Array::new();
                arr.push(&velocity.into());
                log(&arr);
                self.envelope_generator.note_on(velocity);
                self.note_on = true;
            } else if self.prev_flag == 1.0 && flag == 0.0 {
                self.envelope_generator.note_off();
                self.note_on = false;
            }
            self.prev_flag = flag;
            self.prev_retrig = self.retrigger_input_buffer[n];

            self.output_buffer[n] = self.envelope_generator.render();
        }
    }

    pub fn reset(&mut self) {
        self.envelope_generator.reset();
        self.note_on = false;
        self.prev_flag = 0.0;
        self.prev_retrig = 0.0;
    }
}
