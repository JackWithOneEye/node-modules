import { MultiFilter } from '../pkg/audio_processors';
import { cachedF32Memory } from './memory';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';

const CHANNELS = 2;

export class MultiFilterProcessor extends AudioWorkletProcessor {
    #multiFilter = new MultiFilter(RENDER_QUANTUM_FRAMES, sampleRate, CHANNELS);

    #heapInputBuffer = new HeapAudioBuffer(this.#multiFilter.input_ptr(), CHANNELS, cachedF32Memory.get());

    #heapBpfOutBuffer = new HeapAudioBuffer(this.#multiFilter.bpf_out_ptr(), CHANNELS, cachedF32Memory.get());
    #heapBsfOutBuffer = new HeapAudioBuffer(this.#multiFilter.bsf_out_ptr(), CHANNELS, cachedF32Memory.get());
    #heapHpfOutBuffer = new HeapAudioBuffer(this.#multiFilter.hpf_out_ptr(), CHANNELS, cachedF32Memory.get());
    #heapLpfOutBuffer = new HeapAudioBuffer(this.#multiFilter.lpf_out_ptr(), CHANNELS, cachedF32Memory.get());

    #destroyed = false;

    constructor() {
        super();

        this.port.onmessage = ((e) => {
            if (e.data === 'reset') {
                this.#multiFilter.reset();
            } else if (e.data === 'destroy') {
                this.#multiFilter.free();
                this.#destroyed = true;
            }
        });
    }

    static get parameterDescriptors() {
        return [
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
        ];
    }

    /**
     * @param {Float32Array[][]} inputList 
     * @param {Float32Array[][]} outputList 
     * @param {Record<string, Float32Array>} parameters 
     */
    process(inputList, outputList, parameters) {
        if (this.#destroyed) {
            return false;
        }
        const input = inputList[0];
        const channelCount = Math.min(CHANNELS, input.length);

        for (let channel = 0; channel < channelCount; channel++) {
            this.#heapInputBuffer.setChannelData(input[channel], channel);
        }

        this.#multiFilter.process(parameters['cutoff'][0], parameters['q'][0]);

        for (let channel = 0; channel < channelCount; channel++) {
            outputList[0][channel].set(this.#heapBpfOutBuffer.getChannelData(channel));
            outputList[1][channel].set(this.#heapBsfOutBuffer.getChannelData(channel));
            outputList[2][channel].set(this.#heapHpfOutBuffer.getChannelData(channel));
            outputList[3][channel].set(this.#heapLpfOutBuffer.getChannelData(channel));
        }

        return true;
    }
}
registerProcessor('multi-filter', MultiFilterProcessor);
