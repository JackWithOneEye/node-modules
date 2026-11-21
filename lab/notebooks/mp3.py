import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    import numpy as np
    import scipy as sp

    from numba import njit

    import dsplab as lab

    return lab, mo, np, sp


@app.cell
def _(lab, mo):
    source = mo.ui.dropdown(
        ["Sine", "Saw", "Square", "Sweep", "Noise", "Pluck", *lab.clips(), "Uploaded clip"],
        value="Saw",
        label="Input",
    )
    freq = mo.ui.slider(start=20, stop=2000, step=1, value=110, label="Frequency (Hz)", show_value=True, debounce=True)
    level = mo.ui.slider(start=-40, stop=0, step=0.5, value=-6, label="Peak level (dBFS)", show_value=True, debounce=True)
    dur = mo.ui.slider(start=0.5, stop=10, step=0.5, value=2, label="Length (s)", show_value=True, debounce=True)
    upload = mo.ui.file(
        filetypes=[".wav", ".flac", ".aif", ".aiff", ".ogg", ".mp3"],
        kind="area",
        label="Drop an audio clip here, then pick “Uploaded clip” (or put files in lab/clips/)",
    )
    mo.vstack([mo.md("## Input"), mo.hstack([source, freq, level, dur], justify="start", wrap=True), upload])
    return dur, freq, level, source, upload


@app.cell
def _(dur, freq, lab, level, mo, np, source, upload):
    _amp, _f, _d = lab.db(level.value), freq.value, dur.value
    _generators = {
        "Sine": lambda: lab.sine(_f, _d, _amp),
        "Saw": lambda: lab.saw(_f, _d, _amp),
        "Square": lambda: lab.square(_f, _d, _amp),
        "Sweep": lambda: lab.sweep(20, 20000, _d, _amp),
        "Noise": lambda: lab.noise(_d, _amp),
        "Pluck": lambda: lab.pluck(_f, _d, _amp),
    }
    if source.value in _generators:
        x = _generators[source.value]()
    else:
        mo.stop(source.value == "Uploaded clip" and not upload.value, mo.md("_Drop a clip into the upload area first._"))
        _clip = lab.clip(upload.contents() if source.value == "Uploaded clip" else source.value, dur=_d)
        # Clips are scaled to the chosen peak level, so drive settings mean the same for every input.
        x = (_clip * _amp / max(np.max(np.abs(_clip)), 1e-9)).astype(np.float32)
    return (x,)


@app.cell
def _(np, sp):
    def sine_window(N: int) -> np.ndarray:
        """2N-point sine window, as MP3 uses for long blocks."""
        n = np.arange(2 * N)
        return np.sin(np.pi * (n + 0.5) / (2 * N))

    def windowed_frames(x: np.ndarray, N: int) -> np.ndarray:
        """Split x into 50%-overlapping blocks of 2N and apply the window.
        Returns an array of shape (num_frames, 2N)."""
        # pad N zeros on both sides so the first/last samples get full coverage
        x = np.concatenate([np.zeros(N), x, np.zeros(N)])
        # pad the end up to a multiple of N
        x = np.concatenate([x, np.zeros((-len(x)) % N)])

        num_frames = len(x) // N - 1
        idx = np.arange(2 * N)[None, :] + N * np.arange(num_frames)[:, None]
        frames = x[idx]                      # (num_frames, 2N), overlapping views
        return frames * sine_window(N)       # broadcasting applies it per row

    def mdct(frames: np.ndarray) -> np.ndarray:
        """(..., 2N) windowed frames -> (..., N) MDCT coefficients."""
        N = frames.shape[-1] // 2
        h = N // 2
        a = frames[..., :h]
        b = frames[..., h:N]
        c = frames[..., N:N + h]
        d = frames[..., N + h:]
        u = np.concatenate([-c[..., ::-1] - d, a - b[..., ::-1]], axis=-1)
        return sp.fft.dct(u, type=4, norm="ortho", axis=-1)

    def imdct(X: np.ndarray) -> np.ndarray:
        """(..., N) coefficients -> (..., 2N) time-aliased frames (window them next)."""
        N = X.shape[-1]
        h = N // 2
        u = sp.fft.idct(X, type=4, norm="ortho", axis=-1)
        u1, u2 = u[..., :h], u[..., h:]
        return np.concatenate([u2, -u2[..., ::-1], -u1[..., ::-1], -u1], axis=-1)

    def overlap_add(frames: np.ndarray, N: int, length: int) -> np.ndarray:
        """Synthesis window + overlap-add; strips the N-sample padding."""
        w = sine_window(N)
        y = np.zeros((frames.shape[0] + 1) * N)
        for k, f in enumerate(frames):
            y[k * N : k * N + 2 * N] += f * w
        return y[N : N + length]


    return imdct, mdct, overlap_add, windowed_frames


