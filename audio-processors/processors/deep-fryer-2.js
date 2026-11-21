import { DeepFryer2 } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { MEMORY_DETACHED_EVENT, cachedF32Memory } from './memory';

const CHANNELS = 2;

class DeepFryer2Processor extends AudioWorkletProcessor {
    #deepFryer2 = new DeepFryer2(RENDER_QUANTUM_FRAMES, sampleRate, CHANNELS);

    #inputBuffer = new HeapAudioBuffer(this.#deepFryer2.input_buffer_ptr(), CHANNELS);
    #outputBuffer = new HeapAudioBuffer(this.#deepFryer2.output_buffer_ptr(), CHANNELS);

    #destroyed = false;

    constructor() {
        super();

        this.port.onmessage = ((e) => {
            if (e.data === 'reset') {
                this.#deepFryer2.reset();
            } else if (e.data === 'destroy') {
                this.#destroy();
            }
        });

        cachedF32Memory.registerListener(this);
    }

    static get parameterDescriptors() {
        return /** @type {const} */ ([
            {
                name: 'dryWetMix',
                defaultValue: 1.0,
                minValue: 0.0,
                maxValue: 1.0,
                automationRate: 'k-rate'
            },
            {
                // per channel
                name: 'kbps',
                defaultValue: 32,
                minValue: 8,
                maxValue: 320,
                automationRate: 'k-rate'
            },
            {
                // index into 64, 128, 192, 256, 384, 576, 768, 1024, 1536, 2048
                name: 'hopSize',
                defaultValue: 5,
                minValue: 0,
                maxValue: 9,
                automationRate: 'k-rate'
            },
        ]);
    }

    /**
     * @param {Event} e 
     */
    handleEvent(e) {
        if (e.type === MEMORY_DETACHED_EVENT) {
            this.#inputBuffer.recoverMemory(this.#deepFryer2.input_buffer_ptr());
            this.#outputBuffer.recoverMemory(this.#deepFryer2.output_buffer_ptr());
        }
    }

    /**
     * @param {Float32Array[][]} inputList 
     * @param {Float32Array[][]} outputList 
     * @param {Record<import('./types').ParameterName<typeof DeepFryer2Processor>, Float32Array>} parameters 
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

        this.#deepFryer2.process(
            parameters['dryWetMix'][0],
            parameters['kbps'][0],
            Math.round(parameters['hopSize'][0]),
        );

        for (let channel = 0; channel < outputList[0].length; channel++) {
            outputList[0][channel].set(this.#outputBuffer.getChannelData(channel));
        }

        return true;
    }

    #destroy() {
        this.#deepFryer2.free();
        this.#inputBuffer.free();
        this.#outputBuffer.free();
        cachedF32Memory.unregisterListener(this);
        this.#destroyed = true;
    }
}
registerProcessor('deep-fryer-2', DeepFryer2Processor);
