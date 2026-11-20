# DSP lab

[marimo](https://marimo.io) notebooks for prototyping module algorithms before they become Rust in
`audio-processors/`. Run test signals or clips through an idea, then listen and look at the result.
Prototypes can be Python (numpy, with numba for sample loops) or [Faust](https://faust.grame.fr)
(through [DawDreamer](https://github.com/DBraun/DawDreamer)).

## Run

```sh
cd lab
uv run marimo edit notebooks          # file browser for all notebooks
uv run marimo edit notebooks/new.py   # start a new notebook
```

`uv` installs everything on first run.

marimo is reactive: changing a slider or editing a cell re-runs every cell that depends on it, so there
is no stale state and no "run all". Notebooks are plain `.py` files.

## Helpers

Start a notebook with `import dsplab as lab` (see [`notebooks/waveshaper.py`](notebooks/waveshaper.py)).
Signals are float32 numpy arrays at `lab.SR` (48 kHz): 1D for mono, `(channels, samples)` otherwise.

| | |
|---|---|
| Test signals | `sine`, `saw`, `square` (band-limited), `noise`, `sweep`, `impulse`, `pluck`; `db(-6)` for levels |
| Clips | `clip("name.wav")` loads from `lab/clips/` (or a path, or uploaded bytes), resampled; `clips()` lists them |
| Faust | `faust(code, x, **params)` renders; `faust_controls(code)` makes sliders from the program's `hslider`s |
| Python params | `controls(drive=(0, 40, 12))` makes sliders; pass `**controls.value` to your function |
| Look and listen | `view(x, y)` (players + plots), `listen(*signals)`, `compare(x, y)`, `transfer(fn)` |

`listen` keeps relative levels: louder output sounds louder, and everything is turned down together
only when something would clip.

## From Faust to Rust

Faust's compiler can emit Rust: `faust -lang rust prototype.dsp`. Wrap the generated struct in a
`#[wasm_bindgen]` struct like the ones in `audio-processors/wasm/src/`.