@app.cell
def _(np):
    # MP3 long-block scalefactor band edges at 44.1 kHz, as MDCT bin indices (N = 576)
    _MP3_EDGES_44K = np.array([0, 4, 8, 12, 16, 20, 24, 30, 36, 44, 52, 62, 74,
                               90, 110, 134, 162, 196, 238, 288, 342, 418, 576])
    MP3_EDGES_HZ = _MP3_EDGES_44K * (44100 / 2) / 576     # -> Hz

    def band_edges(fs, N, edges_hz=MP3_EDGES_HZ):
        """Bin-index edges [0, ..., N] for bands defined in Hz."""
        bin_hz = fs / (2 * N)
        e = np.round(np.asarray(edges_hz) / bin_hz).astype(int)
        e = e[(e > 0) & (e < N)]                          # drop edges above Nyquist
        return np.unique(np.concatenate([[0], e, [N]]))   # sorted, no empty bands

    def band_energies(X, edges):
        """Sum of X² per band: (..., N) -> (..., B)."""
        return np.add.reduceat(X**2, edges[:-1], axis=-1)

    def expand(per_band, edges):
        """One value per band -> one value per bin: (..., B) -> (..., N)."""
        return np.repeat(per_band, np.diff(edges), axis=-1)

    return band_edges, band_energies, expand


@app.cell
def _(expand, np):
    ROUND_OFFSET = 0.4054   # LAME: floor(v + 0.4054) rather than round(v); biases toward zero
    IX_MAX = 8191           # largest index the MP3 Huffman tables can code

    def step_sizes(edges, global_gain, scalefac=None, sf_scale=0.5):
        """Per-bin step. global_gain in 1.5 dB units (step = 2^(gain/4)).
        Each scalefac unit makes its band finer by 2^sf_scale (0.5 -> 3 dB, 1.0 -> 6 dB)."""
        B = len(edges) - 1
        sf = np.zeros(B) if scalefac is None else np.asarray(scalefac, float)
        return expand(2.0 ** (global_gain / 4 - sf_scale * sf), edges)

    def quantize(X, step):
        v = (np.abs(X) / step) ** 0.75
        ix = np.minimum(np.floor(v + ROUND_OFFSET), IX_MAX).astype(np.int32)
        return np.sign(X).astype(np.int32) * ix

    def dequantize(ix, step):
        return np.sign(ix) * np.abs(ix) ** (4 / 3) * step

    def zero_bands(ix, edges):
        """True where an entire band quantized to zero, i.e. went silent."""
        return np.add.reduceat(np.abs(ix), edges[:-1], axis=-1) == 0

    return dequantize, quantize, step_sizes


