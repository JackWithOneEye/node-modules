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

  #rateBuffer = new HeapParameterBuffer(this.#phaser.rate_buffer_ptr());

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
        name: 'rate',
        defaultValue: 0.5,
        minValue: 0.1,
        maxValue: 20.0,
        automationRate: 'a-rate'
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
      this.#rateBuffer.recoverMemory(this.#phaser.rate_buffer_ptr());
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
    this.#rateBuffer.setData(parameters.rate);

    this.#phaser.process();

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
