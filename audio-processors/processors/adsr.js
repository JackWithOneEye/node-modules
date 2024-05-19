import { ADSR } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { cachedF32Memory } from './memory';

class ADSRProcessor extends AudioWorkletProcessor {
    #adsr = new ADSR(RENDER_QUANTUM_FRAMES, sampleRate);

    #triggerInputBuffer = new HeapAudioBuffer(this.#adsr.trigger_input_ptr(), 1);
    #retriggerInputBuffer = new HeapAudioBuffer(this.#adsr.retrigger_input_ptr(), 1);
    #outputBuffer = new HeapAudioBuffer(this.#adsr.output_ptr(), 1);

    #destroyed = false;

    constructor() {
        super();

        this.port.onmessage = ((e) => {
            if (e.data === 'reset') {
                this.#adsr.reset();
            } else if (e.data === 'destroy') {
                this.#destroy();
            }
        });

        cachedF32Memory.registerListener(this, () => {
            this.#triggerInputBuffer.recoverMemory(this.#adsr.trigger_input_ptr());
            this.#retriggerInputBuffer.recoverMemory(this.#adsr.retrigger_input_ptr());
            this.#outputBuffer.recoverMemory(this.#adsr.output_ptr());
        });
    }

    static get parameterDescriptors() {
        return /** @type {const} */ ([
            {
                name: 'attack',
                defaultValue: 0.01,
                minValue: 0.0,
                maxValue: 2.0
            },
            {
                name: 'decay',
                defaultValue: 0.0,
                minValue: 0.0,
                maxValue: 2.0
            },
            {
                name: 'sustain',
                defaultValue: 1.0,
                minValue: 0.0,
                maxValue: 1.0
            },
            {
                name: 'release',
                defaultValue: 0.1,
                minValue: 0.001,
                maxValue: 2.0
            }
        ]);
    }

    /**
     * @param {Float32Array[][]} inputList 
     * @param {Float32Array[][]} outputList 
     * @param {Record<import('./types').ParameterName<typeof ADSRProcessor>, Float32Array>} parameters 
     */
    process(inputList, outputList, parameters) {
        if (this.#destroyed) {
            return false;
        }

        this.#triggerInputBuffer.setChannelData(inputList[0][0], 0);
        this.#retriggerInputBuffer.setChannelData(inputList[1][0], 0);

        this.#adsr.process(
            parameters['attack'][0],
            parameters['decay'][0],
            parameters['sustain'][0],
            parameters['release'][0]
        );

        outputList[0][0].set(this.#outputBuffer.getChannelData(0));

        return true;
    }

    #destroy() {
        this.#adsr.free();
        this.#triggerInputBuffer.free();
        this.#retriggerInputBuffer.free();
        this.#outputBuffer.free();
    }
}
registerProcessor('adsr', ADSRProcessor);