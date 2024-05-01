import { Multiplier } from '../pkg/audio_processors';
import { cachedF32Memory } from './memory';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';

const CHANNELS = 2;

export class MultiplierProcessor extends AudioWorkletProcessor {
    #multiplier = new Multiplier(RENDER_QUANTUM_FRAMES, CHANNELS);

    #heapInput1Buffer = new HeapAudioBuffer(this.#multiplier.input_1_ptr(), CHANNELS, cachedF32Memory.get());
    #heapInput2Buffer = new HeapAudioBuffer(this.#multiplier.input_2_ptr(), CHANNELS, cachedF32Memory.get());

    #heapOutputBuffer = new HeapAudioBuffer(this.#multiplier.output_ptr(), CHANNELS, cachedF32Memory.get());;

    #destroyed = false;

    constructor() {
        super();

        this.port.onmessage = ((e) => {
             if (e.data === 'destroy') {
                this.#multiplier.free();
                this.#destroyed = true;
            }
        });
    }

    /**
     * @param {Float32Array[][]} inputList 
     * @param {Float32Array[][]} outputList 
     */
    process(inputList, outputList) {
        if (this.#destroyed) {
            return false;
        }
        const input1 = inputList[0];
        const channelCount = Math.min(CHANNELS, input1.length);

        for (let channel = 0; channel < channelCount; channel++) {
            this.#heapInput1Buffer.setChannelData(input1[channel], channel);
            this.#heapInput2Buffer.setChannelData(inputList[1][channel], channel);
        }

        this.#multiplier.process();

        for (let channel = 0; channel < channelCount; channel++) {
            outputList[0][channel].set(this.#heapOutputBuffer.getChannelData(channel));
        }

        return true;
    }
}
registerProcessor('multiplier', MultiplierProcessor);