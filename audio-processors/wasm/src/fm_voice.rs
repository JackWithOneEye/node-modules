use std::collections::HashMap;

use wasm_bindgen::prelude::*;

use crate::dsp::{
    fm_voice::{self, OperatorParams},
    utils::{make_fine_tune_factors, make_pitch_factors},
};

#[wasm_bindgen]
pub struct FMSynthesizer {
    buffer_frame_length: usize,
    channel_count: usize,

    pitch_factors: HashMap<i32, f32>,
    fine_tune_factors: HashMap<i32, f32>,

    voices: [fm_voice::FMVoice; 8],

    // parameter buffers
    operator_level_buffers: [Vec<f32>; 6],
    operator_attack_buffers: [Vec<f32>; 6],
    operator_decay_buffers: [Vec<f32>; 6],
    operator_sustain_buffers: [Vec<f32>; 6],
    operator_release_buffers: [Vec<f32>; 6],

    // gate/trigger state for each voice
    note_on: [bool; 8],
    prev_flag: [f32; 8],
    prev_retrig: [f32; 8],

    // IO buffers (8 voices for polyphony)
    frequency_input_buffer: Vec<f32>,
    trigger_input_buffer: Vec<f32>,
    retrigger_input_buffer: Vec<f32>,
    output_buffer: Vec<f32>,
}

#[wasm_bindgen]
impl FMSynthesizer {
    #[wasm_bindgen(constructor)]
    pub fn new(
        buffer_frame_length: usize,
        sample_rate: f32,
        channel_count: usize,
    ) -> FMSynthesizer {
        FMSynthesizer {
            buffer_frame_length,
            channel_count,

            pitch_factors: make_pitch_factors(2),
            fine_tune_factors: make_fine_tune_factors(),

            voices: [
                fm_voice::FMVoice::new(sample_rate),
                fm_voice::FMVoice::new(sample_rate),
                fm_voice::FMVoice::new(sample_rate),
                fm_voice::FMVoice::new(sample_rate),
                fm_voice::FMVoice::new(sample_rate),
                fm_voice::FMVoice::new(sample_rate),
                fm_voice::FMVoice::new(sample_rate),
                fm_voice::FMVoice::new(sample_rate),
            ],

            operator_level_buffers: [
                vec![1.0; buffer_frame_length],
                vec![1.0; buffer_frame_length],
                vec![1.0; buffer_frame_length],
                vec![1.0; buffer_frame_length],
                vec![1.0; buffer_frame_length],
                vec![1.0; buffer_frame_length],
            ],
            operator_attack_buffers: [
                vec![0.01; buffer_frame_length],
                vec![0.01; buffer_frame_length],
                vec![0.01; buffer_frame_length],
                vec![0.01; buffer_frame_length],
                vec![0.01; buffer_frame_length],
                vec![0.01; buffer_frame_length],
            ],
            operator_decay_buffers: [
                vec![0.0; buffer_frame_length],
                vec![0.0; buffer_frame_length],
                vec![0.0; buffer_frame_length],
                vec![0.0; buffer_frame_length],
                vec![0.0; buffer_frame_length],
                vec![0.0; buffer_frame_length],
            ],
            operator_sustain_buffers: [
                vec![1.0; buffer_frame_length],
                vec![1.0; buffer_frame_length],
                vec![1.0; buffer_frame_length],
                vec![1.0; buffer_frame_length],
                vec![1.0; buffer_frame_length],
                vec![1.0; buffer_frame_length],
            ],
            operator_release_buffers: [
                vec![0.1; buffer_frame_length],
                vec![0.1; buffer_frame_length],
                vec![0.1; buffer_frame_length],
                vec![0.1; buffer_frame_length],
                vec![0.1; buffer_frame_length],
                vec![0.1; buffer_frame_length],
            ],

            note_on: [false; 8],
            prev_flag: [0.0; 8],
            prev_retrig: [0.0; 8],

            frequency_input_buffer: vec![0.0; buffer_frame_length * 8],
            trigger_input_buffer: vec![0.0; buffer_frame_length * 8],
            retrigger_input_buffer: vec![0.0; buffer_frame_length * 8],
            output_buffer: vec![0.0; buffer_frame_length * channel_count],
        }
    }

