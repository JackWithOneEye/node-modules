"""Helpers for prototyping DSP algorithms in marimo notebooks.

Signals are float32 numpy arrays: 1D for mono, (channels, samples) for multichannel.

    import dsplab as lab
    x = lab.sine(220)
    y = lab.faust('import("stdfaust.lib"); process = fi.lowpass(2, 1000);', x)
    lab.view(x, y)
"""

import io
import re
from pathlib import Path

import dawdreamer as dd
import marimo as mo
import numpy as np
import soundfile as sf
from matplotlib.figure import Figure
from scipy import signal as sps

SR = 48000
CLIPS_DIR = Path(__file__).resolve().parent.parent / "clips"

__all__ = [
    "SR", "CLIPS_DIR",
    "sine", "saw", "square", "noise", "sweep", "impulse", "pluck", "clip", "clips", "db",
    "faust", "faust_params", "faust_controls", "controls",
    "listen", "compare", "transfer", "view",
]


# --- test signals -------------------------------------------------------------------------------

def _t(dur, sr):
    return np.arange(int(dur * sr)) / sr


def sine(freq=220.0, dur=1.0, amp=0.5, sr=SR):
    return (amp * np.sin(2 * np.pi * freq * _t(dur, sr))).astype(np.float32)


def _additive(freq, dur, amp, sr, harmonic_gain):
    # Band-limited, so aliasing in a plot comes from the algorithm and not from the test signal.
    t = _t(dur, sr)
    out = np.zeros_like(t)
    for k in range(1, int((sr / 2) // freq) + 1):
        g = harmonic_gain(k)
        if g:
            out += g * np.sin(2 * np.pi * k * freq * t)
    return (amp * out / np.max(np.abs(out))).astype(np.float32)


def saw(freq=110.0, dur=1.0, amp=0.5, sr=SR):
    return _additive(freq, dur, amp, sr, lambda k: (-1) ** (k + 1) / k)


def square(freq=110.0, dur=1.0, amp=0.5, sr=SR):
    return _additive(freq, dur, amp, sr, lambda k: 1 / k if k % 2 else 0)


def noise(dur=1.0, amp=0.25, sr=SR, seed=0):
    return (amp * np.random.default_rng(seed).uniform(-1, 1, int(dur * sr))).astype(np.float32)


def sweep(f0=20.0, f1=20000.0, dur=2.0, amp=0.5, sr=SR):
    """Logarithmic sine sweep from f0 to f1."""
    return (amp * sps.chirp(_t(dur, sr), f0, dur, f1, method="logarithmic", phi=-90)).astype(np.float32)


def impulse(dur=1.0, sr=SR):
    x = np.zeros(int(dur * sr), dtype=np.float32)
    x[0] = 1
    return x


def pluck(freq=110.0, dur=2.0, amp=0.5, decay=0.996, sr=SR, seed=0):
    """Karplus-Strong plucked string: a quick stand-in for a guitar or bass note."""
    n = int(sr / freq)
    excitation = np.zeros(int(dur * sr))
    excitation[:n] = np.random.default_rng(seed).uniform(-1, 1, n)
    a = np.zeros(n + 2)
    a[0], a[n], a[n + 1] = 1, -0.5 * decay, -0.5 * decay
    y = sps.lfilter([1], a, excitation)
    return (amp * y / np.max(np.abs(y))).astype(np.float32)


def clip(name, sr=SR, mono=True, dur=None):
    """Load an audio file, resampled to sr.

    name is a path, a file name in lab/clips/, or the bytes of a file (such as mo.ui.file contents).
    """
    if isinstance(name, bytes):
        source = io.BytesIO(name)
    else:
        source = Path(name) if Path(name).exists() else CLIPS_DIR / name
    data, file_sr = sf.read(source, dtype="float32", always_2d=True)
    x = data.T
    if file_sr != sr:
        g = np.gcd(sr, file_sr)
        x = sps.resample_poly(x, sr // g, file_sr // g, axis=1).astype(np.float32)
    if dur is not None:
        x = x[:, : int(dur * sr)]
    return x.mean(axis=0) if mono else x


def clips():
    """Names of the audio files in lab/clips/."""
    exts = {".wav", ".flac", ".aif", ".aiff", ".ogg", ".mp3"}
    return sorted(p.name for p in CLIPS_DIR.glob("*") if p.suffix.lower() in exts)


def db(gain):
    """Decibels to linear gain."""
    return 10 ** (gain / 20)


# --- Faust ------------------------------------------------------------------------------------

def _key(path):
    return re.sub(r"[^a-z0-9]+", "_", path.rsplit("/", 1)[-1].lower()).strip("_")


def _compile(code, sr, block=512):
    engine = dd.RenderEngine(sr, block)
    proc = engine.make_faust_processor("faust")
    proc.set_dsp_string(code)
    proc.compile()  # raises with the Faust error message; otherwise compiling waits for first use
    return engine, proc


def faust_params(code, sr=SR):
    """The sliders, buttons, and number boxes a Faust program declares."""
    # The processor stops working once its engine is freed, so keep the engine referenced.
    engine, proc = _compile(code, sr)
    return proc.get_parameters_description()


def faust(code, x=None, sr=SR, dur=None, **params):
    """Run x through a Faust program and return the output.

    Parameters are passed by their label in snake_case: hslider("Cutoff Freq", ...) is cutoff_freq=...
    A mono x is copied to every input of the program. Programs without inputs need dur instead of x.
    The result is 1D when the program has one output.
    """
    engine, proc = _compile(code, sr)
    by_key = {_key(p["name"]): p["name"] for p in proc.get_parameters_description()}
    for name, value in params.items():
        if name not in by_key:
            raise KeyError(f"Faust program has no parameter {name!r}; it has {sorted(by_key)}")
        proc.set_parameter(by_key[name], float(value))

    n_in = proc.get_num_input_channels()
    if n_in == 0:
        if dur is None:
            dur = len(np.atleast_2d(x)[0]) / sr if x is not None else 1.0
        engine.load_graph([(proc, [])])
    else:
        if x is None:
            raise ValueError("this Faust program has inputs, so pass x")
        x = np.atleast_2d(np.asarray(x, dtype=np.float32))
        if x.shape[0] != n_in:
            x = np.repeat(x[:1], n_in, axis=0)
        dur = x.shape[1] / sr
        engine.load_graph([(engine.make_playback_processor("input", x), []), (proc, ["input"])])

    engine.render(dur)
    y = engine.get_audio()[:, : int(round(dur * sr))]
    return y[0] if y.shape[0] == 1 else y


def faust_controls(code, sr=SR):
    """Marimo sliders for every parameter of a Faust program; pass them on with faust(code, x, **controls.value)."""
    return mo.ui.dictionary({
        _key(p["name"]): mo.ui.slider(
            start=p["min"], stop=p["max"], step=p["step"] or None, value=p["value"],
            label=p["label"], show_value=True, debounce=True,
        )
        for p in faust_params(code, sr)
    })


def controls(**specs):
    """Sliders from (min, max, default) or (min, max, default, step) tuples, e.g. controls(drive=(0, 40, 12)).

    Read them with controls.value, a dict of name -> value.
    """
    def slider(name, spec):
        start, stop, value, *step = spec
        return mo.ui.slider(start=start, stop=stop, value=value, step=step[0] if step else None,
                            label=name, show_value=True, debounce=True)
    return mo.ui.dictionary({name: slider(name, spec) for name, spec in specs.items()})


# --- listening and looking --------------------------------------------------------------------

def _wav(x, sr):
    buf = io.BytesIO()
    sf.write(buf, np.asarray(x).T, sr, format="WAV", subtype="PCM_16")  # half the size of float; players are already scaled to ±1
    return buf.getvalue()


def listen(*signals, labels=None, sr=SR):
    """Audio players at matched levels, so louder sounds louder.

    When any signal peaks above 0 dBFS, all of them are turned down by the same amount.
    """
    labels = labels or (["Input", "Output"] if len(signals) == 2 else [f"#{i + 1}" for i in range(len(signals))])
    peak = max(float(np.max(np.abs(s))) for s in signals)
    scale = 1 / peak if peak > 1 else 1
    players = [
        mo.vstack([mo.md(f"**{label}** · peak {20 * np.log10(np.max(np.abs(s)) + 1e-12):+.1f} dBFS"),
                   mo.audio(_wav(np.asarray(s) * scale, sr))])
        for label, s in zip(labels, signals)
    ]
    note = [mo.md(f"_All players turned down {-20 * np.log10(scale):.1f} dB to avoid clipping._")] if scale < 1 else []
    return mo.vstack([mo.hstack(players, justify="start", gap=2), *note])


def _mono(x):
    x = np.asarray(x)
    return x if x.ndim == 1 else x[0]


def compare(x, y, sr=SR, labels=("Input", "Output"), zoom=0.02, at=0.25):
    """Waveforms, spectra, and spectrograms of x and y.

    zoom is the length in seconds of the waveform close-up, which starts at the fraction at of the signal.
    """
    x, y = _mono(x), _mono(y)
    fig = Figure(figsize=(11, 4.8), layout="constrained")  # fits marimo's 610px output height with players above
    grid = fig.add_gridspec(2, 2)

    wave = fig.add_subplot(grid[0, 0])
    start, n = int(at * len(x)), int(zoom * sr)
    t = np.arange(n) / sr * 1000
    for s, label in zip((x, y), labels):
        wave.plot(t, s[start:start + n], lw=1, label=label)
    wave.set(xlabel=f"ms (from {start / sr:.2f} s)", ylabel="amplitude", title="Waveform")
    wave.legend(loc="upper right")
    wave.grid(alpha=0.3)

    spec = fig.add_subplot(grid[0, 1])
    for s, label in zip((x, y), labels):
        f, p = sps.welch(s, sr, nperseg=min(8192, len(s)))
        spec.semilogx(f[1:], 10 * np.log10(p[1:] + 1e-20), lw=1, label=label)
    spec.set(xlabel="Hz", ylabel="dB", title="Spectrum", xlim=(20, sr / 2))
    spec.grid(alpha=0.3, which="both")

    specs = [sps.spectrogram(s, sr, nperseg=2048, noverlap=1536) for s in (x, y)]
    top = max(10 * np.log10(p.max() + 1e-20) for _, _, p in specs)  # one color scale for both, 100 dB deep
    for col, ((f, t, p), label) in enumerate(zip(specs, labels)):
        ax = fig.add_subplot(grid[1, col])
        ax.pcolormesh(t, f[1:], 10 * np.log10(p[1:] + 1e-20), cmap="magma", vmin=top - 100, vmax=top, shading="auto")
        ax.set(xlabel="s", ylabel="Hz", title=f"Spectrogram · {label}", yscale="log", ylim=(20, sr / 2))
    return fig


def transfer(process, sr=SR, amp=1.0, freq=50.0):
    """Output against input for a sine sweeping -amp..amp through process(x) -> y.

    A memoryless waveshaper draws a single curve; filters and other stateful processing draw loops.
    """
    x = sine(freq, dur=0.5, amp=amp, sr=sr)
    y = _mono(process(x))
    last = slice(len(x) - 2 * int(sr / freq), len(x))
    fig = Figure(figsize=(4.5, 4.5), layout="constrained")
    ax = fig.subplots()
    ax.plot(x[last], y[last], lw=1.2)
    ax.axhline(0, color="gray", lw=0.5)
    ax.axvline(0, color="gray", lw=0.5)
    ax.set(xlabel="input", ylabel="output", title="Transfer curve")
    ax.grid(alpha=0.3)
    return fig


def view(x, y, sr=SR, labels=("Input", "Output"), **compare_args):
    """Players and plots for an input and its processed output."""
    return mo.vstack([listen(x, y, labels=list(labels), sr=sr), compare(x, y, sr, labels, **compare_args)])
