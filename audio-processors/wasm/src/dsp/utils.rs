use std::collections::HashMap;

const ONE_TWELFTH: f32 = 1.0 / 12.0;

pub fn make_fine_tune_factors() -> HashMap<i32, f32> {
    let mut fine_tune_factors: HashMap<i32, f32> = HashMap::with_capacity(201);
    for f in -100..=100 {
        fine_tune_factors.insert(f, 2.0_f32.powf((f as f32) * 0.01 * ONE_TWELFTH));
    }
    fine_tune_factors
}

pub fn make_pitch_factors() -> HashMap<i32, f32> {
    let mut pitch_factors: HashMap<i32, f32> = HashMap::with_capacity(25);
    for p in -12..=12 {
        pitch_factors.insert(p, 2.0_f32.powf((p as f32) * ONE_TWELFTH));
    }
    pitch_factors
}

#[macro_export]
macro_rules! reset_vec {
    ($vec: expr) => {
        for sample in $vec.iter_mut() {
            *sample = 0.0
        }
    };
}
