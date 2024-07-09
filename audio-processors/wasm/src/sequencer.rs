use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Sequencer {
    current_step: usize,
    prev_gate_value: f32,

    gate_in_buffer: Vec<f32>,
    output_buffer: Vec<f32>,
    values_buffer: Vec<f32>,
}

#[wasm_bindgen]
impl Sequencer {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize) -> Sequencer {
        crate::utils::set_panic_hook();

        Sequencer {
            current_step: 0,
            prev_gate_value: -1.0,

            gate_in_buffer: vec![0.0; buffer_frame_length],
            output_buffer: vec![0.0; buffer_frame_length],
            values_buffer: vec![0.0; 32],
        }
    }

    pub fn gate_in_ptr(&mut self) -> *mut f32 {
        &mut self.gate_in_buffer[0]
    }

    pub fn output_ptr(&mut self) -> *mut f32 {
        &mut self.output_buffer[0]
    }

    pub fn values_ptr(&mut self) -> *mut f32 {
        &mut self.values_buffer[0]
    }

    pub fn process(&mut self, gate_thresh: f32, num_steps: usize) -> usize {
        let steps = num_steps.min(32);
        
        for (out, gate_value) in self
            .output_buffer
            .iter_mut()
            .zip(self.gate_in_buffer.iter())
        {
            if *gate_value > gate_thresh && self.prev_gate_value <= gate_thresh {
                self.current_step += 1;
                if self.current_step >= steps {
                    self.current_step = 0;
                }
            }
            self.prev_gate_value = *gate_value;
            *out = self.values_buffer[self.current_step];
        }

        self.current_step
    }

    pub fn reset(&mut self) {
        self.current_step = 0;
        self.prev_gate_value = 0.0;
    }
}
