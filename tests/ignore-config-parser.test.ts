import * as fse from "fs-extra";
import {IgnoreConfigParser} from "../lib/ignore-config-parser/ignore-config-parser";

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';

beforeAll(() => {
  fse.copySync(sample, sampleCopy);
  process.chdir(sampleCopy);
});

afterAll(() => {
  process.chdir(sampleCopy);
  fse.rmSync(sampleCopy, {recursive: true, force: true});
});

test('should parse a gitignore file correctly', () => {
  const result = IgnoreConfigParser.getIgnores();
  expect(result.sort()).toEqual([
    "**/node_modules/**",
    "**/*.log",
    "!**/index.log",
    "temp/test/**",
    "**/test/temp"
  ].sort());
})

test('should reformat target path', () => {
  expect(IgnoreConfigParser.formatTargetPath('./src/')).toBe('src/');
})

test('should reformat empty target path', () => {
  expect(IgnoreConfigParser.formatTargetPath('')).toBe('');
})

test('should reformat empty spaced target path', () => {
  expect(IgnoreConfigParser.formatTargetPath('   ')).toBe('');
})
