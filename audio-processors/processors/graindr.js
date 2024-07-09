import { Graindr } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { HeapParameterBuffer } from './helpers/heap-parameter-buffer';
import { MEMORY_DETACHED_EVENT, cachedF32Memory } from './memory';

const CHANNELS = 2;

class GraindrProcessor extends AudioWorkletProcessor {
    #graindr = new Graindr(RENDER_QUANTUM_FRAMES, sampleRate, CHANNELS);

    #inputBuffer = new HeapAudioBuffer(this.#graindr.input_ptr(), CHANNELS);
    #outputBuffer = new HeapAudioBuffer(this.#graindr.output_ptr(), CHANNELS);

    #feedbackBuffer = new HeapParameterBuffer(this.#graindr.feedback_ptr());
    #grainSizeMsBuffer = new HeapParameterBuffer(this.#graindr.grain_size_ms_ptr());
    #hiCutFreqBuffer = new HeapParameterBuffer(this.#graindr.hi_cut_freq_ptr());
    #shimmerBuffer = new HeapParameterBuffer(this.#graindr.shimmer_ptr());
    #textureBuffer = new HeapParameterBuffer(this.#graindr.texture_ptr());

    #destroyed = false;

    constructor() {
        super();

        this.port.onmessage = ((e) => {
            if (e.data === 'reset') {
                this.#graindr.reset();
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
                defaultValue: 0.0,
                minValue: 0.0,
                maxValue: 1.0
            },
            {
                name: 'grainSizeMs',
                defaultValue: 50.0,
                minValue: 1.0,
                maxValue: 1000.0
            },
            {
                name: 'pitchShift',
                defaultValue: 0,
                minValue: -12,
                maxValue: 12
            },
            {
                name: 'fineTune',
                defaultValue: 0,
                minValue: -100,
                maxValue: 100
            },
            {
                name: 'texture',
                defaultValue: 0.5,
                minValue: 0.0,
                maxValue: 1.0
            },
            {
                name: 'stretch',
                defaultValue: 1,
                minValue: 1,
                maxValue: 4
            },
            {
                name: 'shimmer',
                defaultValue: 0,
                minValue: 0.0,
                maxValue: 1.0
            },
            {
                name: 'feedback',
                defaultValue: 0,
                minValue: 0.0,
                maxValue: 1.0
            },
            {
                name: 'hiCut',
                defaultValue: 22000.0,
                minValue: 20.0,
                maxValue: 22000.0
            },
            {
                name: 'playbackDirection',
                defaultValue: 0,
                minValue: 0,
                maxValue: 2,
                automationRate: 'k-rate'
            },
            {
                name: 'toneType',
                defaultValue: 0,
                minValue: 0,
                maxValue: 1,
                automationRate: 'k-rate'
            }
        ]);
    }

    /**
     * @param {Event} e 
     */
    handleEvent(e) {
        if (e.type === MEMORY_DETACHED_EVENT) {
            this.#inputBuffer.recoverMemory(this.#graindr.input_ptr());
            this.#outputBuffer.recoverMemory(this.#graindr.output_ptr());
            this.#feedbackBuffer.recoverMemory(this.#graindr.feedback_ptr());
            this.#grainSizeMsBuffer.recoverMemory(this.#graindr.grain_size_ms_ptr());
            this.#hiCutFreqBuffer.recoverMemory(this.#graindr.hi_cut_freq_ptr());
            this.#shimmerBuffer.recoverMemory(this.#graindr.shimmer_ptr());
            this.#textureBuffer.recoverMemory(this.#graindr.texture_ptr());
        }
    }

    /**
     * @param {Float32Array[][]} inputList 
     * @param {Float32Array[][]} outputList 
     * @param {Record<import('./types').ParameterName<typeof GraindrProcessor>, Float32Array>} parameters 
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

        this.#feedbackBuffer.setData(parameters.feedback);
        this.#grainSizeMsBuffer.setData(parameters.grainSizeMs);
        this.#hiCutFreqBuffer.setData(parameters.hiCut);
        this.#shimmerBuffer.setData(parameters.shimmer);
        this.#textureBuffer.setData(parameters.texture);

        this.#graindr.process(
            parameters.dryWetMix[0],
            parameters.pitchShift[0],
            parameters.fineTune[0],
            parameters.stretch[0],
            parameters.playbackDirection[0],
            parameters.toneType[0],
        );

        for (let channel = 0; channel < CHANNELS; channel++) {
            outputList[0][channel].set(this.#outputBuffer.getChannelData(channel));
        }
        return true;
    }

    #destroy() {
        this.#graindr.free();
        this.#inputBuffer.free();
        this.#outputBuffer.free();
        cachedF32Memory.unregisterListener(this);
        this.#destroyed = true;
    }
}
registerProcessor('graindr', GraindrProcessor);