import {FileRename} from "../lib/file-rename/file-rename";
import * as fse from "fs-extra";
import {writeFileSync} from "fs";
import globby from "globby";

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
  FileRename.rename('src');
  expect(globby.sync(["**/*.ts"]).sort())
    .toEqual(["src/index.ts"].sort());
});

test('should not rename config file', () => {
  writeFileSync('.gitignore', '*.config.js');
  FileRename.rename('');
  expect(globby.sync(["**/*.ts"]).sort())
    .toEqual(["src/index.ts", "js-ts.ts"].sort());
});

test('should rename all files recursively', () => {
  FileRename.rename('');
  expect(globby.sync(["**/*.ts"]).sort())
    .toEqual(["src/index.ts", "js-ts.ts", "babel.config.ts"].sort());
});
