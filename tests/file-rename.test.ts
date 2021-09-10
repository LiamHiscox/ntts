import {FileRename} from "../lib/file-rename/file-rename";
import * as fse from "fs-extra";
import {join} from "path";
import {existsSync} from "fs";

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';

beforeEach(() => {
  fse.copySync(sample, sampleCopy);
});

afterEach(() => {
  fse.rmSync(sampleCopy, {recursive: true, force: true});
});

test('should rename a single file', () => {
  const singleFilePath = join(sampleCopy, 'src');
  FileRename.rename(singleFilePath);
  expect(existsSync(join(singleFilePath, 'index.ts'))).toBeTruthy();
});

test('should not rename config file', () => {
  const singleFilePath = join(sampleCopy, 'src');
  FileRename.rename(singleFilePath);
  expect(existsSync(join(singleFilePath, 'babe.config.ts'))).toBeFalsy();
});

test('should rename a files recursively', () => {
  const singleFilePath = join(sampleCopy, 'src');
  FileRename.rename(sampleCopy);
  expect(existsSync(join(singleFilePath, 'index.ts'))).toBeTruthy();
  expect(existsSync(join(sampleCopy, 'js-ts.ts'))).toBeTruthy();
});
