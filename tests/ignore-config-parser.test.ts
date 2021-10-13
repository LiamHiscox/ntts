import * as fse from "fs-extra";
import {IgnoreConfigParser} from "../lib/ignore-config-parser/ignore-config-parser";
import {writeFileSync} from "fs";

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';
const cwd = process.cwd();

beforeAll(() => {
  fse.copySync(sample, sampleCopy);
  process.chdir(sampleCopy);
});

afterAll(() => {
  process.chdir(cwd);
  fse.rmSync(sampleCopy, {recursive: true, force: true});
});

test('should parse a .gitignore file correctly', () => {
  const result = IgnoreConfigParser.getIgnores();
  expect(result.sort()).toEqual([
    "node_modules/",
    "node_modules/",
    "*.log",
    "!index.log",
    "/temp/test/"
  ].sort());
})

test('should parse a .nttsignore file correctly', () => {
  writeFileSync('.nttsignore', '*.config.js');
  const result = IgnoreConfigParser.getIgnores();
  expect(result).toEqual(["*.config.js", "node_modules/"]);
})
