import { mkdirSync } from 'fs';
import * as fse from 'fs-extra';
import InputValidator from '../lib/input-validator/input-validator';

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';
const cwd = process.cwd();

beforeAll(() => {
  fse.copySync(sample, sampleCopy);
  process.chdir(sampleCopy);
  mkdirSync('src/test');
});

afterAll(() => {
  process.chdir(cwd);
  fse.rmSync(sampleCopy, { recursive: true, force: true });
});

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

test('should parse dot path', () => {
  expect(InputValidator.validate('.')).toBe('');
});

test('should parse long posix path', () => {
  expect(InputValidator.validate('src/test')).toBe('src/test');
});

test('should parse long windows path', () => {
  expect(InputValidator.validate('src\\test')).toBe('src/test');
});
