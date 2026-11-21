//! Real-time MP3-style lossy codec used as a lo-fi effect (port of the core of
//! `lab/notebooks/mp3.py`): sine-windowed MDCT, lowpass from the bitrate, a
//! psychoacoustic model, the outer (noise shaping) and inner (rate) loops, the
//! MP3 power-law quantizer and a bit reservoir. Each channel is coded as mono.

use std::{f32::consts::PI, sync::Arc};

use rustdct::{DctPlanner, TransformType4};

pub const HOP_SIZES: [usize; 10] = [64, 128, 192, 256, 384, 576, 768, 1024, 1536, 2048];
pub const DEFAULT_HOP_SIZE_INDEX: usize = 5;
const MAX_HOP_SIZE: usize = 2048;
const HISTORY_LEN: usize = 2 * MAX_HOP_SIZE;

/// MP3 long-block scalefactor band edges at 44.1 kHz, as MDCT bin indices (N = 576).
const MP3_EDGES_44K: [f32; 23] = [
    0.0, 4.0, 8.0, 12.0, 16.0, 20.0, 24.0, 30.0, 36.0, 44.0, 52.0, 62.0, 74.0, 90.0, 110.0, 134.0,
    162.0, 196.0, 238.0, 288.0, 342.0, 418.0, 576.0,
];
/// Stereo bitrate (kbps) -> lowpass (Hz), approximately LAME's CBR table.
const LOWPASS: [(f32, f32); 17] = [
    (8.0, 2000.0),
    (16.0, 3700.0),
    (24.0, 3900.0),
    (32.0, 5500.0),
    (40.0, 7000.0),
    (48.0, 7500.0),
    (56.0, 10000.0),
    (64.0, 11000.0),
    (80.0, 13500.0),
    (96.0, 15100.0),
    (112.0, 15600.0),
    (128.0, 17000.0),
    (160.0, 17500.0),
    (192.0, 18600.0),
    (224.0, 19400.0),
    (256.0, 19700.0),
    (320.0, 20500.0),
];
const FULL_SCALE_DB_SPL: f32 = 96.0;
/// LAME: floor(v + 0.4054) rather than round(v); biases toward zero.
const ROUND_OFFSET: f32 = 0.4054;
/// Largest index the MP3 Huffman tables can code.
const IX_MAX: usize = 8191;
/// MP3: main_data_begin is 9 bits -> max 511 bytes back.
const RESERVOIR_MAX_BITS: f32 = 511.0 * 8.0;
/// Header/2 + side info of a mono 576-sample granule; scaled by N / 576 for other hop sizes.
const OVERHEAD_BITS_PER_GRANULE: f32 = 84.0;
const MAX_OUTER_ITERATIONS: usize = 20;
/// Inner loop: gains this far above the outer loop's choice quantize everything to zero.
const GAIN_CAP: i32 = 160;

fn bark(f: f32) -> f32 {
    13.0 * (0.00076 * f).atan() + 3.5 * (f / 7500.0).powi(2).atan()
}

/// Absolute threshold of hearing in dB SPL (Terhardt), clipped to a sane range.
fn ath_db(f: f32) -> f32 {
    let k = f.max(20.0) / 1000.0;
    let a = 3.64 * k.powf(-0.8) - 6.5 * (-0.6 * (k - 3.3).powi(2)).exp() + 1e-3 * k.powi(4);
    a.clamp(-10.0, 90.0)
}

/// Schroeder spreading function; dz = z_maskee - z_masker in Bark.
fn spreading_db(dz: f32) -> f32 {
    let d = dz + 0.474;
    15.81 + 7.5 * d - 17.5 * (1.0 + d * d).sqrt()
}

/// Lowpass for one channel's bitrate (the table is for stereo, so a mono channel uses 2x).
fn lowpass_hz(kbps: f32) -> f32 {
    let k = kbps * 2.0;
    if k <= LOWPASS[0].0 {
        return LOWPASS[0].1;
    }
    for w in LOWPASS.windows(2) {
        let ((k0, f0), (k1, f1)) = (w[0], w[1]);
        if k <= k1 {
            return f0 + (f1 - f0) * (k - k0) / (k1 - k0);
        }
    }
    LOWPASS[LOWPASS.len() - 1].1
}

/// Bits to code values 0..=max, i.e. ceil(log2(max + 1)).
fn bit_width(max: u32) -> u32 {
    32 - max.leading_zeros()
}

/// Rough Huffman length for one big_values magnitude (gamma-code-like), incl. sign.
fn vlc_len(v: u32) -> f32 {
    if v == 0 {
        1.0
    } else if v > 15 {
        9.0 + bit_width((v - 14).max(2) - 1) as f32
    } else {
        (2 * (31 - v.leading_zeros()) + 3) as f32
    }
}

