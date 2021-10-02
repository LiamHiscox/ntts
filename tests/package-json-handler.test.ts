import * as fse from "fs-extra";
import {PackageJsonHandler} from "../lib/package-json-handler/package-json-handler";
import {readFileSync} from "fs";

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

test('should read from package.json file', () => {
  expect(PackageJsonHandler.readPackageJson())
    .toEqual(JSON.parse(readFileSync('package.json', {encoding: 'utf-8'})));
});

test('should write to package.json file', () => {
  const contents = {"scripts": {"start": "echo 'test'"}};
  PackageJsonHandler.writePackageJson(contents);
  expect(PackageJsonHandler.readPackageJson())
    .toEqual(contents);
});

test('should rename a single script', () => {
  expect(PackageJsonHandler.addTsScripts({"start": "node js-ts.js"}, ''))
    .toEqual({"start": "ts-node js-ts.ts"});
});
