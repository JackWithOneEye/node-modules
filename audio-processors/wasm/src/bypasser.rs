use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Bypasser {}

#[wasm_bindgen]
impl Bypasser {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Bypasser {
        crate::utils::set_panic_hook();
        Bypasser {}
    }

    pub fn process(&mut self, input: &[f32], output: &mut [f32]) {
        output.iter_mut().zip(input.iter()).for_each(|(o, i)| {
            *o = *i;
        })
    }
}
