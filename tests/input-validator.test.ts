import {InputValidator} from "../lib/input-validator/input-validator";

test('should parse simple path', () => {
  expect(InputValidator.validate('src')).toBe('src');
});

test('should reject invalid path', () => {
  expect(InputValidator.validate('..')).toBeNull();
});

test('should reject non-existent path', () => {
  expect(InputValidator.validate('./assadasdasd')).toBeNull();
});

test('should parse empty path', () => {
  expect(InputValidator.validate('')).toBe('');
});

test('should parse empty path', () => {
  expect(InputValidator.validate('.')).toBe("");
});

test('should parse long posix path', () => {
  expect(InputValidator.validate('test/text')).toBe('src/test');
});

test('should parse long windows path', () => {
  expect(InputValidator.validate('test\\text')).toBe('src/test');
});
