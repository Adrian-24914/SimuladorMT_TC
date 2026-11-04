import { describe, expect, it } from 'vitest';
import { parseMachine } from '../../src/parser/yamlParser.js';
import { validateMachineConfig } from '../../src/parser/validator.js';

 describe('parser placeholders', () => {
  it('exposes parseMachine and clearly reports that implementation is pending', () => {
    expect(() => parseMachine('mt: {}')).toThrow('Not implemented');
  });

  it('exposes the validator contract without pretending to validate', () => {
    expect(() => validateMachineConfig({} as never)).toThrow('Not implemented');
  });
});