@app.cell
def _(band_edges, band_energies, dequantize, np, quantize, sp, step_sizes):
    FULL_SCALE_DB_SPL = 96.0   # calibration: a full-scale sine is heard at 96 dB SPL

    def bark(f):
        """Hz -> Bark (Zwicker & Terhardt)."""
        f = np.asarray(f, float)
        return 13 * np.arctan(0.00076 * f) + 3.5 * np.arctan((f / 7500) ** 2)

    def ath_db(f):
        """Absolute threshold of hearing in dB SPL (Terhardt), clipped to a sane range."""
        k = np.maximum(np.asarray(f, float), 20) / 1000
        a = 3.64 * k**-0.8 - 6.5 * np.exp(-0.6 * (k - 3.3) ** 2) + 1e-3 * k**4
        return np.clip(a, -10, 90)

    def spreading_db(dz):
        """Schroeder spreading function; dz = z_maskee - z_masker in Bark."""
        d = dz + 0.474
        return 15.81 + 7.5 * d - 17.5 * np.sqrt(1 + d * d)

    class PsyModel:
        def __init__(self, fs, N, edges=None):
            self.fs, self.N = fs, N
            self.edges = band_edges(fs, N) if edges is None else edges
            bin_hz = fs / (2 * N)
            f_bins = (np.arange(N) + 0.5) * bin_hz
            lo, hi = self.edges[:-1] * bin_hz, self.edges[1:] * bin_hz
            self.z = bark(0.5 * (lo + hi))                         # band centre in Bark
            dz = self.z[:, None] - self.z[None, :]                 # [maskee, masker]
            self.spread = 10 ** (spreading_db(dz) / 10)            # (B, B)
            # energy of a full-scale sine in one frame of the orthonormal MDCT = N/2
            ref = N / 2
            ath_bin = ref * 10 ** ((ath_db(f_bins) - FULL_SCALE_DB_SPL) / 10)
            # band ATH: quietest bin of the band, times band width
            self.ath_band = np.minimum.reduceat(ath_bin, self.edges[:-1]) * np.diff(self.edges)
            # per-band sf limits, like MP3 long blocks (slen 4 bits low, 3 bits mid, none in sfb21)
            self.sf_max = np.where(lo < 2370, 15, np.where(lo < 16000, 7, 0))

        def tonality(self, frames):
            """0 = noise-like, 1 = tonal, per band, from spectral flatness of the frame's FFT."""
            P = np.abs(sp.fft.rfft(frames, axis=-1))[..., : self.N] ** 2 + 1e-20
            e = self.edges
            w = np.diff(e)
            geo = np.exp(np.add.reduceat(np.log(P), e[:-1], axis=-1) / w)
            ari = np.add.reduceat(P, e[:-1], axis=-1) / w
            sfm_db = 10 * np.log10(geo / ari)                    # <= 0
            return np.clip(sfm_db / -25.0, 0, 1)                   # -25 dB flatness ~ pure tone

        def allowed_noise(self, frames, X, mask_offset_db=0.0):
            """Allowed noise energy per band (..., B).
            mask_offset_db > 0 lets more noise through (more lo-fi)."""
            E = band_energies(X, self.edges)
            spread_E = E @ self.spread.T                           # sum over maskers
            a = self.tonality(frames)
            offset = a * (14.5 + self.z) + (1 - a) * 5.5           # Johnston: tones mask worse
            thr = spread_E * 10 ** ((mask_offset_db - offset) / 10)
            return np.maximum(thr, self.ath_band), E

    def band_noise(X, Xq, edges):
        return band_energies(X - Xq, edges)

    def outer_loop(X, allowed, model, max_iter=20):
        """Choose global gain + scalefactors so band noise <= allowed noise (where possible).
        No bit budget yet: that is the rate loop's job."""
        e, w = model.edges, np.diff(model.edges)
        # initial guess per band: uniform-noise approximation  noise/bin ~ step^2 / 12
        step_b = np.sqrt(12 * allowed / w)
        gain_b = 4 * np.log2(step_b + 1e-30)
        # bands whose energy is already below the allowed noise are fully masked:
        # zeroing them is fine, so they place no demand on the step size
        E = band_energies(X, e)
        needed = E > allowed
        big = 1e9
        # coarsest gg that every needed band can still reach with its sf range
        reach = np.where(needed, gain_b + 2 * model.sf_max, big)
        want = np.where(needed, gain_b, -big)
        gg = np.floor(np.minimum(reach.min(-1), want.max(-1)))[..., None]
        gg = np.where(np.abs(gg) > big / 2, 0, gg)                 # frame with nothing needed
        sf = np.where(needed, np.clip(np.ceil((gg - gain_b) / 2), 0, model.sf_max), 0)
        for _ in range(max_iter):
            step = step_sizes(e, gg, sf)
            Xq = dequantize(quantize(X, step), step)
            bad = (band_noise(X, Xq, e) > allowed) & (sf < model.sf_max) & needed
            if not bad.any():
                break
            sf = sf + bad                                          # amplify offending bands
        return gg, sf, Xq

    return PsyModel, outer_loop


