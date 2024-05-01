// @ts-ignore
import encoding from 'fastestsmallesttextencoderdecoder/EncoderDecoderTogether.min';

if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = encoding.TextDecoder;
}

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = encoding.TextEncoder;
}