/// Everything that depends on the hop size N (and the sample rate).
struct HopTables {
    n: usize,
    window: Vec<f32>,
    dct: Arc<dyn TransformType4<f32>>,
    dct_scale: f32,
    edges: Vec<usize>,
    /// Row-major [maskee * B + masker].
    spread: Vec<f32>,
    z: Vec<f32>,
    ath_band: Vec<f32>,
    sf_max: Vec<u32>,
}

impl HopTables {
    fn new(n: usize, sample_rate: f32, planner: &mut DctPlanner<f32>) -> HopTables {
        let bin_hz = sample_rate / (2 * n) as f32;

        let mut edges: Vec<usize> = MP3_EDGES_44K
            .iter()
            .map(|e| (e * (44100.0 / 2.0) / 576.0 / bin_hz).round() as usize)
            .filter(|&e| e > 0 && e < n)
            .collect();
        edges.push(0);
        edges.push(n);
        edges.sort_unstable();
        edges.dedup();
        let bands = edges.len() - 1;

        let lo_hz: Vec<f32> = edges[..bands].iter().map(|&e| e as f32 * bin_hz).collect();
        let z: Vec<f32> = (0..bands)
            .map(|b| bark(0.5 * (edges[b] + edges[b + 1]) as f32 * bin_hz))
            .collect();
        let mut spread = Vec::with_capacity(bands * bands);
        for maskee in 0..bands {
            for masker in 0..bands {
                spread.push(10f32.powf(spreading_db(z[maskee] - z[masker]) / 10.0));
            }
        }
        // energy of a full-scale sine in one frame of the orthonormal MDCT = N/2
        let reference = n as f32 / 2.0;
        let ath_band = (0..bands)
            .map(|b| {
                let quietest = (edges[b]..edges[b + 1])
                    .map(|k| {
                        let f = (k as f32 + 0.5) * bin_hz;
                        reference * 10f32.powf((ath_db(f) - FULL_SCALE_DB_SPL) / 10.0)
                    })
                    .fold(f32::INFINITY, f32::min);
                quietest * (edges[b + 1] - edges[b]) as f32
            })
            .collect();
        // per-band sf limits, like MP3 long blocks (slen 4 bits low, 3 bits mid, none in sfb21)
        let sf_max = lo_hz
            .iter()
            .map(|&lo| {
                if lo < 2370.0 {
                    15
                } else if lo < 16000.0 {
                    7
                } else {
                    0
                }
            })
            .collect();

        HopTables {
            n,
            window: (0..2 * n)
                .map(|i| (PI * (i as f32 + 0.5) / (2 * n) as f32).sin())
                .collect(),
            dct: planner.plan_dct4(n),
            dct_scale: (2.0 / n as f32).sqrt(),
            edges,
            spread,
            z,
            ath_band,
            sf_max,
        }
    }

    fn bands(&self) -> usize {
        self.edges.len() - 1
    }
}

/// Per-frame working buffers, shared by all channels.
struct Scratch {
    frame: Vec<f32>,
    coeffs: Vec<f32>,
    xr34: Vec<f32>,
    ix: Vec<u32>,
    quant: Vec<f32>,
    dct: Vec<f32>,
    energy: Vec<f32>,
    allowed: Vec<f32>,
    tonality: Vec<f32>,
    gain: Vec<f32>,
    needed: Vec<bool>,
    sf: Vec<u32>,
}

struct ChannelState {
    history: Vec<f32>,
    write_index: usize,
    hop_size_index: usize,
    ready: Vec<f32>,
    ready_len: usize,
    read_index: usize,
    overlap: Vec<f32>,
    reservoir: f32,
}

impl ChannelState {
    fn new(hop_size_index: usize) -> ChannelState {
        ChannelState {
            history: vec![0.0; HISTORY_LEN],
            write_index: 0,
            hop_size_index,
            ready: vec![0.0; MAX_HOP_SIZE],
            ready_len: HOP_SIZES[hop_size_index],
            read_index: 0,
            overlap: vec![0.0; MAX_HOP_SIZE],
            reservoir: 0.0,
        }
    }
}

pub struct MdctCodec {
    sample_rate: f32,
    tables: Vec<HopTables>,
    /// ix^(4/3) for every codable index.
    pow43: Vec<f32>,
    scratch: Scratch,
    channels: Vec<ChannelState>,

    // params
    kbps: f32,
    hop_size_index: usize,
}

