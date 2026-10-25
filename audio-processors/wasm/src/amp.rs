use wasm_bindgen::prelude::*;
use wasm_utils::IOBufferPtrs;

use crate::{
    dsp::{smoothed_value::SmoothedValue, solid_state_amp::SolidStateAmp},
    multiplicative_smoothed_value,
};

/// Neutral solid-state "pedal platform" amp:
/// gain -> input HPF -> bass/mid/treble EQ -> bright -> rail clipper -> master.
#[wasm_bindgen]
#[derive(IOBufferPtrs)]
pub struct Amp {
    buffer_frame_length: usize,
    channel_count: usize,

    amps: Vec<SolidStateAmp>,

    #[io_buffer]
    input_buffer: Vec<f32>,
    #[io_buffer]
    output_buffer: Vec<f32>,

    // parameters as linear gains; multiplicative smoothing ramps them linearly in dB
    gain: SmoothedValue,
    bass: SmoothedValue,
    mid: SmoothedValue,
    treble: SmoothedValue,
    bright: SmoothedValue,
    master: SmoothedValue,
}

const SMOOTHING_SECONDS: f32 = 0.02;
const BRIGHT_BOOST_DB: f32 = 6.0;

fn db_to_gain(db: f32) -> f32 {
    10.0_f32.powf(db * 0.05)
}

#[wasm_bindgen]
impl Amp {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_frame_length: usize, sample_rate: f32, channel_count: usize) -> Amp {
        crate::utils::set_panic_hook();

        Amp {
            buffer_frame_length,
            channel_count,

            amps: std::iter::repeat_with(|| SolidStateAmp::new(sample_rate))
                .take(channel_count)
                .collect(),

            input_buffer: vec![0.0; buffer_frame_length * channel_count],
            output_buffer: vec![0.0; buffer_frame_length * channel_count],

            gain: multiplicative_smoothed_value!(1.0, sample_rate, SMOOTHING_SECONDS),
            bass: multiplicative_smoothed_value!(1.0, sample_rate, SMOOTHING_SECONDS),
            mid: multiplicative_smoothed_value!(1.0, sample_rate, SMOOTHING_SECONDS),
            treble: multiplicative_smoothed_value!(1.0, sample_rate, SMOOTHING_SECONDS),
            bright: multiplicative_smoothed_value!(1.0, sample_rate, SMOOTHING_SECONDS),
            master: multiplicative_smoothed_value!(1.0, sample_rate, SMOOTHING_SECONDS),
        }
    }

    pub fn process(
        &mut self,
        gain_db: f32,
        bass_db: f32,
        mid_db: f32,
        treble_db: f32,
        bright: bool,
        master_db: f32,
    ) {
        self.gain.set_target_value(db_to_gain(gain_db));
        self.bass.set_target_value(db_to_gain(bass_db));
        self.mid.set_target_value(db_to_gain(mid_db));
        self.treble.set_target_value(db_to_gain(treble_db));
        self.bright
            .set_target_value(db_to_gain(if bright { BRIGHT_BOOST_DB } else { 0.0 }));
        self.master.set_target_value(db_to_gain(master_db));

        for n in 0..self.buffer_frame_length {
            let gain = self.gain.get_next_value();
            let master = self.master.get_next_value();
            // filters only recompute coefficients when their gain actually changes
            let bass = self.bass.get_next_value();
            let mid = self.mid.get_next_value();
            let treble = self.treble.get_next_value();
            let bright = self.bright.get_next_value();

            let mut channel_offset = 0;
            for amp in self.amps.iter_mut() {
                amp.set_bass(bass);
                amp.set_mid(mid);
                amp.set_treble(treble);
                amp.set_bright(bright);

                let i = n + channel_offset;
                self.output_buffer[i] = amp.process(self.input_buffer[i] * gain) * master;
                channel_offset += self.buffer_frame_length;
            }
        }
    }

    pub fn reset(&mut self) {
        self.amps.iter_mut().for_each(SolidStateAmp::reset);
        self.gain.reset();
        self.bass.reset();
        self.mid.reset();
        self.treble.reset();
        self.bright.reset();
        self.master.reset();
    }
}
