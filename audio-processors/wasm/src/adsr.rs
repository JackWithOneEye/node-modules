use wasm_bindgen::prelude::*;

use crate::dsp::adsr_unit::ADSRUnit;

#[wasm_bindgen]
pub struct ADSR {
    adsr: ADSRUnit,
    buffer_frame_length: usize,
    note_on: bool,
    prev_flag: f32,
    prev_retrig: f32,

    // IO buffers
    trigger_input_buffer: Vec<f32>,
    retrigger_input_buffer: Vec<f32>,
    output_buffer: Vec<f32>,
}

#[wasm_bindgen]
impl ADSR {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize, sample_rate: f32) -> ADSR {
        crate::utils::set_panic_hook();

        ADSR {
            adsr: ADSRUnit::new(sample_rate),
            buffer_frame_length,
            note_on: false,
            prev_flag: 0.0,
            prev_retrig: 0.0,
            trigger_input_buffer: vec![0.0; buffer_frame_length],
            retrigger_input_buffer: vec![0.0; buffer_frame_length],
            output_buffer: vec![0.0; buffer_frame_length],
        }
    }

    pub fn trigger_input_ptr(&mut self) -> *mut f32 {
        &mut self.trigger_input_buffer[0]
    }

    pub fn retrigger_input_ptr(&mut self) -> *mut f32 {
        &mut self.retrigger_input_buffer[0]
    }

    pub fn output_ptr(&mut self) -> *mut f32 {
        &mut self.output_buffer[0]
    }

    pub fn process(&mut self, attack_sec: f32, decay_sec: f32, sustain_lvl: f32, release_sec: f32) {
        self.adsr
            .set_params(attack_sec, decay_sec, sustain_lvl, release_sec);

        for n in 0..self.buffer_frame_length {
            let flag = self.trigger_input_buffer[n];
            let retrigger = self.prev_retrig == 0.0 && self.retrigger_input_buffer[n] == 1.0;

            if (self.prev_flag == 0.0 && flag == 1.0) || (retrigger && self.note_on) {
                self.adsr.note_on();
                self.note_on = true;
            } else if self.prev_flag == 1.0 && flag == 0.0 {
                self.adsr.note_off();
                self.note_on = false;
            }
            self.prev_flag = flag;
            self.prev_retrig = self.retrigger_input_buffer[n];

            self.output_buffer[n] = self.adsr.get_next_sample();
        }
    }

    pub fn reset(&mut self) {
        self.adsr.reset();
        self.note_on = false;
        self.prev_flag = 0.0;
        self.prev_retrig = 0.0;
    }
}
