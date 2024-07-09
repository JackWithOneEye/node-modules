import { ToggleUtil } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';

const CHANNELS = 2;

class NoiseGeneratorProcessor extends AudioWorkletProcessor {
    #brownianGenerator = new BrownianNoiseGenerator();
    #toggleUtil = new ToggleUtil(sampleRate);

    #destroyed = false;

    constructor() {
        super();

        this.port.onmessage = ((e) => {
            if (e.data === 'reset') {
                this.#brownianGenerator.reset();
            } else if (e.data === 'destroy') {
                this.#destroy();
            }
        });
    }

    static get parameterDescriptors() {
        return /** @type {const} */ ([
            {
                name: 'noiseType',
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
     * @param {Record<import('./types').ParameterName<typeof NoiseGeneratorProcessor>, Float32Array>} parameters 
     */
    process(inputList, outputList, parameters) {
        if (this.#destroyed) {
            return false;
        }

        if (parameters.noiseType[0] === 0) {
            this.#toggleUtil.to_a();
        } else {
            this.#toggleUtil.to_b();
        }

        this.#brownianGenerator.generateNormalisedSamples();

        const o1 = outputList[0][0];
        for (let n = 0; n < RENDER_QUANTUM_FRAMES; n++) {
            o1[n] = this.#toggleUtil.mix(uniformRandomValue(), this.#brownianGenerator.normalisedSamples[n]);
        }

        for (let channel = 1; channel < CHANNELS; channel++) {
            outputList[0][channel].set(o1);
        }

        return true;
    }

    #destroy() {
        this.#toggleUtil.free();
        this.#destroyed = true;
    }
}
registerProcessor('noise-generator', NoiseGeneratorProcessor);

function uniformRandomValue() {
    const rnd = Math.random();
    return rnd + rnd - 1;
}

class BrownianNoiseGenerator {
    normalisedSamples = new Float32Array(RENDER_QUANTUM_FRAMES);
    #unnormalisedSamples = new Float32Array(RENDER_QUANTUM_FRAMES);

    generateNormalisedSamples() {
        const init = /** @type {number} */ (this.#unnormalisedSamples.at(-1)) + uniformRandomValue();
        this.#unnormalisedSamples[0] = init;
        let min = init;
        let max = init;
        for (let i = 1; i < RENDER_QUANTUM_FRAMES; i++) {
            const next = 0.95 * this.#unnormalisedSamples[i - 1] + uniformRandomValue();
            this.#unnormalisedSamples[i] = next;
            min = Math.min(min, next);
            max = Math.max(max, next);
        }

        const rangeInv = 1 / (max - min);
        for (let i = 1; i < RENDER_QUANTUM_FRAMES; i++) {
            const diff = this.#unnormalisedSamples[i] - min;
            this.normalisedSamples[i] = 0.8 * ((diff + diff) * rangeInv - 1);
        }
    }

    reset() {
        this.#unnormalisedSamples.with(-1, 0);
    }
}