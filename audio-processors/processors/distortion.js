import { Distortion } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { MEMORY_DETACHED_EVENT, cachedF32Memory } from './memory';

const CHANNELS = 2;

class DistortionProcessor extends AudioWorkletProcessor {
    #distortion = new Distortion(RENDER_QUANTUM_FRAMES, sampleRate, CHANNELS);

    #inputBuffer = new HeapAudioBuffer(this.#distortion.input_buffer_ptr(), CHANNELS);
    #outputBuffer = new HeapAudioBuffer(this.#distortion.output_buffer_ptr(), CHANNELS);

    #destroyed = false;

    constructor() {
        super();

        this.port.onmessage = ((e) => {
            if (e.data === 'reset') {
                this.#distortion.reset();
            } else if (e.data === 'destroy') {
                this.#destroy();
            }
        });

        cachedF32Memory.registerListener(this);
    }

    // ranges and defaults follow the yaGRUd plugin (except wh, whose plugin default of 0.01 is near-silent)
    static get parameterDescriptors() {
        return /** @type {const} */ ([
            { name: 'inputGain', defaultValue: 0.0, minValue: -40.0, maxValue: 40.0, automationRate: 'k-rate' },
            { name: 'wf', defaultValue: 2.0, minValue: 0.0, maxValue: 10.0, automationRate: 'k-rate' },
            { name: 'wh', defaultValue: 1.0, minValue: 0.01, maxValue: 5.0, automationRate: 'k-rate' },
            { name: 'uf', defaultValue: 0.0, minValue: 0.0, maxValue: 6.0, automationRate: 'k-rate' },
            { name: 'uh', defaultValue: 0.0, minValue: 0.0, maxValue: 4.0, automationRate: 'k-rate' },
            { name: 'bf', defaultValue: 0.0, minValue: -2.0, maxValue: 5.0, automationRate: 'k-rate' },
            { name: 'outputGain', defaultValue: 0.0, minValue: -60.0, maxValue: 20.0, automationRate: 'k-rate' },
            { name: 'dcFilter', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
        ]);
    }

    /**
     * @param {Event} e 
     */
    handleEvent(e) {
        if (e.type === MEMORY_DETACHED_EVENT) {
            this.#inputBuffer.recoverMemory(this.#distortion.input_buffer_ptr());
            this.#outputBuffer.recoverMemory(this.#distortion.output_buffer_ptr());
        }
    }

    /**
     * @param {Float32Array[][]} inputList 
     * @param {Float32Array[][]} outputList 
     * @param {Record<import('./types').ParameterName<typeof DistortionProcessor>, Float32Array>} parameters 
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

        this.#distortion.process(
            parameters.inputGain[0],
            parameters.wf[0],
            parameters.wh[0],
            parameters.uf[0],
            parameters.uh[0],
            parameters.bf[0],
            parameters.outputGain[0],
            parameters.dcFilter[0] >= 0.5,
        );

        for (let channel = 0; channel < outputList[0].length; channel++) {
            outputList[0][channel].set(this.#outputBuffer.getChannelData(channel));
        }

        return true;
    }

    #destroy() {
        this.#distortion.free();
        this.#inputBuffer.free();
        this.#outputBuffer.free();
        cachedF32Memory.unregisterListener(this);
        this.#destroyed = true;
    }
}
registerProcessor('distortion', DistortionProcessor);
