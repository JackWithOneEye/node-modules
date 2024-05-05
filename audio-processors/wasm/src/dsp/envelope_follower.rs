use crate::{dsp::envelope_filter::EnvelopeFilter, dB_2_gain};

pub struct EnvelopeFollower {
    filter: EnvelopeFilter,
    modulation_max: f32,
    modulation_min: f32,
    sensitivity: f32,
    threshold_db: f32,
    threshold_lin: f32,
}

pub struct EnvelopeFollowerResult {
    pub envelope: f32,
    pub modulation: f32,
    pub on_attack: bool,
}

impl EnvelopeFollower {
    pub fn new(filter: EnvelopeFilter) -> EnvelopeFollower {
        EnvelopeFollower {
            filter,
            modulation_max: 1.0,
            modulation_min: 0.0,
            sensitivity: 0.0,
            threshold_db: 0.0,
            threshold_lin: 1.0,
        }
    }

    pub fn process(&mut self, x: f32) -> EnvelopeFollowerResult {
        let filter_result = self.filter.process(x);

        let delta = filter_result.envelope - self.threshold_lin;
        let modulation = if delta > 0.0 {
            (delta * self.sensitivity).max(0.0).min(1.0)
        } else {
            0.0
        };
        let modulation =
            modulation * (self.modulation_max - self.modulation_min) + self.modulation_min;

        EnvelopeFollowerResult {
            modulation,
            envelope: filter_result.envelope,
            on_attack: filter_result.on_attack,
        }
    }

    pub fn reset(&mut self) {
        self.filter.reset();
    }

    pub fn set_modulation_min_max(&mut self, modulation_min: f32, modulation_max: f32) {
        self.modulation_min = modulation_min;
        self.modulation_max = modulation_max;
    }

    pub fn set_threshold(&mut self, threshold_db: f32) {
        if self.threshold_db == threshold_db {
            return;
        }
        self.threshold_db = threshold_db;
        self.threshold_lin = dB_2_gain!(threshold_db);
    }

    pub fn set_sensitivity(&mut self, sensitivity: f32) {
        self.sensitivity = sensitivity;
    }
}
