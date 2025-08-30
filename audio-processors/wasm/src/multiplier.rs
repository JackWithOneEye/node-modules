use wasm_bindgen::prelude::*;
use wasm_utils::IOBufferPtrs;

#[wasm_bindgen]
#[derive(IOBufferPtrs)]
pub struct Multiplier {
    // buffer_frame_length: usize,
    // channel_count: usize,

    // IO buffers
    #[io_buffer]
    input_1_buffer: Vec<f32>,
    #[io_buffer]
    input_2_buffer: Vec<f32>,
    #[io_buffer]
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
