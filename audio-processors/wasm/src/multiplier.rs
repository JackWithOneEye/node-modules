use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Multiplier {
    // buffer_frame_length: usize,
    // channel_count: usize,

    // IO buffers
    input_1_buffer: Vec<f32>,
    input_2_buffer: Vec<f32>,
    output_buffer: Vec<f32>,
}

#[wasm_bindgen]
impl Multiplier {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize, channel_count: usize) -> Multiplier {
        crate::utils::set_panic_hook();
        Multiplier {
            // buffer_frame_length,
            // channel_count,
            input_1_buffer: vec![0.0; buffer_frame_length * channel_count],
            input_2_buffer: vec![0.0; buffer_frame_length * channel_count],
            output_buffer: vec![0.0; buffer_frame_length * channel_count],
        }
    }

    pub fn input_1_ptr(&mut self) -> *mut f32 {
        &mut self.input_1_buffer[0]
    }

    pub fn input_2_ptr(&mut self) -> *mut f32 {
        &mut self.input_2_buffer[0]
    }

    pub fn output_ptr(&mut self) -> *mut f32 {
        &mut self.output_buffer[0]
    }

    pub fn process(&mut self) {
        self.input_1_buffer
            .iter()
            .zip(self.input_2_buffer.iter())
            .map(|(in1, in2)| in1 * in2)
            .zip(self.output_buffer.iter_mut())
            .for_each(|(product, out)| *out = product);

        // for n in 0..(self.buffer_frame_length * self.channel_count) {
        //     self.output_buffer[n] = self.input_1_buffer[n] * self.input_2_buffer[n]
        // }
    }
}
