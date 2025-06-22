import { LFO, LFOPolarity, LFOWaveform } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { HeapParameterBuffer } from './helpers/heap-parameter-buffer';
import { MEMORY_DETACHED_EVENT, cachedF32Memory } from './memory';

class LFOProcessor extends AudioWorkletProcessor {
  #lfo = new LFO(RENDER_QUANTUM_FRAMES, sampleRate);

  #phaseShiftBuffer = new HeapParameterBuffer(this.#lfo.phase_shift_ptr());
  #outputBuffer = new HeapAudioBuffer(this.#lfo.output_ptr(), 1);

  #destroyed = false;

  constructor() {
    super();

    this.port.onmessage = ((e) => {
      if (e.data === 'destroy') {
        this.#destroy();
      } else if (e.data === 'reset') {
        this.#lfo.reset();
      }
    });

    cachedF32Memory.registerListener(this);
  }

  static get parameterDescriptors() {
    return /** @type {const} */ ([
      {
        name: 'frequency',
        defaultValue: 0.1,
        minValue: 0.1,
        maxValue: 20,
      },
      {
        name: 'phase',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
      },
      {
        name: 'polarity',
        defaultValue: LFOPolarity.Bipolar,
        minValue: LFOPolarity.Bipolar,
        maxValue: LFOPolarity.Unipolar,
      },
      {
        name: 'waveform',
        defaultValue: LFOWaveform.Sine,
        minValue: LFOWaveform.Sine,
        maxValue: LFOWaveform.RSH,
      },
    ]);
  }

  /**
   * @param {Event} e 
   */
  handleEvent(e) {
    if (e.type === MEMORY_DETACHED_EVENT) {
      this.#outputBuffer.recoverMemory(this.#lfo.output_ptr());
      this.#phaseShiftBuffer.recoverMemory(this.#lfo.phase_shift_ptr());
    }
  }

  /**
   * @param {Float32Array[][]} inputList 
   * @param {Float32Array[][]} outputList 
   * @param {Record<import('./types').ParameterName<typeof LFOProcessor>, Float32Array>} parameters 
   */
  process(inputList, outputList, parameters) {
    if (this.#destroyed) {
      return false;
    }

    this.#phaseShiftBuffer.setData(parameters.phase);

    this.#lfo.process(
      parameters.frequency[0],
      parameters.polarity[0],
      parameters.waveform[0]
    );

    outputList[0][0].set(this.#outputBuffer.getChannelData(0));

    return true;
  }

  #destroy() {
    this.#lfo.free();
    this.#outputBuffer.free();
    cachedF32Memory.unregisterListener(this);
    this.#destroyed = true;
  }
}
registerProcessor('lfo', LFOProcessor);