impl MdctCodec {
    pub fn new(sample_rate: f32, channel_count: usize) -> MdctCodec {
        let mut planner = DctPlanner::new();
        let tables: Vec<HopTables> = HOP_SIZES
            .iter()
            .map(|&n| HopTables::new(n, sample_rate, &mut planner))
            .collect();
        let dct_scratch_len = tables
            .iter()
            .map(|t| t.dct.get_scratch_len())
            .max()
            .unwrap();
        let max_bands = tables.iter().map(|t| t.bands()).max().unwrap();

        MdctCodec {
            sample_rate,
            tables,
            pow43: (0..=IX_MAX).map(|i| (i as f32).powf(4.0 / 3.0)).collect(),
            scratch: Scratch {
                frame: vec![0.0; 2 * MAX_HOP_SIZE],
                coeffs: vec![0.0; MAX_HOP_SIZE],
                xr34: vec![0.0; MAX_HOP_SIZE],
                ix: vec![0; MAX_HOP_SIZE],
                quant: vec![0.0; MAX_HOP_SIZE],
                dct: vec![0.0; dct_scratch_len],
                energy: vec![0.0; max_bands],
                allowed: vec![0.0; max_bands],
                tonality: vec![0.0; max_bands],
                gain: vec![0.0; max_bands],
                needed: vec![false; max_bands],
                sf: vec![0; max_bands],
            },
            channels: (0..channel_count)
                .map(|_| ChannelState::new(DEFAULT_HOP_SIZE_INDEX))
                .collect(),
            kbps: 32.0,
            hop_size_index: DEFAULT_HOP_SIZE_INDEX,
        }
    }

    pub fn set_kbps(&mut self, kbps: f32) {
        self.kbps = kbps;
    }

    /// Index into `HOP_SIZES`. Takes effect at each channel's next frame boundary.
    pub fn set_hop_size_index(&mut self, index: usize) {
        self.hop_size_index = index.min(HOP_SIZES.len() - 1);
    }

    /// Returns (wet, dry), where dry is the input delayed by the codec's latency (2N - 1).
    pub fn process(&mut self, channel: usize, sample: f32) -> (f32, f32) {
        let ch = &mut self.channels[channel];
        ch.history[ch.write_index] = sample;
        ch.write_index = (ch.write_index + 1) % HISTORY_LEN;

        if ch.read_index >= ch.ready_len {
            self.next_frame(channel);
        }

        let ch = &mut self.channels[channel];
        let wet = ch.ready[ch.read_index];
        ch.read_index += 1;
        let latency = 2 * HOP_SIZES[ch.hop_size_index] - 1;
        let dry = ch.history[(ch.write_index + HISTORY_LEN - 1 - latency) % HISTORY_LEN];
        (wet, dry)
    }

    pub fn reset(&mut self) {
        let index = self.hop_size_index;
        self.channels
            .iter_mut()
            .for_each(|ch| *ch = ChannelState::new(index));
    }

    fn next_frame(&mut self, channel: usize) {
        let ch = &mut self.channels[channel];
        ch.read_index = 0;

        if ch.hop_size_index != self.hop_size_index {
            // Hop size changed: play out the old frame's tail (it fades with the window) and
            // start the new size from silence. Gives a short glitch, no crossfade.
            let old_n = HOP_SIZES[ch.hop_size_index];
            ch.ready[..old_n].copy_from_slice(&ch.overlap[..old_n]);
            ch.overlap.fill(0.0);
            ch.ready_len = old_n;
            ch.reservoir = 0.0;
            ch.hop_size_index = self.hop_size_index;
            return;
        }

        let t = &self.tables[ch.hop_size_index];
        let s = &mut self.scratch;
        let n = t.n;
        ch.ready_len = n;

        // window the last 2N input samples
        let start = ch.write_index + HISTORY_LEN - 2 * n;
        for i in 0..2 * n {
            s.frame[i] = ch.history[(start + i) % HISTORY_LEN] * t.window[i];
        }

        // MDCT: fold 2N -> N, then orthonormal DCT-IV
        let h = n / 2;
        for i in 0..h {
            s.coeffs[i] = -s.frame[n + h - 1 - i] - s.frame[n + h + i];
            s.coeffs[h + i] = s.frame[i] - s.frame[n - 1 - i];
        }
        t.dct
            .process_dct4_with_scratch(&mut s.coeffs[..n], &mut s.dct);
        s.coeffs[..n].iter_mut().for_each(|x| *x *= t.dct_scale);

        encode(
            t,
            &self.pow43,
            s,
            self.kbps,
            self.sample_rate,
            &mut ch.reservoir,
        );

        // IMDCT: DCT-IV (its own inverse when orthonormal), unfold N -> 2N, window
        t.dct
            .process_dct4_with_scratch(&mut s.quant[..n], &mut s.dct);
        let u = &s.quant[..n];
        for i in 0..h {
            let u1 = u[i] * t.dct_scale;
            let u2 = u[h + i] * t.dct_scale;
            s.frame[i] = u2;
            s.frame[n - 1 - i] = -u2;
            s.frame[n + h - 1 - i] = -u1;
            s.frame[n + h + i] = -u1;
        }

        // overlap-add
        for i in 0..n {
            ch.ready[i] = s.frame[i] * t.window[i] + ch.overlap[i];
            ch.overlap[i] = s.frame[n + i] * t.window[n + i];
        }
    }
}

