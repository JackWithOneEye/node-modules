import { EnvelopeGenerator } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { MEMORY_DETACHED_EVENT, cachedF32Memory } from './memory';

class EnvelopeGeneratorProcessor extends AudioWorkletProcessor {
  #envelopeGenerator = new EnvelopeGenerator(RENDER_QUANTUM_FRAMES, sampleRate);

  #triggerInputBuffer = new HeapAudioBuffer(this.#envelopeGenerator.trigger_input_buffer_ptr(), 1);
  #retriggerInputBuffer = new HeapAudioBuffer(this.#envelopeGenerator.retrigger_input_buffer_ptr(), 1);
  #velocityInputBuffer = new HeapAudioBuffer(this.#envelopeGenerator.velocity_input_buffer_ptr(), 1);
  #outputBuffer = new HeapAudioBuffer(this.#envelopeGenerator.output_buffer_ptr(), 1);

  #destroyed = false;

  constructor() {
    super();

    this.port.onmessage = ((e) => {
      if (e.data === 'reset') {
        this.#envelopeGenerator.reset();
      } else if (e.data === 'destroy') {
        this.#destroy();
      }
    });

    cachedF32Memory.registerListener(this);
  }

  static get parameterDescriptors() {
    return /** @type {const} */ ([
      {
        name: 'attack',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 5000.0
      },
      {
        name: 'decay',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 5000.0
      },
      {
        name: 'sustain',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 1.0
      },
      {
        name: 'release',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 5000.0
      },
      {
        name: 'applyVelocity',
        defaultValue: 0.0,
        minValue: 0.0,
        maxValue: 1.0
      }
    ]);
  }

  /**
   * @param {Event} e 
   */
  handleEvent(e) {
    if (e.type === MEMORY_DETACHED_EVENT) {
      this.#triggerInputBuffer.recoverMemory(this.#envelopeGenerator.trigger_input_buffer_ptr());
      this.#retriggerInputBuffer.recoverMemory(this.#envelopeGenerator.retrigger_input_buffer_ptr());
      this.#velocityInputBuffer.recoverMemory(this.#envelopeGenerator.velocity_input_buffer_ptr());
      this.#outputBuffer.recoverMemory(this.#envelopeGenerator.output_buffer_ptr());
    }
  }

  /**
   * @param {Float32Array[][]} inputList 
   * @param {Float32Array[][]} outputList 
   * @param {Record<import('./types').ParameterName<typeof EnvelopeGeneratorProcessor>, Float32Array>} parameters 
   */
  process(inputList, outputList, parameters) {
    if (this.#destroyed) {
      return false;
    }

    this.#triggerInputBuffer.setChannelData(inputList[0][0], 0);
    this.#retriggerInputBuffer.setChannelData(inputList[1][0], 0);
    this.#velocityInputBuffer.setChannelData(inputList[2][0], 0);

    this.#envelopeGenerator.process(
      parameters['attack'][0],
      parameters['decay'][0],
      parameters['sustain'][0],
      parameters['release'][0],
      parameters['applyVelocity'][0] > 0.5
    );

    outputList[0][0].set(this.#outputBuffer.getChannelData(0));

    return true;
  }

  #destroy() {
    this.#envelopeGenerator.free();
    this.#triggerInputBuffer.free();
    this.#retriggerInputBuffer.free();
    this.#velocityInputBuffer.free();
    this.#outputBuffer.free();
    cachedF32Memory.unregisterListener(this);
    this.#destroyed = true;
  }
}
registerProcessor('envelope-generator', EnvelopeGeneratorProcessor);
