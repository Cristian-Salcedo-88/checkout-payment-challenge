import { TextDecoder, TextEncoder } from 'node:util';

import '@testing-library/jest-dom';

// jsdom doesn't provide these globals; react-router needs them.
Object.assign(globalThis, { TextEncoder, TextDecoder });
