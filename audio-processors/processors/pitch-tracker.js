import { PitchTracker } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { MEMORY_DETACHED_EVENT, cachedF32Memory } from './memory';

class PitchTrackerProcessor extends AudioWorkletProcessor {
  #pitchTracker;
  #inputBuffer;
  #outputBuffer;
  #destroyed = false;

  /**
     * @param {AudioWorkletNodeOptions} options
     */
  constructor(options) {
    super();

    const { windowSizeSamples } = options.processorOptions;

    if (typeof windowSizeSamples !== 'number') {
      throw new Error('PitchTracker requires windowSizeSamples parameter in processorOptions');
    }

    this.#pitchTracker = new PitchTracker(RENDER_QUANTUM_FRAMES, sampleRate, windowSizeSamples);
    this.#inputBuffer = new HeapAudioBuffer(this.#pitchTracker.input_ptr(), 1);
    this.#outputBuffer = new HeapAudioBuffer(this.#pitchTracker.output_ptr(), 1);

    this.port.onmessage = ((e) => {
      if (e.data === 'destroy') {
        this.#destroy();
      } else if (e.data === 'reset') {
        this.#pitchTracker.reset();
      }
    });

    cachedF32Memory.registerListener(this);
  }

  static get parameterDescriptors() {
    return /** @type {const} */ ([
      {
        name: 'harmonicThreshold',
        defaultValue: 0.1,
        minValue: 0.01,
        maxValue: 1.0,
      },
    ]);
  }

  /**
   * @param {Event} e 
   */
  handleEvent(e) {
    if (e.type === MEMORY_DETACHED_EVENT) {
      this.#inputBuffer.recoverMemory(this.#pitchTracker.input_ptr());
      this.#outputBuffer.recoverMemory(this.#pitchTracker.output_ptr());
    }
  }

  /**
   * @param {Float32Array[][]} inputList 
   * @param {Float32Array[][]} outputList 
   * @param {Record<import('./types').ParameterName<typeof PitchTrackerProcessor>, Float32Array>} parameters 
   */
  process(inputList, outputList, parameters) {
    if (this.#destroyed) {
      return false;
    }

    this.#inputBuffer.setChannelData(inputList[0][0], 0);

    this.#pitchTracker.process(
      parameters.harmonicThreshold[0]
    );

    if (this.#outputBuffer.isMemoryDetached()) {
      this.#outputBuffer.recoverMemory(this.#pitchTracker.output_ptr())
    }

    outputList[0][0].set(this.#outputBuffer.getChannelData(0));

    return true;
  }

  #destroy() {
    this.#pitchTracker.free();
    this.#inputBuffer.free();
    this.#outputBuffer.free();
    cachedF32Memory.unregisterListener(this);
    this.#destroyed = true;
  }
}

registerProcessor('pitch-tracker', PitchTrackerProcessor);
