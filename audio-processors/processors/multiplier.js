import { Multiplier } from '../pkg/audio_processors';
import { cachedF32Memory } from './memory';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';

const CHANNELS = 1;

class MultiplierProcessor extends AudioWorkletProcessor {
    #multiplier = new Multiplier(RENDER_QUANTUM_FRAMES, CHANNELS);

    #input1Buffer = new HeapAudioBuffer(this.#multiplier.input_1_ptr(), CHANNELS, cachedF32Memory.get());
    #input2Buffer = new HeapAudioBuffer(this.#multiplier.input_2_ptr(), CHANNELS, cachedF32Memory.get());

    #outputBuffer = new HeapAudioBuffer(this.#multiplier.output_ptr(), CHANNELS, cachedF32Memory.get());;

    #destroyed = false;

    constructor() {
        super();

        this.port.onmessage = ((e) => {
            if (e.data === 'destroy') {
                this.#multiplier.free();
                this.#input1Buffer.free();
                this.#input2Buffer.free();
                this.#outputBuffer.free();
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
        const input1Channels = input1.length - 1;
        const input2 = inputList[1];
        const input2Channels = input2.length - 1;

        for (let channel = 0; channel < CHANNELS; channel++) {
            this.#input1Buffer.setChannelData(input1[Math.min(channel, input1Channels)], channel);
            this.#input2Buffer.setChannelData(input2[Math.min(channel, input2Channels)], channel);
        }

        this.#multiplier.process();

        for (let channel = 0; channel < CHANNELS; channel++) {
            outputList[0][channel].set(this.#outputBuffer.getChannelData(channel));
        }

        return true;
    }
}
registerProcessor('multiplier', MultiplierProcessor);