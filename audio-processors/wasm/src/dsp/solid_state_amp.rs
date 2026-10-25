use std::f32::consts::PI;

use super::vasv_filter::VASVFilter;

const INPUT_HPF_FREQ: f32 = 30.0;
const BASS_FREQ: f32 = 120.0;
const MID_FREQ: f32 = 750.0;
const MID_Q: f32 = 0.7;
const TREBLE_FREQ: f32 = 2500.0;
const BRIGHT_FREQ: f32 = 3500.0;

/// Clean, neutral solid-state amp (JC-120 style): input coupling HPF, 3-band EQ that is flat at 0 dB,
/// optional bright boost and a rail clipper that is linear below its knee.
/// All gains are linear amplitudes; the input/master gains are applied by the caller.
pub struct SolidStateAmp {
    sample_rate_inv: f32,
    input_hpf: OnePole,
    bass: Shelf,
    mid: Peak,
    treble: Shelf,
    bright: Shelf,
    clipper: RailClipper,
}

impl SolidStateAmp {
    pub fn new(sample_rate: f32) -> SolidStateAmp {
        let sample_rate_inv = 1.0 / sample_rate;
        let mut input_hpf = OnePole::new();
        input_hpf.set_cutoff(INPUT_HPF_FREQ, sample_rate_inv);

        let mut amp = SolidStateAmp {
            sample_rate_inv,
            input_hpf,
            bass: Shelf::new(ShelfType::Low, BASS_FREQ),
            mid: Peak::new(sample_rate),
            treble: Shelf::new(ShelfType::High, TREBLE_FREQ),
            bright: Shelf::new(ShelfType::High, BRIGHT_FREQ),
            clipper: RailClipper::new(),
        };
        amp.set_bass(1.0);
        amp.set_mid(1.0);
        amp.set_treble(1.0);
        amp.set_bright(1.0);
        amp
    }

    pub fn set_bass(&mut self, gain: f32) {
        self.bass.set_gain(gain, self.sample_rate_inv);
    }

    pub fn set_mid(&mut self, gain: f32) {
        self.mid.set_gain(gain);
    }

    pub fn set_treble(&mut self, gain: f32) {
        self.treble.set_gain(gain, self.sample_rate_inv);
    }

    pub fn set_bright(&mut self, gain: f32) {
        self.bright.set_gain(gain, self.sample_rate_inv);
    }

    pub fn process(&mut self, x: f32) -> f32 {
        let mut y = x - self.input_hpf.process(x);
        y = self.bass.process(y);
        y = self.mid.process(y);
        y = self.treble.process(y);
        y = self.bright.process(y);
        self.clipper.process(y)
    }

    pub fn reset(&mut self) {
        self.input_hpf.reset();
        self.bass.filter.reset();
        self.mid.filter.reset();
        self.treble.filter.reset();
        self.bright.filter.reset();
        self.clipper.reset();
    }
}

/// Zero-delay-feedback (TPT) one-pole lowpass; highpass = x - lowpass.
struct OnePole {
    g: f32,
    s: f32,
}

impl OnePole {
    fn new() -> OnePole {
        OnePole { g: 0.0, s: 0.0 }
    }

    fn set_cutoff(&mut self, f_c: f32, sample_rate_inv: f32) {
        let g = (PI * f_c * sample_rate_inv).tan();
        self.g = g / (1.0 + g);
    }

    fn process(&mut self, x: f32) -> f32 {
        let v = (x - self.s) * self.g;
        let lp = v + self.s;
        self.s = lp + v;
        lp
    }

    fn reset(&mut self) {
        self.s = 0.0;
    }
}

enum ShelfType {
    Low,
    High,
}

/// First-order (Baxandall-like) shelf whose transition is centered on `f_c` for both boost and cut:
/// low shelf  y = x + (A - 1) * LP(f_c / sqrt(A)),
/// high shelf y = x + (A - 1) * HP(f_c * sqrt(A)).
struct Shelf {
    shelf_type: ShelfType,
    f_c: f32,
    gain: f32,
    filter: OnePole,
}

