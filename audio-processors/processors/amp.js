import { Amp } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { MEMORY_DETACHED_EVENT, cachedF32Memory } from './memory';

const CHANNELS = 2;

class AmpProcessor extends AudioWorkletProcessor {
    #amp = new Amp(RENDER_QUANTUM_FRAMES, sampleRate, CHANNELS);

    #inputBuffer = new HeapAudioBuffer(this.#amp.input_buffer_ptr(), CHANNELS);
    #outputBuffer = new HeapAudioBuffer(this.#amp.output_buffer_ptr(), CHANNELS);

    #destroyed = false;

    constructor() {
        super();

        this.port.onmessage = ((e) => {
            if (e.data === 'reset') {
                this.#amp.reset();
            } else if (e.data === 'destroy') {
                this.#destroy();
            }
        });

        cachedF32Memory.registerListener(this);
    }

    static get parameterDescriptors() {
        return /** @type {const} */ ([
            { name: 'gain', defaultValue: 0.0, minValue: -20.0, maxValue: 40.0, automationRate: 'k-rate' },
            { name: 'bass', defaultValue: 0.0, minValue: -12.0, maxValue: 12.0, automationRate: 'k-rate' },
            { name: 'mid', defaultValue: 0.0, minValue: -12.0, maxValue: 12.0, automationRate: 'k-rate' },
            { name: 'treble', defaultValue: 0.0, minValue: -12.0, maxValue: 12.0, automationRate: 'k-rate' },
            { name: 'bright', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
            { name: 'master', defaultValue: 0.0, minValue: -60.0, maxValue: 12.0, automationRate: 'k-rate' },
        ]);
    }

    /**
     * @param {Event} e 
     */
    handleEvent(e) {
        if (e.type === MEMORY_DETACHED_EVENT) {
            this.#inputBuffer.recoverMemory(this.#amp.input_buffer_ptr());
            this.#outputBuffer.recoverMemory(this.#amp.output_buffer_ptr());
        }
    }

    /**
     * @param {Float32Array[][]} inputList 
     * @param {Float32Array[][]} outputList 
     * @param {Record<import('./types').ParameterName<typeof AmpProcessor>, Float32Array>} parameters 
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

        this.#amp.process(
            parameters.gain[0],
            parameters.bass[0],
            parameters.mid[0],
            parameters.treble[0],
            parameters.bright[0] >= 0.5,
            parameters.master[0],
        );

        for (let channel = 0; channel < outputList[0].length; channel++) {
            outputList[0][channel].set(this.#outputBuffer.getChannelData(channel));
        }

        return true;
    }

    #destroy() {
        this.#amp.free();
        this.#inputBuffer.free();
        this.#outputBuffer.free();
        cachedF32Memory.unregisterListener(this);
        this.#destroyed = true;
    }
}
registerProcessor('amp', AmpProcessor);
