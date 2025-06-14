import { Sequencer } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { MEMORY_DETACHED_EVENT, cachedF32Memory } from './memory';

class SequencerProcessor extends AudioWorkletProcessor {
    #sequencer = new Sequencer(RENDER_QUANTUM_FRAMES);

    #gateInBuffer = new HeapAudioBuffer(this.#sequencer.gate_in_ptr(), 1);
    #outputBuffer = new HeapAudioBuffer(this.#sequencer.output_ptr(), 1);
    #valuesBuffer = new HeapAudioBuffer(this.#sequencer.values_ptr(), 1);

    #destroyed = false;

    constructor() {
        super();

        this.port.onmessage = ((e) => {
            if (e.data === 'destroy') {
                this.#destroy();
            } else if (e.data === 'reset') {
                this.#sequencer.reset();
            }
        });

        cachedF32Memory.registerListener(this);
    }

    static get parameterDescriptors() {
        return /** @type {const} */ ([
            {
                name: 'gateThreshold',
                defaultValue: 0,
                minValue: -1,
                maxValue: 1,
            },
            {
                name: 'numSteps',
                defaultValue: 4,
                minValue: 1,
                maxValue: 16,
            },
            {
                name: 'value0',
                defaultValue: 0,
                automationRate: 'k-rate',
            },
            {
                name: 'value1',
                defaultValue: 0,
                automationRate: 'k-rate',
            },
            {
                name: 'value2',
                defaultValue: 0,
                automationRate: 'k-rate',
            },
            {
                name: 'value3',
                defaultValue: 0,
                automationRate: 'k-rate'
            },
            {
                name: 'value4',
                defaultValue: 0,
                automationRate: 'k-rate'
            },
            {
                name: 'value5',
                defaultValue: 0,
                automationRate: 'k-rate'
            },
            {
                name: 'value6',
                defaultValue: 0,
                automationRate: 'k-rate'
            },
            {
                name: 'value7',
                defaultValue: 0,
                automationRate: 'k-rate'
            },
            {
                name: 'value8',
                defaultValue: 0,
                automationRate: 'k-rate'
            },
            {
                name: 'value9',
                defaultValue: 0,
                automationRate: 'k-rate'
            },
            {
                name: 'value10',
                defaultValue: 0,
                automationRate: 'k-rate'
            },
            {
                name: 'value11',
                defaultValue: 0,
                automationRate: 'k-rate'
            },
            {
                name: 'value12',
                defaultValue: 0,
                automationRate: 'k-rate'
            },
            {
                name: 'value13',
                defaultValue: 0,
                automationRate: 'k-rate'
            },
            {
                name: 'value14',
                defaultValue: 0,
                automationRate: 'k-rate'
            },
            {
                name: 'value15',
                defaultValue: 0,
                automationRate: 'k-rate'
            },

        ]);
    }

    /**
     * @param {Event} e 
     */
    handleEvent(e) {
        if (e.type === MEMORY_DETACHED_EVENT) {
            this.#gateInBuffer.recoverMemory(this.#sequencer.gate_in_ptr());
            this.#outputBuffer.recoverMemory(this.#sequencer.output_ptr());
            this.#valuesBuffer.recoverMemory(this.#sequencer.values_ptr());
        }
    }

    /**
     * @param {Float32Array[][]} inputList 
     * @param {Float32Array[][]} outputList 
     * @param {Record<import('./types').ParameterName<typeof SequencerProcessor>, Float32Array>} parameters 
     */
    process(inputList, outputList, parameters) {
        if (this.#destroyed) {
            return false;
        }

        const gateIn = inputList[0][0];
        this.#gateInBuffer.setChannelData(gateIn, 0);
        const values = this.#valuesBuffer.getChannelData(0);
        values[0] = parameters.value0[0]
        values[1] = parameters.value1[0]
        values[2] = parameters.value2[0]
        values[3] = parameters.value3[0]
        values[4] = parameters.value4[0]
        values[5] = parameters.value5[0]
        values[6] = parameters.value6[0]
        values[7] = parameters.value7[0]
        values[8] = parameters.value8[0]
        values[9] = parameters.value9[0]
        values[10] = parameters.value10[0]
        values[11] = parameters.value11[0]
        values[12] = parameters.value12[0]
        values[13] = parameters.value13[0]
        values[14] = parameters.value14[0]
        values[15] = parameters.value15[0]

        const currentStep = this.#sequencer.process(parameters.gateThreshold[0], parameters.numSteps[0]);

        outputList[0][0].set(this.#outputBuffer.getChannelData(0));

        this.port.postMessage({ currentStep });

        return true;
    }

    #destroy() {
        this.#sequencer.free();
        this.#gateInBuffer.free();
        this.#outputBuffer.free();
        this.#valuesBuffer.free();
        cachedF32Memory.unregisterListener(this);
        this.#destroyed = true;
    }
}
registerProcessor('sequencer', SequencerProcessor);