impl Shelf {
    fn new(shelf_type: ShelfType, f_c: f32) -> Shelf {
        Shelf {
            shelf_type,
            f_c,
            gain: 0.0,
            filter: OnePole::new(),
        }
    }

    fn set_gain(&mut self, gain: f32, sample_rate_inv: f32) {
        if self.gain == gain {
            return;
        }
        self.gain = gain;
        let f = match self.shelf_type {
            ShelfType::Low => self.f_c / gain.sqrt(),
            ShelfType::High => self.f_c * gain.sqrt(),
        };
        // keep the prewarped cutoff below Nyquist
        self.filter
            .set_cutoff(f.min(0.45 / sample_rate_inv), sample_rate_inv);
    }

    fn process(&mut self, x: f32) -> f32 {
        let lp = self.filter.process(x);
        let band = match self.shelf_type {
            ShelfType::Low => lp,
            ShelfType::High => x - lp,
        };
        x + (self.gain - 1.0) * band
    }
}

/// Peaking EQ with symmetric boost/cut:
/// H(s) = (s² + s·sqrt(G)/Q + 1) / (s² + s/(sqrt(G)·Q) + 1), i.e. y = x + (G - 1) · 2R · BP with 2R = 1/(sqrt(G)·Q).
struct Peak {
    gain: f32,
    damping: f32,
    filter: VASVFilter,
}

impl Peak {
    fn new(sample_rate: f32) -> Peak {
        Peak {
            gain: 0.0,
            damping: 0.0,
            filter: VASVFilter::new(sample_rate),
        }
    }

    fn set_gain(&mut self, gain: f32) {
        if self.gain == gain {
            return;
        }
        self.gain = gain;
        let q = MID_Q * gain.sqrt();
        self.damping = 1.0 / q;
        self.filter.set_params(MID_FREQ, q, 0.0, 0.0, 0.0, 0.0);
    }

    fn process(&mut self, x: f32) -> f32 {
        let (bp, _, _, _) = self.filter.process_multi_out(x);
        x + (self.gain - 1.0) * self.damping * bp
    }
}

const CLIP_KNEE: f64 = 0.7;
const ADAA_EPSILON: f64 = 1e-5;

/// Output stage hitting its supply rails: linear up to the knee, then a tanh curve that saturates at ±1.
/// Anti-aliased with first-order ADAA (antiderivative anti-aliasing), computed in f64 for precision.
struct RailClipper {
    x1: f64,
    ad1: f64,
}

impl RailClipper {
    fn new() -> RailClipper {
        RailClipper { x1: 0.0, ad1: 0.0 }
    }

    fn clip(x: f64) -> f64 {
        let a = x.abs();
        if a <= CLIP_KNEE {
            return x;
        }
        let range = 1.0 - CLIP_KNEE;
        (CLIP_KNEE + range * ((a - CLIP_KNEE) / range).tanh()).copysign(x)
    }

    fn antiderivative(x: f64) -> f64 {
        let a = x.abs();
        if a <= CLIP_KNEE {
            return 0.5 * x * x;
        }
        let range = 1.0 - CLIP_KNEE;
        let u = (a - CLIP_KNEE) / range;
        // ln(cosh(u)) without overflow for large u
        let ln_cosh = u + (-2.0 * u).exp().ln_1p() - std::f64::consts::LN_2;
        0.5 * CLIP_KNEE * CLIP_KNEE + CLIP_KNEE * (a - CLIP_KNEE) + range * range * ln_cosh
    }

    fn process(&mut self, x: f32) -> f32 {
        let x = x as f64;
        let ad = Self::antiderivative(x);
        let dx = x - self.x1;
        let y = if dx.abs() < ADAA_EPSILON {
            Self::clip(0.5 * (x + self.x1))
        } else {
            (ad - self.ad1) / dx
        };
        self.x1 = x;
        self.ad1 = ad;
        y as f32
    }

    fn reset(&mut self) {
        self.x1 = 0.0;
        self.ad1 = 0.0;
    }
}
