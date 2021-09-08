import {DependencyHandler} from "../lib/dependency-installer/dependency-handler/dependency-handler";
import {ScriptRunner} from "../lib/script-runner/script-runner";
import * as fse from "fs-extra";
import {unlinkSync, writeFileSync} from "fs";

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';
const cwd = process.cwd();

beforeAll(() => {
  fse.copySync(sample, sampleCopy);
  process.chdir(sampleCopy);
  ScriptRunner.runPipe('npm ci');
  ScriptRunner.runPipe('npm i @types/yargs');
});

afterAll(() => {
  process.chdir(cwd);
  fse.rmSync(sampleCopy, { recursive: true, force: true });
});

test('should have yargs installed', () => {
  expect(DependencyHandler.installedPackages()).toHaveProperty('yargs');
});

test('should format simple package', () => {
  expect(DependencyHandler.packageToTypesFormat('yargs')).toBe('@types/yargs');
});

test('should format scoped package', () => {
  expect(DependencyHandler.packageToTypesFormat('@babel/core')).toBe('@types/babel__core');
});

test('should say package has no type definitions', () => {
  expect(DependencyHandler.packageHasTypes('yargs')).toBeFalsy();
});

test('should say package has type definitions', () => {
  expect(DependencyHandler.packageHasTypes('@types/yargs')).toBeTruthy();
});

test('should say package has type definitions because of index.d.ts', () => {
  writeFileSync('./node_modules/yargs/index.d.ts', '');
  expect(DependencyHandler.packageHasTypes('yargs')).toBeTruthy();
  unlinkSync('./node_modules/yargs/index.d.ts');
});
