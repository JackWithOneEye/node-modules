import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Waveshaper prototypes

    The same idea built twice, once in Python and once in Faust: drive into `tanh`, then a tone filter.
    Change a slider or edit a cell, and everything that depends on it re-renders.
    """)
    return


@app.cell
def _():
    import marimo as mo
    import numpy as np
    from numba import njit

    import dsplab as lab

    return lab, mo, njit, np


@app.cell(hide_code=True)
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


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Prototype 1: Python

    Vectorised numpy where that's easy; a plain sample loop with `@njit` (numba) where the algorithm
    has state. Loops like this one port almost line for line to a Rust `process` function.
    """)
    return


@app.cell
def _(lab, njit, np):
    @njit
    def one_pole_lowpass(x, cutoff, sr):
        g = 1 - np.exp(-2 * np.pi * cutoff / sr)
        y = np.empty_like(x)
        z = 0.0
        for n in range(len(x)):
            z += g * (x[n] - z)
            y[n] = z
        return y

    def shaper(x, drive=12.0, bias=0.0, tone=8000.0, sr=lab.SR):
        """tanh drive; bias makes the curve asymmetric (even harmonics) and is removed again afterwards."""
        y = np.tanh(lab.db(drive) * x + bias) - np.tanh(bias)
        return one_pole_lowpass(y.astype(np.float32), tone, sr)

    return (shaper,)


@app.cell
def _(lab):
    py_ui = lab.controls(drive=(0, 40, 12, 0.5), bias=(-1, 1, 0.2, 0.01), tone=(200, 20000, 8000, 10))
    py_ui.hstack(justify="start", wrap=True)
    return (py_ui,)


@app.cell
def _(lab, py_ui, shaper, x):
    y_py = shaper(x, **py_ui.value)
    lab.view(x, y_py)
    return (y_py,)


@app.cell
def _(lab, py_ui, shaper):
    lab.transfer(lambda s: shaper(s, **py_ui.value))
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Prototype 2: Faust

    Edit the program below and run the cell. Its sliders are generated from the `hslider`s,
    and Faust compile errors show up under the cell. Library reference: https://faustlibraries.grame.fr
    """)
    return


@app.cell
def _():
    faust_code = r"""
    import("stdfaust.lib");
    drive  = hslider("drive [unit:dB]", 12, 0, 40, 0.5) : ba.db2linear : si.smoo;
    cutoff = hslider("cutoff [unit:Hz]", 4000, 50, 18000, 1) : si.smoo;
    res    = hslider("resonance", 1.5, 0.5, 10, 0.01) : si.smoo;
    process = *(drive) : ma.tanh : fi.resonlp(cutoff, res, 1);
    """
    return (faust_code,)


@app.cell
def _(faust_code, lab):
    faust_ui = lab.faust_controls(faust_code)
    faust_ui.hstack(justify="start", wrap=True)
    return (faust_ui,)


@app.cell
def _(faust_code, faust_ui, lab, x):
    y_faust = lab.faust(faust_code, x, **faust_ui.value)
    lab.view(x, y_faust)
    return (y_faust,)


@app.cell
def _(faust_code, faust_ui, lab):
    lab.transfer(lambda s: lab.faust(faust_code, s, **faust_ui.value))
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Python vs Faust
    """)
    return


@app.cell
def _(lab, mo, x, y_faust, y_py):
    mo.vstack([
        lab.listen(x, y_py, y_faust, labels=["Input", "Python", "Faust"]),
        lab.compare(y_py, y_faust, labels=("Python", "Faust")),
    ])
    return


if __name__ == "__main__":
    app.run()
