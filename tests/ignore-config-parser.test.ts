import * as fse from "fs-extra";
import {join} from "path";
import {IgnoreConfigParser} from "../lib/ignore-config-parser/ignore-config-parser";

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';

beforeAll(() => {
  fse.copySync(sample, sampleCopy);
});

afterAll(() => {
  fse.rmSync(sampleCopy, {recursive: true, force: true});
});


test('should parse a gitignore file correctly', () => {
  const result = IgnoreConfigParser.parseFile(join(sampleCopy, '.gitignore'));
  expect(result.sort()).toEqual([
    "**/node_modules/**",
    "**/*.log",
    "temp/test/**",
    "**/test/temp"
  ].sort());
})
