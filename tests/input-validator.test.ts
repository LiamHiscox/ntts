import {InputValidator} from "../lib/input-validator/input-validator";

test('should parse simple path', () => {
  expect(InputValidator.validate('src')).toBe('src');
});

test('should reject invalid path', () => {
  expect(InputValidator.validate('..')).toBeUndefined();
});

test('should reject non-existent path', () => {
  expect(InputValidator.validate('./assadasdasd')).toBeUndefined();
});

test('should parse empty path', () => {
  expect(InputValidator.validate('')).toBe('');
});

test('should parse empty path', () => {
  expect(InputValidator.validate('.')).toBe("");
});

test('should parse long path path', () => {
  expect(InputValidator.validate('src/test\\text')).toBe('src/test/text');
});
