import { FMSynthesizer } from '../pkg/audio_processors';
import { RENDER_QUANTUM_FRAMES } from './helpers/constants';
import { HeapAudioBuffer } from './helpers/heap-audio-buffer';
import { HeapParameterBuffer } from './helpers/heap-parameter-buffer';
import { MEMORY_DETACHED_EVENT, cachedF32Memory } from './memory';

class FMVoiceProcessor extends AudioWorkletProcessor {
  #fmSynth = new FMSynthesizer(RENDER_QUANTUM_FRAMES, sampleRate, 2);

  // Single frequency input buffer for all 8 voices (8 interleaved channels)
  #frequencyInputBuffer = new HeapAudioBuffer(this.#fmSynth.frequency_input_ptr(), 8);
  #operatorLevelBuffers = [
    new HeapParameterBuffer(this.#fmSynth.operator_level_ptr(0)),
    new HeapParameterBuffer(this.#fmSynth.operator_level_ptr(1)),
    new HeapParameterBuffer(this.#fmSynth.operator_level_ptr(2)),
    new HeapParameterBuffer(this.#fmSynth.operator_level_ptr(3)),
    new HeapParameterBuffer(this.#fmSynth.operator_level_ptr(4)),
    new HeapParameterBuffer(this.#fmSynth.operator_level_ptr(5)),
  ];
  #operatorAttackBuffers = [
    new HeapParameterBuffer(this.#fmSynth.operator_attack_ptr(0)),
    new HeapParameterBuffer(this.#fmSynth.operator_attack_ptr(1)),
    new HeapParameterBuffer(this.#fmSynth.operator_attack_ptr(2)),
    new HeapParameterBuffer(this.#fmSynth.operator_attack_ptr(3)),
    new HeapParameterBuffer(this.#fmSynth.operator_attack_ptr(4)),
    new HeapParameterBuffer(this.#fmSynth.operator_attack_ptr(5)),
  ];
  #operatorDecayBuffers = [
    new HeapParameterBuffer(this.#fmSynth.operator_decay_ptr(0)),
    new HeapParameterBuffer(this.#fmSynth.operator_decay_ptr(1)),
    new HeapParameterBuffer(this.#fmSynth.operator_decay_ptr(2)),
    new HeapParameterBuffer(this.#fmSynth.operator_decay_ptr(3)),
    new HeapParameterBuffer(this.#fmSynth.operator_decay_ptr(4)),
    new HeapParameterBuffer(this.#fmSynth.operator_decay_ptr(5)),
  ];
  #operatorSustainBuffers = [
    new HeapParameterBuffer(this.#fmSynth.operator_sustain_ptr(0)),
    new HeapParameterBuffer(this.#fmSynth.operator_sustain_ptr(1)),
    new HeapParameterBuffer(this.#fmSynth.operator_sustain_ptr(2)),
    new HeapParameterBuffer(this.#fmSynth.operator_sustain_ptr(3)),
    new HeapParameterBuffer(this.#fmSynth.operator_sustain_ptr(4)),
    new HeapParameterBuffer(this.#fmSynth.operator_sustain_ptr(5)),
  ];
  #operatorReleaseBuffers = [
    new HeapParameterBuffer(this.#fmSynth.operator_release_ptr(0)),
    new HeapParameterBuffer(this.#fmSynth.operator_release_ptr(1)),
    new HeapParameterBuffer(this.#fmSynth.operator_release_ptr(2)),
    new HeapParameterBuffer(this.#fmSynth.operator_release_ptr(3)),
    new HeapParameterBuffer(this.#fmSynth.operator_release_ptr(4)),
    new HeapParameterBuffer(this.#fmSynth.operator_release_ptr(5)),
  ];
  // Single trigger and retrigger input buffers for all 8 voices (8 interleaved channels each)
  #triggerInputBuffer = new HeapAudioBuffer(this.#fmSynth.trigger_input_ptr(), 8);
  #retriggerInputBuffer = new HeapAudioBuffer(this.#fmSynth.retrigger_input_ptr(), 8);
  #outputBuffer = new HeapAudioBuffer(this.#fmSynth.output_ptr(), 2);

  #destroyed = false;

  constructor() {
    super();

    this.port.onmessage = ((e) => {
      if (e.data === 'destroy') {
        this.#destroy();
      } else if (e.data === 'reset') {
        this.#fmSynth.reset();
      }
    });

    cachedF32Memory.registerListener(this);
  }

  static get parameterDescriptors() {
    return /** @type {const} */ ([
      {
        name: 'algorithm',
        defaultValue: 1,
        minValue: 1,
        maxValue: 32,
      },
      // Operator 1
      {
        name: 'op1Level',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 1.0,
      },
      {
        name: 'op1PitchShift',
        defaultValue: 0,
        minValue: -24,
        maxValue: 24,
      },
      {
        name: 'op1FineTune',
        defaultValue: 0,
        minValue: -100,
        maxValue: 100,
      },
      {
        name: 'op1Attack',
        defaultValue: 0.01,
        minValue: 0.0,
        maxValue: 2.0,
      },
      {
        name: 'op1Decay',
        defaultValue: 0.0,
        minValue: 0.0,
        maxValue: 2.0,
      },
      {
        name: 'op1Sustain',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 1.0,
      },
      {
        name: 'op1Release',
        defaultValue: 0.1,
        minValue: 0.001,
        maxValue: 2.0,
      },
      // Operator 2
      {
        name: 'op2Level',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 1.0,
      },
      {
        name: 'op2PitchShift',
        defaultValue: 0,
        minValue: -24,
        maxValue: 24,
      },
      {
        name: 'op2FineTune',
        defaultValue: 0,
        minValue: -100,
        maxValue: 100,
      },
      {
        name: 'op2Attack',
        defaultValue: 0.01,
        minValue: 0.0,
        maxValue: 2.0,
      },
      {
        name: 'op2Decay',
        defaultValue: 0.0,
        minValue: 0.0,
        maxValue: 2.0,
      },
      {
        name: 'op2Sustain',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 1.0,
      },
      {
        name: 'op2Release',
        defaultValue: 0.1,
        minValue: 0.001,
        maxValue: 2.0,
      },
      // Operator 3
      {
        name: 'op3Level',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 1.0,
      },
      {
        name: 'op3PitchShift',
        defaultValue: 0,
        minValue: -24,
        maxValue: 24,
      },
      {
        name: 'op3FineTune',
        defaultValue: 0,
        minValue: -100,
        maxValue: 100,
      },
      {
        name: 'op3Attack',
        defaultValue: 0.01,
        minValue: 0.0,
        maxValue: 2.0,
      },
      {
        name: 'op3Decay',
        defaultValue: 0.0,
        minValue: 0.0,
        maxValue: 2.0,
      },
      {
        name: 'op3Sustain',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 1.0,
      },
      {
        name: 'op3Release',
        defaultValue: 0.1,
        minValue: 0.001,
        maxValue: 2.0,
      },
      // Operator 4
      {
        name: 'op4Level',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 1.0,
      },
      {
        name: 'op4PitchShift',
        defaultValue: 0,
        minValue: -24,
        maxValue: 24,
      },
      {
        name: 'op4FineTune',
        defaultValue: 0,
        minValue: -100,
        maxValue: 100,
      },
      {
        name: 'op4Attack',
        defaultValue: 0.01,
        minValue: 0.0,
        maxValue: 2.0,
      },
      {
        name: 'op4Decay',
        defaultValue: 0.0,
        minValue: 0.0,
        maxValue: 2.0,
      },
      {
        name: 'op4Sustain',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 1.0,
      },
      {
        name: 'op4Release',
        defaultValue: 0.1,
        minValue: 0.001,
        maxValue: 2.0,
      },
      // Operator 5
      {
        name: 'op5Level',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 1.0,
      },
      {
        name: 'op5PitchShift',
        defaultValue: 0,
        minValue: -24,
        maxValue: 24,
      },
      {
        name: 'op5FineTune',
        defaultValue: 0,
        minValue: -100,
        maxValue: 100,
      },
      {
        name: 'op5Attack',
        defaultValue: 0.01,
        minValue: 0.0,
        maxValue: 2.0,
      },
      {
        name: 'op5Decay',
        defaultValue: 0.0,
        minValue: 0.0,
        maxValue: 2.0,
      },
      {
        name: 'op5Sustain',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 1.0,
      },
      {
        name: 'op5Release',
        defaultValue: 0.1,
        minValue: 0.001,
        maxValue: 2.0,
      },
      // Operator 6
      {
        name: 'op6Level',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 1.0,
      },
      {
        name: 'op6PitchShift',
        defaultValue: 0,
        minValue: -24,
        maxValue: 24,
      },
      {
        name: 'op6FineTune',
        defaultValue: 0,
        minValue: -100,
        maxValue: 100,
      },
      {
        name: 'op6Attack',
        defaultValue: 0.01,
        minValue: 0.0,
        maxValue: 2.0,
      },
      {
        name: 'op6Decay',
        defaultValue: 0.0,
        minValue: 0.0,
        maxValue: 2.0,
      },
      {
        name: 'op6Sustain',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 1.0,
      },
      {
        name: 'op6Release',
        defaultValue: 0.1,
        minValue: 0.001,
        maxValue: 2.0,
      },
    ]);
  }

  /**
   * @param {Event} e 
   */
  handleEvent(e) {
    if (e.type === MEMORY_DETACHED_EVENT) {
      this.#outputBuffer.recoverMemory(this.#fmSynth.output_ptr());
      this.#frequencyInputBuffer.recoverMemory(this.#fmSynth.frequency_input_ptr());
      this.#triggerInputBuffer.recoverMemory(this.#fmSynth.trigger_input_ptr());
      this.#retriggerInputBuffer.recoverMemory(this.#fmSynth.retrigger_input_ptr());
      for (let i = 0; i < 6; i++) {
        this.#operatorLevelBuffers[i].recoverMemory(this.#fmSynth.operator_level_ptr(i));
        this.#operatorAttackBuffers[i].recoverMemory(this.#fmSynth.operator_attack_ptr(i));
        this.#operatorDecayBuffers[i].recoverMemory(this.#fmSynth.operator_decay_ptr(i));
        this.#operatorSustainBuffers[i].recoverMemory(this.#fmSynth.operator_sustain_ptr(i));
        this.#operatorReleaseBuffers[i].recoverMemory(this.#fmSynth.operator_release_ptr(i));
      }
    }
  }

  /**
   * @param {Float32Array[][]} inputList 
   * @param {Float32Array[][]} outputList 
   * @param {Record<import('./types').ParameterName<typeof FMVoiceProcessor>, Float32Array>} parameters 
   */
  process(inputList, outputList, parameters) {
    if (this.#destroyed) {
      return false;
    }

    // Set operator parameter buffers (shared across all voices)
    for (let i = 0; i < 6; i++) {
      const idx = /** @type {1 | 2 | 3 | 4 | 5 | 6} */ (i + 1);
      this.#operatorLevelBuffers[i].setData(parameters[`op${idx}Level`]);
      this.#operatorAttackBuffers[i].setData(parameters[`op${idx}Attack`]);
      this.#operatorDecayBuffers[i].setData(parameters[`op${idx}Decay`]);
      this.#operatorSustainBuffers[i].setData(parameters[`op${idx}Sustain`]);
      this.#operatorReleaseBuffers[i].setData(parameters[`op${idx}Release`]);
    }

    for (let voice = 0; voice < 8; voice++) {
      if (inputList[0]?.[voice]) {
        this.#frequencyInputBuffer.setChannelData(inputList[0][voice], voice);
      }
      if (inputList[1]?.[voice]) {
        this.#triggerInputBuffer.setChannelData(inputList[1][voice], voice);
      }
      if (inputList[2]?.[voice]) {
        this.#retriggerInputBuffer.setChannelData(inputList[2][voice], voice);
      }
    }

    this.#fmSynth.process(
      parameters.algorithm[0],
      parameters.op1PitchShift[0],
      parameters.op2PitchShift[0],
      parameters.op3PitchShift[0],
      parameters.op4PitchShift[0],
      parameters.op5PitchShift[0],
      parameters.op6PitchShift[0],
      parameters.op1FineTune[0],
      parameters.op2FineTune[0],
      parameters.op3FineTune[0],
      parameters.op4FineTune[0],
      parameters.op5FineTune[0],
      parameters.op6FineTune[0],
    );

    outputList[0][0].set(this.#outputBuffer.getChannelData(0));
    outputList[0][1].set(this.#outputBuffer.getChannelData(1));
    // console.log([...outputList[0][0]], [...outputList[0][1]])

    return true;
  }

  #destroy() {
    this.#fmSynth.free();
    this.#outputBuffer.free();
    this.#frequencyInputBuffer.free();
    this.#triggerInputBuffer.free();
    this.#retriggerInputBuffer.free();
    cachedF32Memory.unregisterListener(this);
    this.#destroyed = true;
  }
}
registerProcessor('fm-voice', FMVoiceProcessor);
