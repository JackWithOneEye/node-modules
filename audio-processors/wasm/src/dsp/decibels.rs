pub fn decibels_to_gain(decibels: f32, minus_infinity_db: f32) -> f32 {
    if decibels < minus_infinity_db {
        return 0.0;
    }
    10.0_f32.powf(decibels * 0.05)
}

pub fn gain_to_decibels(gain: f32, minus_infinity_db: f32) -> f32 {
    if gain <= 0.0 {
        return minus_infinity_db;
    }

    (gain.log10() * 20.0).max(minus_infinity_db)
}

#[macro_export]
macro_rules! dB_2_gain {
    ($decibels: expr) => {
        $crate::dsp::decibels::decibels_to_gain($decibels, -100.0)
    };
    ($decibels: expr, $minus_infinity_db: expr) => {
        $crate::decibels::decibels_to_gain($decibels, $minus_infinity_db)
    };
}

#[macro_export]
macro_rules! gain_2_dB {
    ($gain: expr) => {
        $crate::dsp::decibels::gain_to_decibels($gain, -100.0)
    };
    ($gain: expr, $minus_infinity_db: expr) => {
        $crate::decibels::gain_to_decibels($gain, $minus_infinity_db)
    };
}
