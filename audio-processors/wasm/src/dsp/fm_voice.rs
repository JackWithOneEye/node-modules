use std::f32::consts::{FRAC_PI_2, PI, TAU};

use super::{adsr_unit::ADSRUnit, fast_math, phase_counter::PhaseCounter};

const ONE_THIRD: f32 = 1.0 / 3.0;
const ONE_SIXTH: f32 = 1.0 / 6.0;

pub enum Algorithm {
    A1,
    A2,
    A3,
    A4,
    A5,
    A6,
    A7,
    A8,
    A9,
    A10,
    A11,
    A12,
    A13,
    A14,
    A15,
    A16,
    A17,
    A18,
    A19,
    A20,
    A21,
    A22,
    A23,
    A24,
    A25,
    A26,
    A27,
    A28,
    A29,
    A30,
    A31,
    A32,
}

impl From<i32> for Algorithm {
    fn from(value: i32) -> Self {
        match value {
            1 => Algorithm::A1,
            2 => Algorithm::A2,
            3 => Algorithm::A3,
            4 => Algorithm::A4,
            5 => Algorithm::A5,
            6 => Algorithm::A6,
            7 => Algorithm::A7,
            8 => Algorithm::A8,
            9 => Algorithm::A9,
            10 => Algorithm::A10,
            11 => Algorithm::A11,
            12 => Algorithm::A12,
            13 => Algorithm::A13,
            14 => Algorithm::A14,
            15 => Algorithm::A15,
            16 => Algorithm::A16,
            17 => Algorithm::A17,
            18 => Algorithm::A18,
            19 => Algorithm::A19,
            20 => Algorithm::A20,
            21 => Algorithm::A21,
            22 => Algorithm::A22,
            23 => Algorithm::A23,
            24 => Algorithm::A24,
            25 => Algorithm::A25,
            26 => Algorithm::A26,
            27 => Algorithm::A27,
            28 => Algorithm::A28,
            29 => Algorithm::A29,
            30 => Algorithm::A30,
            31 => Algorithm::A31,
            32 => Algorithm::A32,
            _ => Algorithm::A1, // Default to A1 for invalid values
        }
    }
}

struct Oscillator {
    phase_counter: PhaseCounter,
    sample_rate_inv: f32,
}

impl Oscillator {
    fn new(sample_rate: f32) -> Self {
        Self {
            phase_counter: PhaseCounter::new(),
            sample_rate_inv: 1.0 / sample_rate,
        }
    }

    fn advance(&mut self, frequency: f32, modulation: f32) -> f32 {
        let increment = frequency * self.sample_rate_inv;
        let mut arg = TAU * self.phase_counter.advance(increment) + modulation;
        arg += FRAC_PI_2;
        while arg >= TAU {
            arg -= TAU;
        }
        if arg < PI {
            fast_math::sin(arg - FRAC_PI_2)
        } else {
            -fast_math::sin(arg - FRAC_PI_2 - PI)
        }
    }

    fn reset(&mut self) {
        self.phase_counter.reset();
    }
}

pub struct OperatorParams {
    pub freq_mod: f32,
    pub level: f32,
    pub env_attack: f32,
    pub env_decay: f32,
    pub env_sustain: f32,
    pub env_release: f32,
}

struct Operator {
    osc: Oscillator,
    env: ADSRUnit,
    freq_mod: f32,
    level: f32,
}

impl Operator {
    fn new(sample_rate: f32) -> Self {
        Self {
            osc: Oscillator::new(sample_rate),
            env: ADSRUnit::new(sample_rate),
            freq_mod: 1.0,
            level: 1.0,
        }
    }

    fn get_next_sample(&mut self, frequency: f32, modulation: f32) -> f32 {
        let mut out = self.osc.advance(frequency * self.freq_mod, modulation);
        out *= self.level * self.env.get_next_sample();
        out
    }

    fn reset(&mut self) {
        self.osc.reset();
        self.env.reset();
    }

