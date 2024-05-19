import { BitCrusher, Decimator, Multiplier } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { cachedF32Memory } from './memory';

const CHANNELS = 2;

class DecimatorProcessor extends AudioWorkletProcessor {
    #decimator = new Decimator(RENDER_QUANTUM_FRAMES, sampleRate, CHANNELS);

    #inputBuffer = new HeapAudioBuffer(this.#decimator.input_ptr(), CHANNELS);
    #outputBuffer = new HeapAudioBuffer(this.#decimator.output_ptr(), CHANNELS);;

    #destroyed = false;

    constructor() {
        super();

        this.port.onmessage = ((e) => {
            if (e.data === 'reset') {
                this.#decimator.reset();
            } else if (e.data === 'destroy') {
                this.#destroy();
            }
        });

        cachedF32Memory.registerListener(this, () => {
            this.#inputBuffer.recoverMemory(this.#decimator.input_ptr());
            this.#outputBuffer.recoverMemory(this.#decimator.output_ptr());
        });
    }

    static get parameterDescriptors() {
        return /** @type {const} */ ([
            {
                name: 'reduction',
                defaultValue: 1,
                minValue: 0.001,
                maxValue: 1,
                automationRate: 'k-rate'
            },
            {
                name: 'stereoShift',
                defaultValue: 0,
                minValue: 0,
                maxValue: 1,
                automationRate: 'k-rate'
            }
        ]);
    }

    /**
     * @param {Float32Array[][]} inputList 
     * @param {Float32Array[][]} outputList 
     * @param {Record<import('./types').ParameterName<typeof DecimatorProcessor>, Float32Array>} parameters 
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

        this.#decimator.process(parameters['reduction'][0], parameters['stereoShift'][0]);

        for (let channel = 0; channel < outputList[0].length; channel++) {
            outputList[0][channel].set(this.#outputBuffer.getChannelData(channel));
        }

        return true;
    }

    #destroy() {
        this.#decimator.free();
        this.#inputBuffer.free();
        this.#outputBuffer.free();
        this.#destroyed = true;
    }
}
registerProcessor('decimator', DecimatorProcessor);