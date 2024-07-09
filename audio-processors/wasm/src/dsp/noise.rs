use rand::Rng;

pub struct WhiteNoiseGenerator {
    rng: rand::rngs::ThreadRng,
}

impl WhiteNoiseGenerator {
    pub fn new() -> WhiteNoiseGenerator {
        WhiteNoiseGenerator {
            rng: rand::thread_rng(),
        }
    }

    pub fn next(&mut self) -> f32 {
        uniform_random_value(&mut self.rng)
    }
}

pub struct BrownianNoiseGenerator {
    buffer_size: usize,
    curr_position: usize,
    normalised_samples: Vec<f32>,
    rng: rand::rngs::ThreadRng,
    unnormalised_samples: Vec<f32>,
}

impl BrownianNoiseGenerator {
    pub fn new(buffer_size: usize) -> BrownianNoiseGenerator {
        BrownianNoiseGenerator {
            buffer_size,
            curr_position: buffer_size,
            normalised_samples: vec![0.0; buffer_size],
            unnormalised_samples: vec![0.0; buffer_size],
            rng: rand::thread_rng(),
        }
    }

    pub fn next(&mut self) -> f32 {
        if self.curr_position == self.buffer_size {
            self.generate_normalised_samples();
            self.curr_position = 0;
        }
        let sample = self.normalised_samples[self.curr_position];
        self.curr_position += 1;
        sample
    }

    pub fn reset(&mut self) {
        let last_unnormalised_sample = self.unnormalised_samples.last_mut().unwrap();
        *last_unnormalised_sample = 0.0;
        self.curr_position = self.buffer_size;
    }

    fn generate_normalised_samples(&mut self) {
        let init = self.unnormalised_samples.last().unwrap() + uniform_random_value(&mut self.rng);
        self.unnormalised_samples[0] = init;
        let mut min = init;
        let mut max = init;
        for i in 1..self.buffer_size {
            let next =
                0.95 * self.unnormalised_samples[i - 1] + uniform_random_value(&mut self.rng);
            self.unnormalised_samples[i] = next;

            if next < min {
                min = next;
            } else if next > max {
                max = next;
            }
        }

        let range_inv = 1.0 / (max - min);
        self.normalised_samples
            .iter_mut()
            .zip(self.unnormalised_samples.iter())
            .for_each(|(normalised, unnormalised)| {
                let diff = unnormalised - min;
                *normalised = 0.8 * ((diff + diff) * range_inv - 1.0);
            });
    }
}

#[inline(always)]
fn uniform_random_value(rng: &mut rand::rngs::ThreadRng) -> f32 {
    let rnd = rng.gen::<f32>();
    rnd + rnd - 1.0
}