@app.cell
def _(band_energies, dequantize, np, outer_loop, quantize, step_sizes):
    RESERVOIR_MAX_BITS = 511 * 8      # MP3: main_data_begin is 9 bits -> max 511 bytes back
    OVERHEAD_BITS = {1: 84, 2: 144}   # per granule: header/2 + side info (mono / stereo)

    def _vlc_len(v):
        """Rough Huffman length for one big_values magnitude (gamma-code-like), incl. sign."""
        v = np.asarray(v)
        esc = v > 15
        base = np.where(v == 0, 1, 2 * np.floor(np.log2(np.maximum(v, 1))) + 3)
        base = np.where(esc, 9, base)                              # escape code for 15 + sign
        lin = np.where(esc, np.ceil(np.log2(np.maximum(v - 14, 2))), 0)
        return base + lin

    def count_bits(ix, sf, sf_max):
        """Approximate main-data bits for one granule: scalefactors + Huffman regions."""
        a = np.abs(ix)
        nz = np.flatnonzero(a)
        bits = 0.0
        # scalefactors: slen per group = bits to code the group's largest value
        for grp in (sf_max == 15, sf_max == 7):
            if grp.any():
                bits += grp.sum() * int(np.ceil(np.log2(sf[grp].max() + 1)))
        if nz.size == 0:
            return bits
        end = nz[-1] + 1                                          # rzero region beyond: free
        big = np.flatnonzero(a[:end] > 1)
        s = 0 if big.size == 0 else (big[-1] + 2) // 2 * 2        # big_values: pairs
        bits += _vlc_len(a[:s]).sum() * 0.8                       # pair tables beat two separate codes
        q = a[s:end]                                              # count1: quadruples of 0/1
        q = np.concatenate([q, np.zeros((-len(q)) % 4)]).reshape(-1, 4)
        pc = q.sum(1)
        bits += np.where(pc == 0, 1, 1 + 1.5 * pc + pc).sum()     # code + sign bits
        return bits

    def encode(frames, X, model, bitrate_kbps, mask_offset_db=0.0,
               reservoir=True, lowpass_hz=None, channels=1):
        """CBR MP3-style quantization of all frames. Returns Xq and per-frame stats."""
        fs, N, e = model.fs, model.N, model.edges
        budget = bitrate_kbps * 1000 * N / fs - OVERHEAD_BITS[channels]   # main-data bits/granule
        allowed, E = model.allowed_noise(frames, X, mask_offset_db)
        if lowpass_hz is not None:
            X = X.copy()
            X[..., int(lowpass_hz / (fs / (2 * N))):] = 0
            E = band_energies(X, e)
        gg0, sf0, _ = outer_loop(X, allowed, model)              # "ideal" settings, no budget
        Xq = np.zeros_like(X)
        stats = dict(bits=[], gg_raise=[], reservoir=[])
        res = 0.0
        for k in range(X.shape[0]):
            if not (E[k] > allowed[k]).any():                    # whole frame masked: send nothing
                used, raise_ = count_bits(np.zeros(N, int), np.zeros_like(sf0[k]), model.sf_max), 0
            else:
                avail = budget + (res if reservoir else 0)
                sf = sf0[k]
                def bits_at(g):
                    return count_bits(quantize(X[k], step_sizes(e, g, sf)), sf, model.sf_max)
                lo = int(gg0[k, 0])
                if bits_at(lo) <= avail:
                    g = lo
                else:                                            # inner loop: coarser until it fits
                    CAP = lo + 160                               # far beyond any coefficient: all zero
                    if bits_at(CAP) > avail:                     # even the scalefactors don't fit:
                        sf = np.zeros_like(sf)                   # drop the shaping entirely
                    hi = lo + 8
                    while hi < CAP and bits_at(hi) > avail:
                        hi += 8
                    while hi - lo > 1:
                        mid = (lo + hi) // 2
                        lo, hi = (mid, hi) if bits_at(mid) > avail else (lo, mid)
                    g = hi
                step = step_sizes(e, g, sf)
                Xq[k] = dequantize(quantize(X[k], step), step)
                used, raise_ = bits_at(g), g - int(gg0[k, 0])
            if reservoir:
                res = min(res + budget - used, RESERVOIR_MAX_BITS)
            stats["bits"].append(used)
            stats["gg_raise"].append(raise_)
            stats["reservoir"].append(res)
        return Xq, {k: np.array(v) for k, v in stats.items()}

    return OVERHEAD_BITS, RESERVOIR_MAX_BITS, count_bits


