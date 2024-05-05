use super::{
    circular_buffer::CircularBuffer,
    tape_sim::TapeSimFilter,
    vasv_filter::{pre_feedback_loop_hipass, VASVFilter},
};

pub struct Delay {
    buffer: CircularBuffer,

    output_tape_sim_filter: TapeSimFilter,
    pre_feedback_hipass: VASVFilter,
}

impl Delay {
    pub fn new(sample_rate: f32, buffer_size_samples: usize) -> Delay {
        Delay {
            buffer: CircularBuffer::new(buffer_size_samples),

            output_tape_sim_filter: TapeSimFilter::new(sample_rate),
            pre_feedback_hipass: pre_feedback_loop_hipass(sample_rate),
        }
    }
    
    pub fn reset(&mut self) {
        self.buffer.reset();
        self.output_tape_sim_filter.reset();
        self.pre_feedback_hipass.reset();
    }

    pub fn process(
        &mut self,
        sample: f32,
        delay_samples: f32,
        feedback: f32,
        tape_sim: bool,
    ) -> f32 {
        // TODO modulation
        let mut buffer_out = self.buffer.read_fractional(delay_samples, false);

        if tape_sim {
            buffer_out = self.output_tape_sim_filter.process(buffer_out);
        }
        buffer_out = self.pre_feedback_hipass.process(buffer_out);

        let output = sample + feedback * buffer_out;
        self.buffer.write(output);
        output
    }
}
