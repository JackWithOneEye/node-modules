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
