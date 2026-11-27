use wasm_bindgen::prelude::*;
use wasm_utils::IOBufferPtrs;

#[wasm_bindgen]
#[derive(IOBufferPtrs)]
pub struct Sequencer {
    /// `None` until the first clock, which plays step 0; values[0] is output meanwhile.
    current_step: Option<usize>,
    prev_gate_value: f32,

    #[io_buffer]
    gate_in_buffer: Vec<f32>,
    #[io_buffer]
    output_buffer: Vec<f32>,
    #[io_buffer]
    values_buffer: Vec<f32>,
}

#[wasm_bindgen]
impl Sequencer {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize) -> Sequencer {
        crate::utils::set_panic_hook();

        Sequencer {
            current_step: None,
            // a gate already high at start or after a reset is not a clock
            prev_gate_value: f32::INFINITY,

            gate_in_buffer: vec![0.0; buffer_frame_length],
            output_buffer: vec![0.0; buffer_frame_length],
            values_buffer: vec![0.0; 32],
        }
    }

    pub fn process(&mut self, gate_thresh: f32, num_steps: usize) -> usize {
        let steps = num_steps.min(32);
        
        for (out, gate_value) in self
            .output_buffer
            .iter_mut()
            .zip(self.gate_in_buffer.iter())
        {
            if *gate_value > gate_thresh && self.prev_gate_value <= gate_thresh {
                self.current_step = Some(self.current_step.map_or(0, |s| s + 1));
            }
            // also wraps a step left out of range by lowering num_steps
            if self.current_step.is_some_and(|s| s >= steps) {
                self.current_step = Some(0);
            }
            self.prev_gate_value = *gate_value;
            *out = self.values_buffer[self.current_step.unwrap_or(0)];
        }

        self.current_step.unwrap_or(0)
    }

    pub fn reset(&mut self) {
        self.current_step = None;
        self.prev_gate_value = f32::INFINITY;
    }
}
