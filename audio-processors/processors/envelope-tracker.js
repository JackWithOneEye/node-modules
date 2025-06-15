import { EnvelopeTracker } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { MEMORY_DETACHED_EVENT, cachedF32Memory } from './memory';

class EnvelopeTrackerProcessor extends AudioWorkletProcessor {
  #envelopeTracker = new EnvelopeTracker(RENDER_QUANTUM_FRAMES, sampleRate);

  #inputBuffer = new HeapAudioBuffer(this.#envelopeTracker.input_ptr(), 1);
  #modulationOutputBuffer = new HeapAudioBuffer(this.#envelopeTracker.modulation_output_ptr(), 1);
  #triggerOutputBuffer = new HeapAudioBuffer(this.#envelopeTracker.trigger_output_ptr(), 1);

  #destroyed = false;

  constructor() {
    super();

    this.port.onmessage = ((e) => {
      if (e.data === 'destroy') {
        this.#destroy();
      } else if (e.data === 'reset') {
        this.#envelopeTracker.reset();
      }
    });

    cachedF32Memory.registerListener(this);
  }

  static get parameterDescriptors() {
    return /** @type {const} */ ([
      {
        name: 'sensitivity',
        defaultValue: 1.0,
        minValue: 0.25,
        maxValue: 5.0,
      },
      {
        name: 'threshold',
        defaultValue: -60.0,
        minValue: -60.0,
        maxValue: 0.0,
      },
    ]);
  }

  /**
   * @param {Event} e 
   */
  handleEvent(e) {
    if (e.type === MEMORY_DETACHED_EVENT) {
      this.#inputBuffer.recoverMemory(this.#envelopeTracker.input_ptr());
      this.#modulationOutputBuffer.recoverMemory(this.#envelopeTracker.modulation_output_ptr());
      this.#triggerOutputBuffer.recoverMemory(this.#envelopeTracker.trigger_output_ptr());
    }
  }

  /**
   * @param {Float32Array[][]} inputList 
   * @param {Float32Array[][]} outputList 
   * @param {Record<import('./types').ParameterName<typeof EnvelopeTrackerProcessor>, Float32Array>} parameters 
   */
  process(inputList, outputList, parameters) {
    if (this.#destroyed) {
      return false;
    }

    this.#inputBuffer.setChannelData(inputList[0][0], 0);

    this.#envelopeTracker.process(
      parameters.sensitivity[0],
      parameters.threshold[0]
    );

    outputList[0][0].set(this.#modulationOutputBuffer.getChannelData(0));
    outputList[1][0].set(this.#triggerOutputBuffer.getChannelData(0));

    return true;
  }

  #destroy() {
    this.#envelopeTracker.free();
    this.#inputBuffer.free();
    this.#modulationOutputBuffer.free();
    this.#triggerOutputBuffer.free();
    cachedF32Memory.unregisterListener(this);
    this.#destroyed = true;
  }
}
registerProcessor('envelope-tracker', EnvelopeTrackerProcessor);
