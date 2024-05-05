import { BitCrusher, Multiplier } from '../pkg/audio_processors';
import { cachedF32Memory } from './memory';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';

const CHANNELS = 2;

class BitCrusherProcessor extends AudioWorkletProcessor {
    #bitCrusher = new BitCrusher(RENDER_QUANTUM_FRAMES, sampleRate, CHANNELS);

    #inputBuffer = new HeapAudioBuffer(this.#bitCrusher.input_ptr(), CHANNELS, cachedF32Memory.get());
    #outputBuffer = new HeapAudioBuffer(this.#bitCrusher.output_ptr(), CHANNELS, cachedF32Memory.get());;

    #destroyed = false;

    constructor() {
        super();

        this.port.onmessage = ((e) => {
            if (e.data === 'reset') {
                this.#bitCrusher.reset();
            } else if (e.data === 'destroy') {
                this.#destroy();
            }
        });
    }

    static get parameterDescriptors() {
        return /** @type {const} */ ([
            {
                name: 'bits',
                defaultValue: 32.0,
                minValue: 1.0,
                maxValue: 32.0,
                automationRate: 'k-rate'
            }
        ]);
    }

    /**
     * @param {Float32Array[][]} inputList 
     * @param {Float32Array[][]} outputList 
     * @param {Record<import('./types').ParameterName<typeof BitCrusherProcessor>, Float32Array>} parameters 
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

        this.#bitCrusher.process(parameters['bits'][0]);

        for (let channel = 0; channel < outputList[0].length; channel++) {
            outputList[0][channel].set(this.#outputBuffer.getChannelData(channel));
        }

        return true;
    }

    #destroy() {
        this.#bitCrusher.free();
        this.#inputBuffer.free();
        this.#outputBuffer.free();
        this.#destroyed = true;
    }
}
registerProcessor('bit-crusher', BitCrusherProcessor);