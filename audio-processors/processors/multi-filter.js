import { MultiFilter } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { cachedF32Memory } from './memory';

const CHANNELS = 2;

class MultiFilterProcessor extends AudioWorkletProcessor {
    #multiFilter = new MultiFilter(RENDER_QUANTUM_FRAMES, sampleRate, CHANNELS);

    #inputBuffer = new HeapAudioBuffer(this.#multiFilter.input_ptr(), CHANNELS);

    #bpfOutBuffer = new HeapAudioBuffer(this.#multiFilter.bpf_out_ptr(), CHANNELS);
    #bsfOutBuffer = new HeapAudioBuffer(this.#multiFilter.bsf_out_ptr(), CHANNELS);
    #hpfOutBuffer = new HeapAudioBuffer(this.#multiFilter.hpf_out_ptr(), CHANNELS);
    #lpfOutBuffer = new HeapAudioBuffer(this.#multiFilter.lpf_out_ptr(), CHANNELS);

    #destroyed = false;

    constructor() {
        super();

        this.port.onmessage = ((e) => {
            if (e.data === 'reset') {
                this.#multiFilter.reset();
            } else if (e.data === 'destroy') {
                this.#destroy();
            }
        });

        cachedF32Memory.registerListener(this, () => {
            this.#inputBuffer.recoverMemory(this.#multiFilter.input_ptr());
            this.#bpfOutBuffer.recoverMemory(this.#multiFilter.bpf_out_ptr());
            this.#bsfOutBuffer.recoverMemory(this.#multiFilter.bsf_out_ptr());
            this.#hpfOutBuffer.recoverMemory(this.#multiFilter.hpf_out_ptr());
            this.#lpfOutBuffer.recoverMemory(this.#multiFilter.lpf_out_ptr());
        });
    }

    static get parameterDescriptors() {
        return /** @type {const} */ ([
            {
                name: 'cutoff',
                defaultValue: 1000.0,
                minValue: 20.0,
                maxValue: 20480.0,
                automationRate: 'k-rate'
            },
            {
                name: 'q',
                defaultValue: 0.707,
                minValue: 0.707,
                maxValue: 20.0,
                automationRate: 'k-rate'
            },
        ]);
    }

    /**
     * @param {Float32Array[][]} inputList 
     * @param {Float32Array[][]} outputList 
     * @param {Record<import('./types').ParameterName<typeof MultiFilterProcessor>, Float32Array>} parameters 
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

        this.#multiFilter.process(parameters['cutoff'][0], parameters['q'][0]);

        for (let channel = 0; channel < CHANNELS; channel++) {
            outputList[0][channel].set(this.#bpfOutBuffer.getChannelData(channel));
            outputList[1][channel].set(this.#bsfOutBuffer.getChannelData(channel));
            outputList[2][channel].set(this.#hpfOutBuffer.getChannelData(channel));
            outputList[3][channel].set(this.#lpfOutBuffer.getChannelData(channel));
        }

        return true;
    }

    #destroy() {
        this.#multiFilter.free();
        this.#inputBuffer.free();
        this.#bpfOutBuffer.free();
        this.#bsfOutBuffer.free();
        this.#hpfOutBuffer.free();
        this.#lpfOutBuffer.free();
        cachedF32Memory.unregisterListener(this);
        this.#destroyed = true;
    }
}
registerProcessor('multi-filter', MultiFilterProcessor);
