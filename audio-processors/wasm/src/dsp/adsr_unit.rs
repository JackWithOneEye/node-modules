enum ADSRState {
    Idle,
    Attack,
    Decay,
    Sustain,
    Release,
}

pub struct ADSRUnit {
    envelope_val: f32,
    sample_rate: f32,
    state: ADSRState,

    attack_rate: f32,
    decay_rate: f32,
    release_rate: f32,

    // params
    attack_sec: f32,
    decay_sec: f32,
    sustain_lvl: f32,
    release_sec: f32,
}

impl ADSRUnit {
    pub fn new(sample_rate: f32) -> ADSRUnit {
        let mut adsr = ADSRUnit {
            envelope_val: 0.0,
            sample_rate,
            state: ADSRState::Idle,

            attack_rate: 0.0,
            decay_rate: 0.0,
            release_rate: 0.0,

            attack_sec: 0.1,
            decay_sec: 0.1,
            sustain_lvl: 1.0,
            release_sec: 1.0,
        };
        adsr.calc_rates();
        adsr
    }

    pub fn get_next_sample(&mut self) -> f32 {
        match self.state {
            ADSRState::Idle => 0.0,
            ADSRState::Attack => {
                self.envelope_val += self.attack_rate;
                if self.envelope_val >= 1.0 {
                    self.envelope_val = 1.0;
                    self.go_to_next_state();
                }
                self.envelope_val
            }
            ADSRState::Decay => {
                self.envelope_val -= self.decay_rate;
                if self.envelope_val <= self.sustain_lvl {
                    self.envelope_val = self.sustain_lvl;
                    self.go_to_next_state();
                }
                self.envelope_val
            }
            ADSRState::Sustain => {
                self.envelope_val = self.sustain_lvl;
                self.envelope_val
            }
            ADSRState::Release => {
                self.envelope_val -= self.release_rate;
                if self.envelope_val <= 0.0 {
                    self.go_to_next_state();
                }
                self.envelope_val
            }
        }
    }

    pub fn note_off(&mut self) {
        if let ADSRState::Idle = self.state {
            return;
        }
        if self.release_sec > 0.0 {
            self.release_rate = self.envelope_val / (self.release_sec * self.sample_rate);
            self.state = ADSRState::Release;
            return;
        }
        self.reset();
    }

    pub fn note_on(&mut self) {
        self.state = if self.attack_rate > 0.0 {
            ADSRState::Attack
        } else if self.decay_rate > 0.0 {
            self.envelope_val = 1.0;
            ADSRState::Decay
        } else {
            self.envelope_val = self.sustain_lvl;
            ADSRState::Sustain
        }
    }

    pub fn reset(&mut self) {
        self.envelope_val = 0.0;
        self.state = ADSRState::Idle;
    }

    pub fn set_params(
        &mut self,
        attack_sec: f32,
        decay_sec: f32,
        sustain_lvl: f32,
        release_sec: f32,
    ) {
        if self.attack_sec == attack_sec
            && self.decay_sec == decay_sec
            && self.sustain_lvl == sustain_lvl
            && self.release_sec == release_sec
        {
            return;
        }

        self.attack_sec = attack_sec;
        self.decay_sec = decay_sec;
        self.sustain_lvl = sustain_lvl;
        self.release_sec = release_sec;

        self.calc_rates();
    }

    fn go_to_next_state(&mut self) {
        match self.state {
            ADSRState::Attack if self.decay_rate > 0.0 => {
                self.state = ADSRState::Decay;
            }
            ADSRState::Attack => {
                self.state = ADSRState::Sustain;
            }
            ADSRState::Decay => {
                self.state = ADSRState::Sustain;
            }
            ADSRState::Release => {
                self.reset();
            }
            _ => (),
        }
    }

    fn calc_rates(&mut self) {
        self.attack_rate = if self.attack_sec > 0.0 {
            1.0 / (self.attack_sec * self.sample_rate)
        } else {
            -1.0
        };

        self.decay_rate = if self.decay_sec > 0.0 {
            (1.0 - self.sustain_lvl) / (self.decay_sec * self.sample_rate)
        } else {
            -1.0
        };

        self.release_rate = if self.release_rate > 0.0 {
            self.sustain_lvl / (self.release_sec * self.sample_rate)
        } else {
            -1.0
        };

        match self.state {
            ADSRState::Attack => {
                if self.attack_rate <= 0.0 {
                    self.go_to_next_state();
                }
            }
            ADSRState::Decay => {
                if self.decay_rate <= 0.0 || self.envelope_val <= self.sustain_lvl {
                    self.go_to_next_state();
                }
            }
            ADSRState::Release => {
                if self.release_rate <= 0.0 {
                    self.go_to_next_state();
                }
            }
            _ => (),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_unit_is_idle_and_returns_zero() {
        let mut adsr = ADSRUnit::new(48000.0);
        assert_eq!(adsr.get_next_sample(), 0.0);
    }

    #[test]
    fn note_on_triggers_attack_then_decay_to_sustain() {
        let sample_rate = 10.0;
        let attack_sec = 0.1;
        let decay_sec = 0.1;
        let sustain_lvl = 0.5;
        let release_sec = 0.1;

        let mut adsr = ADSRUnit::new(sample_rate);
        adsr.set_params(attack_sec, decay_sec, sustain_lvl, release_sec);

        adsr.note_on();

        // First sample after note_on: attack adds attack_rate, should reach 1.0
        let s1 = adsr.get_next_sample();
        assert!((s1 - 1.0).abs() < 0.01, "expected ~1.0 after attack, got {}", s1);

        // Next sample should be in decay, dropping toward sustain
        let s2 = adsr.get_next_sample();
        assert!(s2 < 1.0, "expected decay below 1.0, got {}", s2);
        assert!((s2 - sustain_lvl).abs() < 0.01, "expected ~0.5 sustain, got {}", s2);

        // Subsequent samples stay at sustain
        let s3 = adsr.get_next_sample();
        assert!((s3 - sustain_lvl).abs() < 0.01, "expected sustain hold, got {}", s3);

        // note_off triggers release
        adsr.note_off();
        let s4 = adsr.get_next_sample();
        assert!(s4 < sustain_lvl, "expected release below sustain, got {}", s4);

        // Eventually reaches zero
        for _ in 0..100 {
            let s = adsr.get_next_sample();
            if s <= 0.0 {
                break;
            }
        }
        assert_eq!(adsr.get_next_sample(), 0.0);
    }

    #[test]
    fn zero_attack_and_zero_decay_enters_sustain_immediately() {
        let mut adsr = ADSRUnit::new(48000.0);
        adsr.set_params(0.0, 0.0, 0.7, 0.5);

        adsr.note_on();
        let s = adsr.get_next_sample();
        assert!((s - 0.7).abs() < 0.01, "expected immediate sustain at 0.7, got {}", s);
    }
}
