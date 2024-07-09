use crate::reset_vec;

pub fn cubic_interpolation(y0: f32, y1: f32, y2: f32, y3: f32, fraction: f32) -> f32 {
    let a0 = -0.5 * y0 + 1.5 * y1 - 1.5 * y2 + 0.5 * y3;
    let a1 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
    let a2 = -0.5 * y0 + 0.5 * y2;
    let a3 = y1;

    let fraction2 = fraction * fraction;
    a0 * fraction * fraction2 + a1 * fraction2 + a2 * fraction + a3
}

pub enum InterpolationType {
    Cubic,
    Linear,
}

pub struct CircularBuffer {
    // buffer: Vec<f32>,
    buffer: Box<[f32]>,
    write_index: usize,
    wrap_mask: usize,
}

impl CircularBuffer {
    pub fn new(length: usize) -> CircularBuffer {
        let buf_len = length.next_power_of_two();
        let buf: Vec<f32> = vec![0.0; buf_len];

        CircularBuffer {
            buffer: buf.into_boxed_slice(),
            write_index: 0,
            wrap_mask: buf_len - 1,
        }
    }

    pub fn write_index(&self) -> usize {
        self.write_index
    }

    pub fn write(&mut self, input: f32) {
        self.buffer[self.write_index] = input;
        self.write_index += 1;
        self.write_index &= self.wrap_mask;
    }

    pub fn read(&self, delay_in_samples: usize) -> f32 {
        // meant for read before write!
        let mut read_index = self.write_index - delay_in_samples;
        read_index &= self.wrap_mask;
        self.buffer[read_index]
    }

    // pub fn read_chunk(&self, delay_in_samples: usize) -> &[f32] {
    //     assert!(delay_in_samples > 0);
    //     // meant for read before write!
    //     let mut read_index = self.write_index - delay_in_samples;
    //     read_index &= self.wrap_mask;
    //     if read_index < self.write_index {
    //         return &self.buffer[read_index..self.write_index];
    //     }
    //     let first = &self.buffer[read_index..self.wrap_mask];
    //     let second = &self.buffer[..self.write_index];

    //     &self.buffer[read_index..self.wrap_mask]
    // }

    pub fn read_fractional(
        &self,
        delay_in_fractional_samples: f32,
        interpolation_type: InterpolationType,
    ) -> f32 {
        let fraction = delay_in_fractional_samples.fract();
        let delay_samples = delay_in_fractional_samples.trunc() as usize;
        let y1 = self.read(delay_samples);
        // if fraction == 0.0 {
        //     return y1;
        // }
        let y2 = self.read(delay_samples + 1);

        match interpolation_type {
            InterpolationType::Cubic => {
                let y0 = self.read(delay_samples - 1);
                let y3 = self.read(delay_samples + 2);
                cubic_interpolation(y0, y1, y2, y3, fraction)
            }
            InterpolationType::Linear => (1.0 - fraction) * y1 + fraction * y2,
        }
    }

    pub fn reset(&mut self) {
        reset_vec![self.buffer];
        self.write_index = 0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cubic_interpolation() {
        assert_eq!(1.0, cubic_interpolation(1.0, 1.0, 1.0, 1.0, 1.0));
    }
}