    fn set_params(&mut self, params: &OperatorParams) {
        self.freq_mod = params.freq_mod;
        self.level = params.level;
        self.env.set_params(
            params.env_attack,
            params.env_decay,
            params.env_sustain,
            params.env_release,
        );
    }

    fn note_on(&mut self) {
        self.env.note_on();
    }

    fn note_off(&mut self) {
        self.env.note_off();
    }
}

pub struct FMVoice {
    operators: [Operator; 6],
    op_prev_outs: [f32; 6],
    algorithm: Algorithm,
}

impl FMVoice {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            operators: [
                Operator::new(sample_rate),
                Operator::new(sample_rate),
                Operator::new(sample_rate),
                Operator::new(sample_rate),
                Operator::new(sample_rate),
                Operator::new(sample_rate),
            ],
            op_prev_outs: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
            algorithm: Algorithm::A1,
        }
    }

    pub fn note_off(&mut self) {
        for operator in self.operators.iter_mut() {
            operator.note_off();
        }
    }

    pub fn note_on(&mut self) {
        for operator in self.operators.iter_mut() {
            operator.note_on();
        }
    }

    pub fn process(&mut self, frequency: f32) -> f32 {
        match self.algorithm {
            Algorithm::A1 => self.a_1(frequency),
            Algorithm::A2 => self.a_2(frequency),
            Algorithm::A3 => self.a_3(frequency),
            Algorithm::A4 => self.a_4(frequency),
            Algorithm::A5 => self.a_5(frequency),
            Algorithm::A6 => self.a_6(frequency),
            Algorithm::A7 => self.a_7(frequency),
            Algorithm::A8 => self.a_8(frequency),
            Algorithm::A9 => self.a_9(frequency),
            Algorithm::A10 => self.a_10(frequency),
            Algorithm::A11 => self.a_11(frequency),
            Algorithm::A12 => self.a_12(frequency),
            Algorithm::A13 => self.a_13(frequency),
            Algorithm::A14 => self.a_14(frequency),
            Algorithm::A15 => self.a_15(frequency),
            Algorithm::A16 => self.a_16(frequency),
            Algorithm::A17 => self.a_17(frequency),
            Algorithm::A18 => self.a_18(frequency),
            Algorithm::A19 => self.a_19(frequency),
            Algorithm::A20 => self.a_20(frequency),
            Algorithm::A21 => self.a_21(frequency),
            Algorithm::A22 => self.a_22(frequency),
            Algorithm::A23 => self.a_23(frequency),
            Algorithm::A24 => self.a_24(frequency),
            Algorithm::A25 => self.a_25(frequency),
            Algorithm::A26 => self.a_26(frequency),
            Algorithm::A27 => self.a_27(frequency),
            Algorithm::A28 => self.a_28(frequency),
            Algorithm::A29 => self.a_29(frequency),
            Algorithm::A30 => self.a_30(frequency),
            Algorithm::A31 => self.a_31(frequency),
            Algorithm::A32 => self.a_32(frequency),
        }
    }

    pub fn reset(&mut self) {
        for operator in self.operators.iter_mut() {
            operator.reset();
        }
        self.op_prev_outs.fill(0.0);
    }

    pub fn set_algorithm(&mut self, algorithm: Algorithm) {
        self.algorithm = algorithm;
    }

    pub fn set_parameters(&mut self, op_params: [&OperatorParams; 6]) {
        for (i, params) in op_params.iter().enumerate() {
            self.operators[i].set_params(params);
        }
    }

    fn a_1(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o5_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o4_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o3_out) * 0.5
    }

    fn a_2(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, 0.0);
        self.op_prev_outs[5] = o6_out;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o5_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o4_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, self.op_prev_outs[1]);
        self.op_prev_outs[1] = (o2_out + self.op_prev_outs[1]) * 0.5;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o3_out) * 0.5
    }

    fn a_3(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o5_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, 0.0);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, o3_out);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o4_out) * 0.5
    }

    fn a_4(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[3]);
        self.op_prev_outs[5] = o6_out;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o5_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, 0.0);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, o3_out);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o4_out) * 0.5
    }

    fn a_5(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, 0.0);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o4_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o3_out + o5_out) * ONE_THIRD
    }

    fn a_6(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[4]);
        self.op_prev_outs[5] = o6_out;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, 0.0);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o4_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o3_out + o5_out) * ONE_THIRD
    }

    fn a_7(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, 0.0);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o4_out + o5_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o3_out) * 0.5
    }

    fn a_8(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, 0.0);
        self.op_prev_outs[5] = o6_out;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, self.op_prev_outs[3]);
        self.op_prev_outs[3] = (o4_out + self.op_prev_outs[3]) * 0.5;

        let o3_out = self.operators[2].get_next_sample(frequency, o4_out + o5_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o3_out) * 0.5
    }

    fn a_9(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, 0.0);
        self.op_prev_outs[5] = o6_out;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, 0.0);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o4_out + o5_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, self.op_prev_outs[1]);
        self.op_prev_outs[1] = (o2_out + self.op_prev_outs[1]) * 0.5;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o3_out) * 0.5
    }

    fn a_10(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, 0.0);
        self.op_prev_outs[5] = o6_out;

        let o5_out = self.operators[4].get_next_sample(frequency, 0.0);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o5_out + o6_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, self.op_prev_outs[2]);
        self.op_prev_outs[2] = (o3_out + self.op_prev_outs[2]) * 0.5;

        let o2_out = self.operators[1].get_next_sample(frequency, o3_out);
        self.op_prev_outs[1] = (o2_out + self.op_prev_outs[1]) * 0.5;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o4_out) * 0.5
    }

    fn a_11(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, 0.0);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o5_out + o6_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, 0.0);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, o3_out);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o4_out) * 0.5
    }

    fn a_12(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, 0.0);
        self.op_prev_outs[5] = o6_out;

        let o5_out = self.operators[4].get_next_sample(frequency, 0.0);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, 0.0);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o4_out + o5_out + o6_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, self.op_prev_outs[1]);
        self.op_prev_outs[1] = (o2_out + self.op_prev_outs[1]) * 0.5;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o3_out) * 0.5
    }

    fn a_13(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, 0.0);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, 0.0);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o4_out + o5_out + o6_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o3_out) * 0.5
    }

    fn a_14(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, 0.0);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o5_out + o6_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o4_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o3_out) * 0.5
    }

    fn a_15(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, 0.0);
        self.op_prev_outs[5] = o6_out;

        let o5_out = self.operators[4].get_next_sample(frequency, 0.0);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o5_out + o6_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o4_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, self.op_prev_outs[1]);
        self.op_prev_outs[1] = (o2_out + self.op_prev_outs[1]) * 0.5;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o3_out) * 0.5
    }

    fn a_16(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, 0.0);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o4_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out + o3_out + o5_out);
        self.op_prev_outs[0] = o1_out;

        o1_out
    }

    fn a_17(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, 0.0);
        self.op_prev_outs[5] = o6_out;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, 0.0);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o4_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, self.op_prev_outs[1]);
        self.op_prev_outs[1] = (o2_out + self.op_prev_outs[1]) * 0.5;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out + o3_out + o5_out);
        self.op_prev_outs[0] = o1_out;

        o1_out
    }

    fn a_18(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, 0.0);
        self.op_prev_outs[5] = o6_out;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o5_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, self.op_prev_outs[2]);
        self.op_prev_outs[2] = (o3_out + self.op_prev_outs[2]) * 0.5;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out + o3_out + o4_out);
        self.op_prev_outs[0] = o1_out;

        o1_out
    }

    fn a_19(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o6_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, 0.0);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, o3_out);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o4_out + o5_out) * ONE_THIRD
    }

    fn a_20(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, 0.0);
        self.op_prev_outs[5] = o6_out;

        let o5_out = self.operators[4].get_next_sample(frequency, 0.0);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o5_out + o6_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, self.op_prev_outs[2]);
        self.op_prev_outs[2] = (o3_out + self.op_prev_outs[2]) * 0.5;

        let o2_out = self.operators[1].get_next_sample(frequency, o3_out);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o3_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o2_out + o4_out) * ONE_THIRD
    }

    fn a_21(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, 0.0);
        self.op_prev_outs[5] = o6_out;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o6_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, self.op_prev_outs[2]);
        self.op_prev_outs[2] = (o3_out + self.op_prev_outs[2]) * 0.5;

        let o2_out = self.operators[1].get_next_sample(frequency, o3_out);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o3_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o2_out + o4_out + o5_out) * 0.25
    }

    fn a_22(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o6_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o6_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o3_out + o4_out + o5_out) * 0.25
    }

    fn a_23(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o6_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, 0.0);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, o3_out);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, 0.0);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o2_out + o4_out + o5_out) * 0.25
    }

    fn a_24(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o6_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o6_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, 0.0);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o2_out + o3_out + o4_out + o5_out) * 0.2
    }

    fn a_25(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o6_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, 0.0);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, 0.0);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o2_out + o3_out + o4_out + o5_out) * 0.2
    }

    fn a_26(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, 0.0);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o5_out + o6_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, 0.0);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, o3_out);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, 0.0);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o2_out + o4_out) * ONE_THIRD
    }

    fn a_27(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, 0.0);
        self.op_prev_outs[5] = o6_out;

        let o5_out = self.operators[4].get_next_sample(frequency, 0.0);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, o5_out + o6_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, self.op_prev_outs[2]);
        self.op_prev_outs[2] = (o3_out + self.op_prev_outs[2]) * 0.5;

        let o2_out = self.operators[1].get_next_sample(frequency, o3_out);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, 0.0);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o2_out + o4_out) * ONE_THIRD
    }

    fn a_28(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, 0.0);
        self.op_prev_outs[5] = o6_out;

        let o5_out = self.operators[4].get_next_sample(frequency, self.op_prev_outs[4]);
        self.op_prev_outs[4] = (o5_out + self.op_prev_outs[4]) * 0.5;

        let o4_out = self.operators[3].get_next_sample(frequency, o5_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o4_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, o2_out);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o3_out + o6_out) * ONE_THIRD
    }

    fn a_29(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, 0.0);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o4_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, 0.0);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o2_out + o3_out + o5_out) * 0.25
    }

    fn a_30(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, 0.0);
        self.op_prev_outs[5] = o6_out;

        let o5_out = self.operators[4].get_next_sample(frequency, self.op_prev_outs[4]);
        self.op_prev_outs[4] = (o5_out + self.op_prev_outs[4]) * 0.5;

        let o4_out = self.operators[3].get_next_sample(frequency, o5_out);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, o4_out);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, 0.0);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o2_out + o3_out + o6_out) * 0.25
    }

    fn a_31(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, o6_out);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, 0.0);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, 0.0);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, 0.0);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o2_out + o3_out + o4_out + o5_out + o6_out) * 0.2
    }

    fn a_32(&mut self, frequency: f32) -> f32 {
        let o6_out = self.operators[5].get_next_sample(frequency, self.op_prev_outs[5]);
        self.op_prev_outs[5] = (o6_out + self.op_prev_outs[5]) * 0.5;

        let o5_out = self.operators[4].get_next_sample(frequency, 0.0);
        self.op_prev_outs[4] = o5_out;

        let o4_out = self.operators[3].get_next_sample(frequency, 0.0);
        self.op_prev_outs[3] = o4_out;

        let o3_out = self.operators[2].get_next_sample(frequency, 0.0);
        self.op_prev_outs[2] = o3_out;

        let o2_out = self.operators[1].get_next_sample(frequency, 0.0);
        self.op_prev_outs[1] = o2_out;

        let o1_out = self.operators[0].get_next_sample(frequency, 0.0);
        self.op_prev_outs[0] = o1_out;

        (o1_out + o2_out + o3_out + o4_out + o5_out + o6_out) * ONE_SIXTH
    }
}
