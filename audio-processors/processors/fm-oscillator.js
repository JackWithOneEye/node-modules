import { FMOscillator } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { HeapParameterBuffer } from './helpers/heap-parameter-buffer';
import { MEMORY_DETACHED_EVENT, cachedF32Memory } from './memory';

class FMOscillatorProcessor extends AudioWorkletProcessor {
  #fmOscillator = new FMOscillator(RENDER_QUANTUM_FRAMES, sampleRate, 2);

  #frequencyBuffer = new HeapParameterBuffer(this.#fmOscillator.frequency_ptr());
  #phaseShiftBuffer = new HeapParameterBuffer(this.#fmOscillator.phase_shift_ptr());
  #outputBuffer = new HeapAudioBuffer(this.#fmOscillator.output_ptr(), 2);

  #destroyed = false;

  constructor() {
    super();

    this.port.onmessage = ((e) => {
      if (e.data === 'destroy') {
        this.#destroy();
      } else if (e.data === 'reset') {
        this.#fmOscillator.reset();
      }
    });

    cachedF32Memory.registerListener(this);
  }

  static get parameterDescriptors() {
    return /** @type {const} */ ([
      {
        name: 'frequency',
        defaultValue: 0.0,
        minValue: 0.0,
        maxValue: 4186.009,
      },
      {
        name: 'pitchShift',
        defaultValue: 0,
        minValue: -24,
        maxValue: 24,
      },
      {
        name: 'phaseShift',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
      },
    ]);
  }

  /**
   * @param {Event} e 
   */
  handleEvent(e) {
    if (e.type === MEMORY_DETACHED_EVENT) {
      this.#outputBuffer.recoverMemory(this.#fmOscillator.output_ptr());
      this.#frequencyBuffer.recoverMemory(this.#fmOscillator.frequency_ptr());
      this.#phaseShiftBuffer.recoverMemory(this.#fmOscillator.phase_shift_ptr());
    }
  }

  /**
   * @param {Float32Array[][]} _inputList 
   * @param {Float32Array[][]} outputList 
   * @param {Record<import('./types').ParameterName<typeof FMOscillatorProcessor>, Float32Array>} parameters 
   */
  process(_inputList, outputList, parameters) {
    if (this.#destroyed) {
      return false;
    }

    this.#frequencyBuffer.setData(parameters.frequency);
    this.#phaseShiftBuffer.setData(parameters.phaseShift);

    this.#fmOscillator.process(
      parameters.pitchShift[0]
    );

    outputList[0][0].set(this.#outputBuffer.getChannelData(0));
    outputList[0][1].set(this.#outputBuffer.getChannelData(1));

    return true;
  }

  #destroy() {
    this.#fmOscillator.free();
    this.#outputBuffer.free();
    cachedF32Memory.unregisterListener(this);
    this.#destroyed = true;
  }
}
registerProcessor('fm-oscillator', FMOscillatorProcessor);
