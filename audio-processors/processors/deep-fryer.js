import { DeepFryer } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { MEMORY_DETACHED_EVENT, cachedF32Memory } from './memory';

const CHANNELS = 2;

class DeepFryerProcessor extends AudioWorkletProcessor {
    #deepFryer = new DeepFryer(RENDER_QUANTUM_FRAMES, sampleRate, CHANNELS);

    #inputBuffer = new HeapAudioBuffer(this.#deepFryer.input_buffer_ptr(), CHANNELS);
    #outputBuffer = new HeapAudioBuffer(this.#deepFryer.output_buffer_ptr(), CHANNELS);

    #destroyed = false;

    constructor() {
        super();

        this.port.onmessage = ((e) => {
            if (e.data === 'reset') {
                this.#deepFryer.reset();
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
                name: 'magnitude',
                defaultValue: 10,
                minValue: 2,
                maxValue: 11,
                automationRate: 'k-rate'
            },
            {
                name: 'overlap',
                defaultValue: 0.5,
                minValue: 0.0,
                maxValue: 0.5,
                automationRate: 'k-rate'
            },
            {
                name: 'generations',
                defaultValue: 1,
                minValue: 1,
                maxValue: 10,
                automationRate: 'k-rate'
            },
            {
                name: 'ampBits',
                defaultValue: 32,
                minValue: 1,
                maxValue: 32,
                automationRate: 'k-rate'
            },
            {
                name: 'phaseBits',
                defaultValue: 32,
                minValue: 1,
                maxValue: 32,
                automationRate: 'k-rate'
            },
            {
                name: 'sigBits',
                defaultValue: 32,
                minValue: 1,
                maxValue: 32,
                automationRate: 'k-rate'
            },
        ]);
    }

    /**
     * @param {Event} e 
     */
    handleEvent(e) {
        if (e.type === MEMORY_DETACHED_EVENT) {
            this.#inputBuffer.recoverMemory(this.#deepFryer.input_buffer_ptr());
            this.#outputBuffer.recoverMemory(this.#deepFryer.output_buffer_ptr());
        }
    }

    /**
     * @param {Float32Array[][]} inputList 
     * @param {Float32Array[][]} outputList 
     * @param {Record<import('./types').ParameterName<typeof DeepFryerProcessor>, Float32Array>} parameters 
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

        this.#deepFryer.process(
            parameters['dryWetMix'][0],
            parameters['magnitude'][0],
            parameters['overlap'][0],
            parameters['generations'][0],
            parameters['ampBits'][0],
            parameters['phaseBits'][0],
            parameters['sigBits'][0],
        );

        for (let channel = 0; channel < outputList[0].length; channel++) {
            outputList[0][channel].set(this.#outputBuffer.getChannelData(channel));
        }

        return true;
    }

    #destroy() {
        this.#deepFryer.free();
        this.#inputBuffer.free();
        this.#outputBuffer.free();
        cachedF32Memory.unregisterListener(this);
        this.#destroyed = true;
    }
}
registerProcessor('deep-fryer', DeepFryerProcessor);