@app.cell
def _(
    OVERHEAD_BITS,
    PsyModel,
    RESERVOIR_MAX_BITS,
    band_energies,
    count_bits,
    dequantize,
    expand,
    np,
    outer_loop,
    quantize,
    step_sizes,
):
    # Bitrate (kbps, whole stream) -> lowpass (Hz). Approximately LAME's CBR table.
    _LOWPASS = [(8, 2000), (16, 3700), (24, 3900), (32, 5500), (40, 7000), (48, 7500),
                (56, 10000), (64, 11000), (80, 13500), (96, 15100), (112, 15600),
                (128, 17000), (160, 17500), (192, 18600), (224, 19400), (256, 19700), (320, 20500)]

    def lowpass_for(kbps, channels):
        k = kbps * (2 / channels)            # table is for stereo; mono gets the stereo figure for 2x
        ks, fs_ = zip(*_LOWPASS)
        return float(np.interp(k, ks, fs_))

    def internal_rate(fs, lowpass_hz):
        """Like MPEG-2/2.5: drop to fs/2 or fs/4 when the lowpass leaves the upper half unused."""
        for div in (4, 2):
            if lowpass_hz < 0.9 * fs / div / 2:
                return fs / div
        return fs

    class Encoder:
        def __init__(self, fs, kbps, channels=2, N=576, mask_offset_db=0.0, reservoir=True,
                     lowpass_hz="auto", stereo="auto", side_share=1.0,
                     dropout=0.0, dropout_hold=0.0, dropout_min_hz=0.0,
                     hold_prob=0.0, freeze=False, freeze_mode="repeat",
                     starve=0.0, starve_rate_hz=0.5, starve_jitter=0.0,
                     reservoir_max_bits=RESERVOIR_MAX_BITS, seed=None):
            """stereo: 'lr', 'ms' or 'auto' (per frame). side_share scales the side channel's share of
            the bits (and caps it at side_share x its demand); < 1 starves it (narrower, swirlier stereo).

            Lo-fi extras (all off by default):
              dropout         probability per frame that a sounding band is muted
              dropout_hold    probability that a muted band stays muted next frame (longer gaps)
              dropout_min_hz  bands below this are never dropped
              hold_prob       probability per frame of repeating the previous frame (stutter)
              freeze          True: keep playing the frame captured when freeze was switched on
              freeze_mode     'repeat' (exact coefficients: buzzy) or 'smear' (random signs: drone)
              starve          0..1 depth of bit-budget modulation (0.8 = budget dips to 20%)
              starve_rate_hz  speed of that modulation (sine LFO)
              starve_jitter   0..1 random per-frame budget cuts on top
              reservoir_max_bits  cap of the bit reservoir (0 = no carry-over)"""
            self.fs, self.kbps, self.C, self.N = fs, kbps, channels, N
            self.model = PsyModel(fs, N)
            self.mask_offset_db, self.reservoir = mask_offset_db, reservoir
            self.lowpass = lowpass_for(kbps, channels) if lowpass_hz == "auto" else lowpass_hz
            self.stereo, self.side_share = stereo, side_share
            self.budget = kbps * 1000 * N / fs - OVERHEAD_BITS[channels]   # main-data bits/granule
            self.res = 0.0
            self.lp_bin = N if self.lowpass is None else min(N, int(self.lowpass / (fs / (2 * N))))
            self.dropout, self.dropout_hold, self.dropout_min_hz = dropout, dropout_hold, dropout_min_hz
            self.hold_prob, self.freeze, self.freeze_mode = hold_prob, freeze, freeze_mode
            self.starve, self.starve_rate_hz, self.starve_jitter = starve, starve_rate_hz, starve_jitter
            self.reservoir_max_bits = reservoir_max_bits
            self.rng = np.random.default_rng(seed)
            B = len(self.model.edges) - 1
            self.dropped = np.zeros((channels, B), bool)
            self.band_lo_hz = self.model.edges[:-1] * fs / (2 * N)
            self.prev_Xq = np.zeros((channels, N))
            self.frozen = None
            self.k = 0                                   # granule counter (for the LFO)

        # ---- helpers ---------------------------------------------------------------
        def _bits(self, X, g, sf):
            e = self.model.edges
            return count_bits(quantize(X, step_sizes(e, g, sf)), sf, self.model.sf_max)

        def _fit(self, X, g0, sf, avail):
            """Inner loop for one channel: smallest gain >= g0 that fits avail bits."""
            CAP = g0 + 160
            if self._bits(X, CAP, sf) > avail:
                sf = np.zeros_like(sf)
            lo, hi = g0, g0
            if self._bits(X, lo, sf) > avail:
                hi = lo + 8
                while hi < CAP and self._bits(X, hi, sf) > avail:
                    hi += 8
                while hi - lo > 1:
                    mid = (lo + hi) // 2
                    lo, hi = (mid, hi) if self._bits(X, mid, sf) > avail else (lo, mid)
            return hi, sf, self._bits(X, hi, sf)

        # ---- one granule -----------------------------------------------------------
        def process_frame(self, frames, X):
            """frames: (C, 2N) windowed time blocks, X: (C, N) MDCT. Returns (C, N) quantized MDCT."""
            X = X.copy()
            X[:, self.lp_bin:] = 0
            ms = False
            if self.C == 2 and self.stereo != "lr":
                M, S = (X[0] + X[1]) / np.sqrt(2), (X[0] - X[1]) / np.sqrt(2)
                # auto: like ISO's rule, use M/S when the channels are similar
                ms = self.stereo == "ms" or np.sum(S**2) < 0.5 * np.sum(M**2)
                if ms:
                    X = np.stack([M, S])
                    frames = np.stack([(frames[0] + frames[1]) / np.sqrt(2),
                                       (frames[0] - frames[1]) / np.sqrt(2)])
            allowed, _ = self.model.allowed_noise(frames, X, self.mask_offset_db)
            E = band_energies(X, self.model.edges)
            gg0, sf0, _ = outer_loop(X, allowed, self.model)
            need = (E > allowed).any(-1)
            ideal = np.array([self._bits(X[c], int(gg0[c, 0]), sf0[c]) if need[c] else 0.0
                              for c in range(self.C)])
            # bit-budget starvation: LFO dip plus random cuts
            t = self.k * self.N / self.fs
            self.k += 1
            lfo = 0.5 - 0.5 * np.cos(2 * np.pi * self.starve_rate_hz * t)      # 0..1
            factor = 1 - self.starve * lfo
            if self.starve_jitter:
                factor *= 1 - self.starve_jitter * self.rng.random()
            budget = max(self.budget * factor, 0.0)
            avail = budget + (self.res if self.reservoir else 0)
            # split the granule's bits between channels in proportion to demand
            share = ideal / max(ideal.sum(), 1e-9)
            if ms and self.side_share != 1.0:                    # starve (or favour) the side channel
                share[1] = min(1.0, share[1] * self.side_share)
                share[0] = 1.0 - share[1]
            Xq = np.zeros_like(X)
            used = 0.0
            for c in range(self.C):
                if not need[c]:
                    continue
                alloc = ideal[c] if ideal.sum() <= avail else share[c] * avail
                if ms and c == 1 and self.side_share < 1:        # starve side even when bits are free
                    alloc = min(alloc, self.side_share * ideal[c])
                g, sf, b = self._fit(X[c], int(gg0[c, 0]), sf0[c], alloc)
                step = step_sizes(self.model.edges, g, sf)
                Xq[c] = dequantize(quantize(X[c], step), step)
                used += b
            if self.reservoir:
                self.res = max(0.0, min(self.res + budget - used, self.reservoir_max_bits))
            Xq = self._dropout(Xq)
            if ms:
                Xq = np.stack([(Xq[0] + Xq[1]) / np.sqrt(2), (Xq[0] - Xq[1]) / np.sqrt(2)])
            Xq = self._hold(Xq)
            self.last = dict(ms=ms, used=used, res=self.res, budget=budget)
            return Xq

        # ---- lo-fi extras ------------------------------------------------------------
        def _dropout(self, Xq):
            """Markov band muting in the coded domain (M/S or L/R), like starved bands flickering."""
            if not (self.dropout or self.dropped.any()):
                return Xq
            r = self.rng.random(self.dropped.shape)
            self.dropped = np.where(self.dropped, r < self.dropout_hold, r < self.dropout)
            self.dropped &= self.band_lo_hz >= self.dropout_min_hz
            return Xq * ~expand(self.dropped, self.model.edges)

        def _hold(self, Xq):
            """Freeze / stutter: re-send an earlier frame instead of the current one."""
            if self.freeze:
                if self.frozen is None:
                    self.frozen = self.prev_Xq.copy()
                src = self.frozen
            else:
                self.frozen = None
                if not (self.hold_prob and self.rng.random() < self.hold_prob):
                    self.prev_Xq = Xq
                    return Xq
                src = self.prev_Xq
            if self.freeze_mode == "smear":       # same spectrum, new random signs every frame
                return np.abs(src) * self.rng.choice([-1.0, 1.0], src.shape)
            return src.copy()

    return Encoder, internal_rate, lowpass_for