/// Quantizes the frame in `s.coeffs` at the current bitrate and writes the dequantized
/// coefficients to `s.quant`.
fn encode(
    t: &HopTables,
    pow43: &[f32],
    s: &mut Scratch,
    kbps: f32,
    sample_rate: f32,
    reservoir: &mut f32,
) {
    let n = t.n;
    let bands = t.bands();
    let e = &t.edges;

    let budget = (kbps * 1000.0 * n as f32 / sample_rate
        - OVERHEAD_BITS_PER_GRANULE * n as f32 / 576.0)
        .max(0.0);
    let bin_hz = sample_rate / (2 * n) as f32;
    let lp_bin = ((lowpass_hz(kbps) / bin_hz) as usize).min(n);
    s.coeffs[lp_bin..n].fill(0.0);

    // band energies and tonality (spectral flatness of the MDCT power)
    for b in 0..bands {
        let band = &s.coeffs[e[b]..e[b + 1]];
        let width = band.len() as f32;
        let (mut energy, mut log_sum) = (0.0, 0.0);
        for x in band {
            let p = x * x;
            energy += p;
            log_sum += (p + 1e-20).ln();
        }
        let geo = (log_sum / width).exp();
        let ari = (energy + 1e-20 * width) / width;
        s.energy[b] = energy;
        s.tonality[b] = (10.0 * (geo / ari).log10() / -25.0).clamp(0.0, 1.0);
    }

    // allowed noise per band: spread energy minus tonality offset, floored by the ATH
    let mut any_needed = false;
    for maskee in 0..bands {
        let row = &t.spread[maskee * bands..(maskee + 1) * bands];
        let spread_energy: f32 = row.iter().zip(&s.energy[..bands]).map(|(w, e)| w * e).sum();
        let a = s.tonality[maskee];
        let offset = a * (14.5 + t.z[maskee]) + (1.0 - a) * 5.5;
        s.allowed[maskee] = (spread_energy * 10f32.powf(-offset / 10.0)).max(t.ath_band[maskee]);
        s.needed[maskee] = s.energy[maskee] > s.allowed[maskee];
        any_needed |= s.needed[maskee];
    }

    if !any_needed {
        // whole frame masked: send nothing
        s.quant[..n].fill(0.0);
        *reservoir = (*reservoir + budget).min(RESERVOIR_MAX_BITS);
        return;
    }

    for k in 0..n {
        let a = s.coeffs[k].abs();
        s.xr34[k] = (a * a.sqrt()).sqrt();
    }

    let global_gain = outer_loop(t, pow43, s);

    // inner loop: smallest gain >= the outer loop's that fits the available bits
    let avail = budget + *reservoir;
    let cap = global_gain + GAIN_CAP;
    if bits_at(t, s, cap) > avail {
        // even the scalefactors don't fit: drop the shaping entirely
        s.sf[..bands].fill(0);
    }
    let (mut lo, mut hi) = (global_gain, global_gain);
    if bits_at(t, s, lo) > avail {
        hi = lo + 8;
        while hi < cap && bits_at(t, s, hi) > avail {
            hi += 8;
        }
        while hi - lo > 1 {
            let mid = (lo + hi) / 2;
            if bits_at(t, s, mid) > avail {
                lo = mid;
            } else {
                hi = mid;
            }
        }
    }
    let used = bits_at(t, s, hi);
    dequantize(t, pow43, s, hi);
    *reservoir = (*reservoir + budget - used).clamp(0.0, RESERVOIR_MAX_BITS);
}

