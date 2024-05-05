import { Graindr } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { cachedF32Memory } from './memory';

const CHANNELS = 2;

class GraindrProcessor extends AudioWorkletProcessor {
    #graindr = new Graindr(RENDER_QUANTUM_FRAMES, sampleRate, CHANNELS);
    #inputBuffer = new HeapAudioBuffer(this.#graindr.input_ptr(), CHANNELS, cachedF32Memory.get());
    #outputBuffer = new HeapAudioBuffer(this.#graindr.output_ptr(), CHANNELS, cachedF32Memory.get());

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

        this.#graindr.process(
            parameters.dryWetMix[0],
            parameters.grainSizeMs[0],
            parameters.pitchShift[0],
            parameters.fineTune[0],
            parameters.texture[0],
            parameters.stretch[0],
            parameters.shimmer[0],
            parameters.feedback[0],
            parameters.hiCut[0],
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
        this.#destroyed = true;
    }
}
registerProcessor('graindr', GraindrProcessor);