    pub fn frequency_input_ptr(&mut self) -> *mut f32 {
        &mut self.frequency_input_buffer[0]
    }

    pub fn operator_level_ptr(&mut self, operator: usize) -> *mut f32 {
        &mut self.operator_level_buffers[operator][0]
    }

    pub fn operator_attack_ptr(&mut self, operator: usize) -> *mut f32 {
        &mut self.operator_attack_buffers[operator][0]
    }

    pub fn operator_decay_ptr(&mut self, operator: usize) -> *mut f32 {
        &mut self.operator_decay_buffers[operator][0]
    }

    pub fn operator_sustain_ptr(&mut self, operator: usize) -> *mut f32 {
        &mut self.operator_sustain_buffers[operator][0]
    }

    pub fn operator_release_ptr(&mut self, operator: usize) -> *mut f32 {
        &mut self.operator_release_buffers[operator][0]
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

    pub fn process(
        &mut self,
        algorithm: i32,
        op1_pitch_shift: i32,
        op2_pitch_shift: i32,
        op3_pitch_shift: i32,
        op4_pitch_shift: i32,
        op5_pitch_shift: i32,
        op6_pitch_shift: i32,
        op1_fine_tune: i32,
        op2_fine_tune: i32,
        op3_fine_tune: i32,
        op4_fine_tune: i32,
        op5_fine_tune: i32,
        op6_fine_tune: i32,
    ) {
        let op_1_pitch_factor = *self.pitch_factors.get(&op1_pitch_shift).unwrap_or(&1.0);
        let op_1_fine_tune_factor = *self.fine_tune_factors.get(&op1_fine_tune).unwrap_or(&1.0);
        let op_1_freq_mod = op_1_pitch_factor * op_1_fine_tune_factor;

        let op_2_pitch_factor = *self.pitch_factors.get(&op2_pitch_shift).unwrap_or(&1.0);
        let op_2_fine_tune_factor = *self.fine_tune_factors.get(&op2_fine_tune).unwrap_or(&1.0);
        let op_2_freq_mod = op_2_pitch_factor * op_2_fine_tune_factor;

        let op_3_pitch_factor = *self.pitch_factors.get(&op3_pitch_shift).unwrap_or(&1.0);
        let op_3_fine_tune_factor = *self.fine_tune_factors.get(&op3_fine_tune).unwrap_or(&1.0);
        let op_3_freq_mod = op_3_pitch_factor * op_3_fine_tune_factor;

        let op_4_pitch_factor = *self.pitch_factors.get(&op4_pitch_shift).unwrap_or(&1.0);
        let op_4_fine_tune_factor = *self.fine_tune_factors.get(&op4_fine_tune).unwrap_or(&1.0);
        let op_4_freq_mod = op_4_pitch_factor * op_4_fine_tune_factor;

        let op_5_pitch_factor = *self.pitch_factors.get(&op5_pitch_shift).unwrap_or(&1.0);
        let op_5_fine_tune_factor = *self.fine_tune_factors.get(&op5_fine_tune).unwrap_or(&1.0);
        let op_5_freq_mod = op_5_pitch_factor * op_5_fine_tune_factor;

        let op_6_pitch_factor = *self.pitch_factors.get(&op6_pitch_shift).unwrap_or(&1.0);
        let op_6_fine_tune_factor = *self.fine_tune_factors.get(&op6_fine_tune).unwrap_or(&1.0);
        let op_6_freq_mod = op_6_pitch_factor * op_6_fine_tune_factor;

        for n in 0..self.buffer_frame_length {
            self.output_buffer[n] = 0.0;
            // Process each voice
            let op1_params = OperatorParams {
                freq_mod: op_1_freq_mod,
                level: self.operator_level_buffers[0][n],
                env_attack: self.operator_attack_buffers[0][n],
                env_decay: self.operator_decay_buffers[0][n],
                env_sustain: self.operator_sustain_buffers[0][n],
                env_release: self.operator_release_buffers[0][n],
            };
            let op2_params = OperatorParams {
                freq_mod: op_2_freq_mod,
                level: self.operator_level_buffers[1][n],
                env_attack: self.operator_attack_buffers[1][n],
                env_decay: self.operator_decay_buffers[1][n],
                env_sustain: self.operator_sustain_buffers[1][n],
                env_release: self.operator_release_buffers[1][n],
            };
            let op3_params = OperatorParams {
                freq_mod: op_3_freq_mod,
                level: self.operator_level_buffers[2][n],
                env_attack: self.operator_attack_buffers[2][n],
                env_decay: self.operator_decay_buffers[2][n],
                env_sustain: self.operator_sustain_buffers[2][n],
                env_release: self.operator_release_buffers[2][n],
            };
            let op4_params = OperatorParams {
                freq_mod: op_4_freq_mod,
                level: self.operator_level_buffers[3][n],
                env_attack: self.operator_attack_buffers[3][n],
                env_decay: self.operator_decay_buffers[3][n],
                env_sustain: self.operator_sustain_buffers[3][n],
                env_release: self.operator_release_buffers[3][n],
            };
            let op5_params = OperatorParams {
                freq_mod: op_5_freq_mod,
                level: self.operator_level_buffers[4][n],
                env_attack: self.operator_attack_buffers[4][n],
                env_decay: self.operator_decay_buffers[4][n],
                env_sustain: self.operator_sustain_buffers[4][n],
                env_release: self.operator_release_buffers[4][n],
            };
            let op6_params = OperatorParams {
                freq_mod: op_6_freq_mod,
                level: self.operator_level_buffers[5][n],
                env_attack: self.operator_attack_buffers[5][n],
                env_decay: self.operator_decay_buffers[5][n],
                env_sustain: self.operator_sustain_buffers[5][n],
                env_release: self.operator_release_buffers[5][n],
            };
            let mut voice_offset = 0;
            for voice_idx in 0..8 {
                self.voices[voice_idx].set_algorithm(algorithm.into());

                self.voices[voice_idx].set_parameters([
                    &op1_params,
                    &op2_params,
                    &op3_params,
                    &op4_params,
                    &op5_params,
                    &op6_params,
                ]);

                let sample_index = voice_offset + n;
                let flag = self.trigger_input_buffer[sample_index];
                let retrigger = self.prev_retrig[voice_idx] == 0.0
                    && self.retrigger_input_buffer[sample_index] == 1.0;
                if (self.prev_flag[voice_idx] == 0.0 && flag == 1.0)
                    || (retrigger && self.note_on[voice_idx])
                {
                    self.voices[voice_idx].note_on();
                    self.note_on[voice_idx] = true;
                } else if self.prev_flag[voice_idx] == 1.0 && flag == 0.0 {
                    self.voices[voice_idx].note_off();
                    self.note_on[voice_idx] = false;
                }
                self.prev_flag[voice_idx] = flag;
                self.prev_retrig[voice_idx] = self.retrigger_input_buffer[sample_index];

                let voice_output =
                    self.voices[voice_idx].process(self.frequency_input_buffer[sample_index]);
                self.output_buffer[n] += voice_output;
                voice_offset += self.buffer_frame_length;
            }
        }

        let mut offset = self.buffer_frame_length;
        for _channel in 1..self.channel_count {
            offset += self.buffer_frame_length;
            for n in 0..self.buffer_frame_length {
                self.output_buffer[offset + n] = self.output_buffer[n];
            }
        }
    }

    pub fn reset(&mut self) {
        for voice_idx in 0..8 {
            self.note_on[voice_idx] = false;
            self.prev_flag[voice_idx] = 0.0;
            self.prev_retrig[voice_idx] = 0.0;
            self.voices[voice_idx].reset();
        }
    }
}