/// Chooses global gain + scalefactors (in `s.sf`) so band noise <= allowed noise where
/// possible. No bit budget: that is the inner loop's job.
fn outer_loop(t: &HopTables, pow43: &[f32], s: &mut Scratch) -> i32 {
    let bands = t.bands();
    let e = &t.edges;

    // initial guess per band: uniform-noise approximation  noise/bin ~ step^2 / 12
    let (mut reach, mut want) = (f32::INFINITY, f32::NEG_INFINITY);
    for b in 0..bands {
        let width = (e[b + 1] - e[b]) as f32;
        let step = (12.0 * s.allowed[b] / width).sqrt();
        s.gain[b] = 4.0 * (step + 1e-30).log2();
        if s.needed[b] {
            // coarsest gain every needed band can still reach with its sf range
            reach = reach.min(s.gain[b] + 2.0 * t.sf_max[b] as f32);
            want = want.max(s.gain[b]);
        }
    }
    let global_gain = reach.min(want).floor() as i32;
    for b in 0..bands {
        s.sf[b] = if s.needed[b] {
            ((global_gain as f32 - s.gain[b]) / 2.0)
                .ceil()
                .clamp(0.0, t.sf_max[b] as f32) as u32
        } else {
            0
        };
    }

    for _ in 0..MAX_OUTER_ITERATIONS {
        quantize(t, s, global_gain);
        let mut any_bad = false;
        for b in 0..bands {
            if !s.needed[b] || s.sf[b] >= t.sf_max[b] {
                continue;
            }
            let step = step_size(global_gain, s.sf[b]);
            let noise: f32 = (e[b]..e[b + 1])
                .map(|k| {
                    let d = s.coeffs[k].abs() - pow43[s.ix[k] as usize] * step;
                    d * d
                })
                .sum();
            if noise > s.allowed[b] {
                s.sf[b] += 1; // amplify offending band
                any_bad = true;
            }
        }
        if !any_bad {
            break;
        }
    }
    global_gain
}

/// Step for a band. global_gain in 1.5 dB units; each scalefactor unit makes the band 3 dB finer.
fn step_size(global_gain: i32, sf: u32) -> f32 {
    (global_gain as f32 / 4.0 - 0.5 * sf as f32).exp2()
}

/// |ix| = min(floor((|X| / step)^0.75 + 0.4054), IX_MAX) into `s.ix`.
fn quantize(t: &HopTables, s: &mut Scratch, global_gain: i32) {
    let e = &t.edges;
    for b in 0..t.bands() {
        let step34 = (-0.75 * (global_gain as f32 / 4.0 - 0.5 * s.sf[b] as f32)).exp2();
        for k in e[b]..e[b + 1] {
            s.ix[k] = ((s.xr34[k] * step34 + ROUND_OFFSET) as u32).min(IX_MAX as u32);
        }
    }
}

fn dequantize(t: &HopTables, pow43: &[f32], s: &mut Scratch, global_gain: i32) {
    quantize(t, s, global_gain);
    let e = &t.edges;
    for b in 0..t.bands() {
        let step = step_size(global_gain, s.sf[b]);
        for k in e[b]..e[b + 1] {
            s.quant[k] = pow43[s.ix[k] as usize] * step * s.coeffs[k].signum();
        }
    }
}

fn bits_at(t: &HopTables, s: &mut Scratch, global_gain: i32) -> f32 {
    quantize(t, s, global_gain);
    count_bits(&s.ix[..t.n], &s.sf[..t.bands()], &t.sf_max)
}

/// Approximate main-data bits for one granule: scalefactors + Huffman regions.
fn count_bits(ix: &[u32], sf: &[u32], sf_max: &[u32]) -> f32 {
    let mut bits = 0.0;
    // scalefactors: slen per group = bits to code the group's largest value
    for group in [15, 7] {
        let (mut count, mut max) = (0, 0);
        for (sf, _) in sf.iter().zip(sf_max).filter(|(_, &m)| m == group) {
            count += 1;
            max = max.max(*sf);
        }
        bits += (count * bit_width(max)) as f32;
    }
    let Some(last) = ix.iter().rposition(|&v| v != 0) else {
        return bits;
    };
    let end = last + 1; // rzero region beyond: free
    let big_values = ix[..end]
        .iter()
        .rposition(|&v| v > 1)
        .map_or(0, |b| ((b + 2) / 2 * 2).min(ix.len()));
    // pair tables beat two separate codes
    bits += ix[..big_values].iter().map(|&v| vlc_len(v)).sum::<f32>() * 0.8;
    // count1: quadruples of 0/1, code + sign bits
    let mut i = big_values;
    while i < end {
        let ones = ix[i..(i + 4).min(end)].iter().sum::<u32>() as f32;
        bits += if ones == 0.0 { 1.0 } else { 1.0 + 2.5 * ones };
        i += 4;
    }
    bits
}