@app.cell
def _(
    Encoder,
    RESERVOIR_MAX_BITS,
    imdct,
    internal_rate,
    lab,
    lowpass_for,
    mdct,
    np,
    overlap_add,
    windowed_frames,
):
    import math
    from scipy.signal import resample_poly

    def process(x, fs, kbps, N=576, resample="auto",
                mask_offset_db=0.0, reservoir=True, lowpass_hz="auto",
                stereo="auto", side_share=1.0,
                dropout=0.0, dropout_hold=0.0, dropout_min_hz=0.0,
                hold_prob=0.0, freeze=False, freeze_mode="repeat",
                starve=0.0, starve_rate_hz=0.5, starve_jitter=0.0,
                reservoir_max_bits=RESERVOIR_MAX_BITS, seed=None):
        """Offline helper: run a whole signal through the encoder.

        x               (samples,) or (samples, C) float array
        fs              sample rate of x (Hz); output has the same rate and shape
        kbps            CBR bitrate for the whole stream
        N               hop / MDCT size (even); window is 2N
        resample        'auto': drop to fs/2 or fs/4 when the lowpass allows it; None: never
        mask_offset_db  shifts the masking threshold; > 0 lets more noise through
        reservoir       carry unused bits over to later frames
        lowpass_hz      'auto' (from bitrate), a frequency in Hz, or None (no lowpass)
        stereo          'auto' (M/S when channels are similar), 'ms' or 'lr'
        side_share      scales the side channel's bit share; < 1 starves it
        dropout         per-frame probability that a sounding band is muted
        dropout_hold    probability a muted band stays muted next frame
        dropout_min_hz  bands below this are never dropped
        hold_prob       per-frame probability of repeating the previous frame (stutter)
        freeze          hold the frame present at the start (offline: freezes from frame 0)
        freeze_mode     'repeat' (exact, buzzy) or 'smear' (random signs, drone)
        starve          0..1 depth of the bit-budget LFO dip
        starve_rate_hz  LFO rate
        starve_jitter   0..1 random per-frame budget cuts
        reservoir_max_bits  reservoir cap in bits (0 = no carry-over)
        seed            random seed for dropout / stutter / jitter / smear

        Returns (y, info) with info = {fs_internal, lowpass}."""
        x = np.atleast_2d(x.T).T if x.ndim == 1 else x
        C = x.shape[1]
        lp = lowpass_for(kbps, C) if lowpass_hz == "auto" else lowpass_hz
        fs_int = internal_rate(fs, lp) if resample == "auto" and lp else fs
        up, down = int(fs_int), int(fs)
        g = math.gcd(up, down); up, down = up // g, down // g
        xi = resample_poly(x, up, down, axis=0) if fs_int != fs else x
        enc = Encoder(fs_int, kbps, C, N,
                      mask_offset_db=mask_offset_db, reservoir=reservoir, lowpass_hz=lp,
                      stereo=stereo, side_share=side_share,
                      dropout=dropout, dropout_hold=dropout_hold, dropout_min_hz=dropout_min_hz,
                      hold_prob=hold_prob, freeze=freeze, freeze_mode=freeze_mode,
                      starve=starve, starve_rate_hz=starve_rate_hz, starve_jitter=starve_jitter,
                      reservoir_max_bits=reservoir_max_bits, seed=seed)
        fr = np.stack([windowed_frames(xi[:, c], N) for c in range(C)], axis=1)   # (F, C, 2N)
        X = mdct(fr)
        Xq = np.stack([enc.process_frame(fr[k], X[k]) for k in range(X.shape[0])])
        y = np.stack([overlap_add(imdct(Xq[:, c]), N, len(xi)) for c in range(C)], axis=1)
        if fs_int != fs:
            y = resample_poly(y, down, up, axis=0)[: len(x)]
        return y if C > 1 else y[:, 0], dict(fs_internal=fs_int, lowpass=lp)


    def mp3(x, N, kbps, mask_offset, dropout, sr=lab.SR):
        #frames = windowed_frames(x, N)
        #X = mdct(frames)
    
        #e = band_edges(sr, N)
        #E = band_energies(X, e)
        #step = step_sizes(e, gain)

        #X = quantize(X, step)
    
        #deq = dequantize(X, step)
        #im = imdct(Xq)
        #y = overlap_add(im, N, len(x))

        y, info = process(x, sr, kbps, N, mask_offset, dropout=dropout, freeze=False, freeze_mode="smear", starve=1, starve_rate_hz=5)
    
        return y

    return (mp3,)


@app.cell
def _(lab):
    py_ui = lab.controls(N=(32, 2048, 576, 2), kbps=(8, 64, 64, 1), mask_offset=(0, 20, 0, 1), dropout=(0, 1, 0, 0.1))
    py_ui.hstack(justify="start", wrap=True)
    return (py_ui,)


@app.cell
def _(lab, mp3, py_ui, x):
    y_py = mp3(x, **py_ui.value)
    lab.view(x, y_py)
    return


if __name__ == "__main__":
    app.run()
