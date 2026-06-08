import { Phaser } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { HeapParameterBuffer } from './helpers/heap-parameter-buffer';
import { MEMORY_DETACHED_EVENT, cachedF32Memory } from './memory';

const CHANNELS = 2;

class PhaserProcessor extends AudioWorkletProcessor {
  #phaser = new Phaser(RENDER_QUANTUM_FRAMES, sampleRate, CHANNELS);

  #inputBuffer = new HeapAudioBuffer(this.#phaser.input_buffer_ptr(), CHANNELS);
  #outputBuffer = new HeapAudioBuffer(this.#phaser.output_buffer_ptr(), CHANNELS);

  #modulationBuffer = new HeapParameterBuffer(this.#phaser.modulation_buffer_ptr());
  #depthBuffer = new HeapParameterBuffer(this.#phaser.depth_buffer_ptr());
  #intensityBuffer = new HeapParameterBuffer(this.#phaser.intensity_buffer_ptr());

  #destroyed = false;

  constructor() {
    super();

    this.port.onmessage = ((e) => {
      if (e.data === 'reset') {
        this.#phaser.reset();
      } else if (e.data === 'destroy') {
        this.#destroy();
      }
    });

    cachedF32Memory.registerListener(this);
  }

  static get parameterDescriptors() {
    return /** @type {const} */ ([
      {
        name: 'modulation',
        defaultValue: 0.0,
        minValue: -1.0,
        maxValue: 1.0,
        automationRate: 'a-rate'
      },
      {
        name: 'depth',
        defaultValue: 0.5,
        minValue: 0.0,
        maxValue: 1.0,
        automationRate: 'a-rate'
      },
      {
        name: 'intensity',
        defaultValue: 0.0,
        minValue: 0.0,
        maxValue: 1.0,
        automationRate: 'a-rate'
      },
      {
        name: 'stages',
        defaultValue: 4,
        minValue: 1,
        maxValue: 6,
        automationRate: 'k-rate'
      },
      {
        name: 'modulationMapping',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: 'k-rate'
      },
    ]);
  }

  /**
   * @param {Event} e 
   */
  handleEvent(e) {
    if (e.type === MEMORY_DETACHED_EVENT) {
      this.#inputBuffer.recoverMemory(this.#phaser.input_buffer_ptr());
      this.#outputBuffer.recoverMemory(this.#phaser.output_buffer_ptr());
      this.#modulationBuffer.recoverMemory(this.#phaser.modulation_buffer_ptr());
      this.#depthBuffer.recoverMemory(this.#phaser.depth_buffer_ptr());
      this.#intensityBuffer.recoverMemory(this.#phaser.intensity_buffer_ptr());
    }
  }

  /**
   * @param {Float32Array[][]} inputList 
   * @param {Float32Array[][]} outputList 
   * @param {Record<import('./types').ParameterName<typeof PhaserProcessor>, Float32Array>} parameters 
   */
  process(inputList, outputList, parameters) {
    if (this.#destroyed) {
      return false;
    }

    const input = inputList[0];

    const inputChannels = input.length - 1;
    for (let channel = 0; channel < CHANNELS; channel++) {
      this.#inputBuffer.setChannelData(input[Math.min(channel, inputChannels)], channel);
    }
    this.#modulationBuffer.setData(parameters.modulation);
    this.#depthBuffer.setData(parameters.depth);
    this.#intensityBuffer.setData(parameters.intensity);

    this.#phaser.process(parameters.stages[0], parameters.modulationMapping[0]);

    for (let channel = 0; channel < CHANNELS; channel++) {
      outputList[0][channel].set(this.#outputBuffer.getChannelData(channel));
    }

    return true;
  }

  #destroy() {
    this.#phaser.free();
    this.#inputBuffer.free();
    this.#outputBuffer.free();
    cachedF32Memory.unregisterListener(this);
    this.#destroyed = true;
  }
}
registerProcessor('phaser', PhaserProcessor);
