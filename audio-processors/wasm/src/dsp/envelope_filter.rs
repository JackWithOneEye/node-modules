// const TLD_AUDIO_ENVELOPE_ANALOG_TC: f32 = 0.368_f32.ln();

pub enum LevelCalcType {
    MS,
    PEAK,
    RMS,
}

enum State {
    ATK,
    REL,
}

pub struct EnvelopeFilterResult {
    pub envelope: f32,
    pub on_attack: bool,
}

pub struct EnvelopeFilter {
    attack_time: f32,
    clamp_to_one: bool,
    exp_factor: f32,
    level_calc_type: LevelCalcType,
    prev_envelope: f32,
    prev_state: State,
    release_time: f32,
}

impl EnvelopeFilter {
    pub fn new(sample_rate: f32, exp_factor_base: f32) -> EnvelopeFilter {
        EnvelopeFilter {
            attack_time: 0.0,
            clamp_to_one: false,
            exp_factor: exp_factor_base * 1000.0 / sample_rate,
            level_calc_type: LevelCalcType::PEAK,
            prev_envelope: 0.0,
            prev_state: State::REL,
            release_time: 0.0,
        }
    }

    pub fn process(&mut self, x: f32) -> EnvelopeFilterResult {
        let mut on_attack = false;
        let mut x = x.abs();

        match self.level_calc_type {
            LevelCalcType::MS => x *= x,
            LevelCalcType::RMS => x *= x,
            _ => (),
        }

        let prev_envelope = self.prev_envelope;
        let mut current_evelope: f32;

        if x > prev_envelope {
            current_evelope = self.attack_time * (prev_envelope - x) + x;
            on_attack = matches!(self.prev_state, State::REL);
            self.prev_state = State::ATK;
        } else {
            current_evelope = self.release_time * (prev_envelope - x) + x;
            self.prev_state = State::REL;
        }

        if self.clamp_to_one {
            current_evelope = current_evelope.min(1.0);
        }

        current_evelope = current_evelope.max(0.0);

        self.prev_envelope = current_evelope;

        if let LevelCalcType::RMS = self.level_calc_type {
            current_evelope = current_evelope.sqrt();
        }

        EnvelopeFilterResult {
            envelope: current_evelope,
            on_attack,
        }
    }

    pub fn reset(&mut self) {
        self.prev_envelope = 0.0;
        self.prev_state = State::REL;
    }

    pub fn set_attack(&mut self, attack_time_ms: f32) {
        self.attack_time = self.calc_env_time(attack_time_ms);
    }

    pub fn set_clamp_to_one(&mut self, clamp_to_one: bool) {
        self.clamp_to_one = clamp_to_one;
    }

    pub fn set_release(&mut self, release_time_ms: f32) {
        self.release_time = self.calc_env_time(release_time_ms);
    }

    pub fn set_type(&mut self, level_calc_type: LevelCalcType) {
        self.level_calc_type = level_calc_type;
    }

    fn calc_env_time(&self, time_ms: f32) -> f32 {
        if time_ms < 1.0e-3 {
            0.0
        } else {
            (self.exp_factor / time_ms).exp()
        }
    }
}
