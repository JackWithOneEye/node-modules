pub enum SmoothingType {
    Linear,
    Multiplicative,
}

pub struct SmoothedValue {
    countdown: i32,
    current_value: f32,
    smoothing_type: SmoothingType,
    steps_to_target: i32,
    step_width: f32,
    target_value: f32,
}

impl SmoothedValue {
    pub fn new(
        smoothing_type: SmoothingType,
        initial_value: f32,
        sample_rate: f32,
        ramp_length_seconds: f32,
    ) -> SmoothedValue {
        assert!(!(matches!(smoothing_type, SmoothingType::Multiplicative) && initial_value == 0.0));

        SmoothedValue {
            countdown: 0,
            current_value: initial_value,
            smoothing_type,
            steps_to_target: (ramp_length_seconds * sample_rate).trunc() as i32,
            step_width: 0.0,
            target_value: initial_value,
        }
    }

    // pub fn get_current_value(&mut self) -> f32 {
    //     return self.current_value;
    // }

    pub fn get_next_value(&mut self) -> f32 {
        if self.countdown <= 0 {
            return self.target_value;
        }

        self.countdown -= 1;

        if self.countdown > 0 {
            self.current_value = self.calc_next_value();
        } else {
            self.current_value = self.target_value;
        }

        self.current_value
    }

    // pub fn is_smoothing(&self) -> bool {
    //     self.countdown > 0
    // }

    // pub fn reset(&mut self) {
    //     self.set_current_and_target_value(self.target_value);
    // }

    pub fn set_current_and_target_value(&mut self, new_value: f32) {
        self.target_value = new_value;
        self.current_value = new_value;
        self.countdown = 0;
    }

    pub fn set_target_value(&mut self, target_value: f32) {
        if self.target_value == target_value {
            return;
        }

        if self.steps_to_target <= 0 {
            self.set_current_and_target_value(target_value);
            return;
        }

        assert!(
            !(matches!(self.smoothing_type, SmoothingType::Multiplicative) && target_value == 0.0)
        );

        self.target_value = target_value;
        self.countdown = self.steps_to_target;

        self.step_width = self.calc_step_width();
    }

    // pub fn skip(&mut self, number_of_samples: i32) -> f32 {
    //     if number_of_samples >= self.countdown {
    //         self.set_current_and_target_value(self.target_value);
    //         return self.target_value;
    //     }

    //     self.current_value = self.skip_current_value(number_of_samples);

    //     self.countdown -= number_of_samples;
    //     self.current_value
    // }

    fn calc_next_value(&mut self) -> f32 {
        match self.smoothing_type {
            SmoothingType::Linear => self.current_value + self.step_width,
            SmoothingType::Multiplicative => self.current_value * self.step_width,
        }
    }

    fn calc_step_width(&mut self) -> f32 {
        match self.smoothing_type {
            SmoothingType::Linear => {
                (self.target_value - self.current_value) / (self.countdown as f32)
            }
            SmoothingType::Multiplicative => ((self.target_value.abs().ln()
                - self.current_value.abs().ln())
                / (self.countdown as f32))
                .exp(),
        }
    }

    // fn skip_current_value(&mut self, number_of_samples: i32) -> f32 {
    //     match self.smoothing_type {
    //         SmoothingType::Linear => {
    //             self.current_value + self.step_width * (number_of_samples as f32)
    //         }
    //         SmoothingType::Multiplicative => {
    //             self.current_value * self.step_width.powi(number_of_samples)
    //         }
    //     }
    // }
}

#[macro_export]
macro_rules! linear_smoothed_value {
    ($initial_value: expr, $sample_rate: expr, $ramp_length_seconds: expr) => {
        $crate::dsp::smoothed_value::SmoothedValue::new(
            $crate::dsp::smoothed_value::SmoothingType::Linear,
            $initial_value,
            $sample_rate,
            $ramp_length_seconds,
        )
    };
}

#[macro_export]
macro_rules! multiplicative_smoothed_value {
    ($initial_value: expr, $sample_rate: expr, $ramp_length_seconds: expr) => {
        $crate::dsp::smoothed_value::SmoothedValue::new(
            $crate::dsp::smoothed_value::SmoothingType::Multiplicative,
            $initial_value,
            $sample_rate,
            $ramp_length_seconds,
        )
    };
}
