import {FileRename} from "../lib/file-rename/file-rename";
import * as fse from "fs-extra";
import {writeFileSync} from "fs";
import globby from "globby";
import {IgnoreConfigParser} from "../lib/file-rename/ignore-config-parser/ignore-config-parser";

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';
const cwd = process.cwd();

beforeEach(() => {
  fse.copySync(sample, sampleCopy);
  process.chdir(sampleCopy);
});

afterEach(() => {
  process.chdir(cwd);
  fse.rmSync(sampleCopy, {recursive: true, force: true});
});

test('should rename a single file', () => {
  const ignores = IgnoreConfigParser.getIgnores();
  FileRename.rename('src', ignores);
  expect(globby.sync(["**/*.ts"]).sort())
    .toEqual(["src/index.ts"].sort());
});

test('should not rename config file', () => {
  writeFileSync('.gitignore', '*.config.js');
  const ignores = IgnoreConfigParser.getIgnores();
  FileRename.rename('.', ignores);
  expect(globby.sync(["**/*.ts"]).sort())
    .toEqual(["src/index.ts", "js-ts.ts"].sort());
});

test('should rename all files recursively', () => {
  const ignores = IgnoreConfigParser.getIgnores();
  FileRename.rename('.', ignores);
  expect(globby.sync(["**/*.ts"]).sort())
    .toEqual(["src/index.ts", "js-ts.ts", "babel.config.ts"].sort());
});
