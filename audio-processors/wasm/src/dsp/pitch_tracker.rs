use crate::reset_vec;
use pitch_detection::detector::{yin::YINDetector, PitchDetector};

use super::linkwitz_riley_filter::{LinkwitzRileyFilter, LinkwitzRileyFilterType};

// const YIN_MIN_FREQ_HZ: f32 = 40.0;
// const YIN_WINDOW_SIZE_SEC: f32 = 0.025;

pub struct PitchTracker {
    buffer: Vec<f32>,
    harmonic_threshold: f32,
    pre_filter: LinkwitzRileyFilter,
    prev_result: f32,
    sample_rate: f32,
    yin: YINDetector<f32>,
    yin_buffer_size: usize,
    yin_input_buffer: Vec<f32>,
    wrap_mask: usize,
    write_counter: usize,
    write_index: usize,
}

impl PitchTracker {
    pub fn new(sample_rate: f32, window_size_samples: usize) -> PitchTracker {
        // let yin_size = (sample_rate * window_length_sec).trunc() as usize;
        let yin_padding = window_size_samples / 4;
        let yin_buffer_size = window_size_samples;
        let buffer_size = yin_buffer_size.next_power_of_two();

        PitchTracker {
            buffer: vec![0.0; buffer_size],
            harmonic_threshold: 0.1,
            pre_filter: {
                let mut pre_filter = LinkwitzRileyFilter::new(sample_rate);
                pre_filter.set_filter_type(LinkwitzRileyFilterType::Lowpass);
                pre_filter.set_cutoff_frequency(1400.0);
                pre_filter
            },
            prev_result: 0.0,
            sample_rate,
            yin: YINDetector::new(window_size_samples, yin_padding),
            yin_buffer_size,
            yin_input_buffer: vec![0.0; yin_buffer_size],
            wrap_mask: (buffer_size - 1),
            write_counter: 0,
            write_index: 0,
        }
    }

    pub fn get_delay_samples(self) -> usize {
        self.yin_buffer_size
    }

    pub fn get_pitch(&mut self, sample: f32) -> f32 {
        let mut result = self.prev_result;

        if self.write_counter == self.yin_buffer_size {
            let read_start_index = self.write_index - self.yin_buffer_size;
            for i in 0..self.yin_buffer_size {
                let rd_idx = (read_start_index + i) & self.wrap_mask;
                self.yin_input_buffer[i] = self.buffer[rd_idx];
            }
            let pitch = self.yin.get_pitch(
                &self.yin_input_buffer,
                self.sample_rate as usize,
                0.001,
                self.harmonic_threshold,
            );
            match pitch {
                None => (),
                Some(pitch) => {
                    if pitch.frequency > 0.0 {
                        result = pitch.frequency
                    }
                }
            }
            self.write_counter = 0;
        }
        self.prev_result = result;

        self.push_sample(sample);
        result
    }

    pub fn reset(&mut self) {
        reset_vec![self.buffer];
        self.pre_filter.reset();
        self.prev_result = 0.0;
        reset_vec![self.yin_input_buffer];
        self.write_counter = 0;
        self.write_index = 0;
    }

    pub fn set_harmonic_threshold(&mut self, harmonic_threshold: f32) {
        self.harmonic_threshold = harmonic_threshold;
    }

    fn push_sample(&mut self, sample: f32) {
        let sample = self.pre_filter.process(sample);

        self.buffer[self.write_index] = sample;
        self.write_index += 1;
        self.write_index &= self.wrap_mask;
        self.write_counter += 1;
    }
}
