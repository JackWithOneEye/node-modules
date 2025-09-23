use std::f64::EPSILON;

use js_sys::Array;
use web_sys::console::log;

use crate::dsp::lofi;

enum EGState {
    Idle,
    Attack,
    Decay,
    Sustain,
    Release,
    Shutdown,
}

pub struct AnalogEG {
    sample_rate_millihz: f64,

    state: EGState,
    note_off: bool,
    envelope_output: f64,

    attack_coeff: f64,
    attack_offset: f64,
    attack_tco: f64,
    attack_coeff_base: f64,

    decay_coeff: f64,
    decay_offset: f64,
    decay_tco: f64,
    decay_coeff_base: f64,

    release_coeff: f64,
    release_offset: f64,
    release_tco: f64,
    release_coeff_base: f64,

    // params
    attack_msec: f64,
    decay_msec: f64,
    sustain_lvl: f64,
    release_msec: f64,
    apply_velocity: bool,
}

impl AnalogEG {
    pub fn new(sample_rate: f32) -> Self {
        let attack_tco = -1.5_f64.exp();
        let decay_tco = -4.95_f64.exp();
        let release_tco = decay_tco;
        Self {
            sample_rate_millihz: (sample_rate as f64) / 1000.0,

            state: EGState::Idle,
            note_off: true,
            envelope_output: 0.0,

            attack_coeff: 0.0,
            attack_offset: 0.0,
            attack_tco,
            attack_coeff_base: attack_tco / (1.0 + attack_tco),

            decay_coeff: 0.0,
            decay_offset: 0.0,
            decay_tco,
            decay_coeff_base: decay_tco / (1.0 + decay_tco),

            release_coeff: 0.0,
            release_offset: 0.0,
            release_tco,
            release_coeff_base: release_tco / (1.0 + release_tco),

            attack_msec: 1.0,
            decay_msec: 1.0,
            sustain_lvl: 1.0,
            release_msec: 1.0,
            apply_velocity: false,
        }
    }

    pub fn note_on(&mut self, velocity: f32) {
        // if let EGState::Idle = self.state {
        self.state = EGState::Attack;
        // }
        if self.apply_velocity {
            self.calc_attack_coeff(1.0 - velocity as f64);
        }
        self.note_off = false;
    }

    pub fn note_off(&mut self) {
        self.state = if self.envelope_output > 0.0 {
            EGState::Release
        } else {
            EGState::Idle
        };
        self.note_off = true;
    }

    pub fn render(&mut self) -> f32 {
        match self.state {
            EGState::Attack => {
                self.envelope_output = if self.attack_msec > 0.0 {
                    self.attack_offset + self.envelope_output * self.attack_coeff
                } else {
                    1.0
                };
                if self.envelope_output >= 1.0 {
                    self.envelope_output = 1.0;
                    self.state = EGState::Decay;
                }
            }
            EGState::Decay => {
                self.envelope_output = if self.decay_msec > 0.0 {
                    self.decay_offset + self.envelope_output * self.decay_coeff
                } else {
                    self.sustain_lvl
                };
                if self.envelope_output <= self.sustain_lvl {
                    self.envelope_output = self.sustain_lvl;
                    self.state = EGState::Sustain;
                }
            }
            EGState::Sustain => {
                self.envelope_output = self.sustain_lvl;
            }
            EGState::Release => {
                self.envelope_output = if self.release_msec > 0.0 {
                    self.release_offset + self.envelope_output * self.release_coeff
                } else {
                    0.0
                };
                if self.envelope_output <= 0.0 {
                    self.envelope_output = 0.0;
                    self.state = EGState::Idle;
                }
            }
            _ => {}
        };
        self.envelope_output as f32
    }

    pub fn reset(&mut self) {
        self.envelope_output = 0.0;
        self.state = EGState::Idle;
    }

    pub fn set_params(
        &mut self,
        attack_msec: f32,
        decay_msec: f32,
        sustain_lvl: f32,
        release_msec: f32,
        apply_velocity: bool,
    ) {
        let recalc_all = self.apply_velocity != apply_velocity && !apply_velocity;
        self.apply_velocity = apply_velocity;

        let sustain_lvl = sustain_lvl as f64;
        let sustain_changed = self.sustain_lvl != sustain_lvl;
        if sustain_changed {
            self.sustain_lvl = sustain_lvl;
        }

        let attack_msec = attack_msec as f64;
        if recalc_all || self.attack_msec != attack_msec {
            self.attack_msec = attack_msec;
            self.calc_attack_coeff(1.0);
        }

        let decay_msec = decay_msec as f64;
        if recalc_all || sustain_changed || self.decay_msec != decay_msec {
            self.decay_msec = decay_msec;
            self.calc_decay_coeff(1.0);
        }

        let release_msec = release_msec as f64;
        if recalc_all || self.release_msec != release_msec {
            self.release_msec = release_msec;
            self.calc_release_coeff(1.0);
        }
    }

    fn calc_attack_coeff(&mut self, scale: f64) {
        if self.attack_msec == 0.0 {
            return;
        }
        let samples = f64::max(10.0, self.sample_rate_millihz * self.attack_msec * scale);
        self.attack_coeff = self.attack_coeff_base.powf(1.0 / samples);
        self.attack_offset = (1.0 + self.attack_tco) * (1.0 - self.attack_coeff);
    }

    fn calc_decay_coeff(&mut self, scale: f64) {
        if self.decay_msec == 0.0 {
            return;
        }
        let samples = f64::max(1.0, self.sample_rate_millihz * self.decay_msec * scale);
        self.decay_coeff = self.decay_coeff_base.powf(1.0 / samples);
        self.decay_offset = (self.sustain_lvl - self.decay_tco) * (1.0 - self.decay_coeff);
    }

    fn calc_release_coeff(&mut self, scale: f64) {
        if self.release_msec == 0.0 {
            return;
        }
        let samples = f64::max(1.0, self.sample_rate_millihz * self.release_msec * scale);
        self.release_coeff = self.release_coeff_base.powf(1.0 / samples);
        self.release_offset = -self.release_tco * (1.0 - self.release_coeff);
    }
}
