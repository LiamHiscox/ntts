import {DependencyHandler} from "../lib/dependency-installer/dependency-handler/dependency-handler";
import {ScriptRunner} from "../lib/helpers/script-runner/script-runner";
import * as fse from "fs-extra";
import {unlinkSync, writeFileSync} from "fs";

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';
const cwd = process.cwd();

beforeAll(async () => {
  fse.copySync(sample, sampleCopy);
  process.chdir(sampleCopy);
  await ScriptRunner.runPipe('npm ci');
  await ScriptRunner.runPipe('npm i @types/yargs');
});

afterAll(() => {
  process.chdir(cwd);
  fse.rmSync(sampleCopy, { recursive: true, force: true });
});

test('should have yargs installed', async () => {
  expect(await DependencyHandler.installedPackages()).toHaveProperty('yargs');
});

test('should be type definition package', () => {
  expect(DependencyHandler.isTypeDefinition('@types/yargs')).toBeTruthy();
});

test('should not be type definition package', () => {
  expect(DependencyHandler.isTypeDefinition('yargs')).toBeFalsy();
});

test('should format simple package', () => {
  expect(DependencyHandler.packageToTypesFormat('yargs')).toBe('@types/yargs');
});

test('should format scoped package', () => {
  expect(DependencyHandler.packageToTypesFormat('@babel/core')).toBe('@types/babel__core');
});

test('should say package has no type definitions', async () => {
  expect(await DependencyHandler.packageHasTypes('yargs')).toBeFalsy();
});

test('should say package has type definitions', async () => {
  expect(await DependencyHandler.packageHasTypes('@types/yargs')).toBeTruthy();
});

test('should say package has type definitions because of index.d.ts', async () => {
  writeFileSync('./node_modules/yargs/index.d.ts', '');
  expect(await DependencyHandler.packageHasTypes('yargs')).toBeTruthy();
  unlinkSync('./node_modules/yargs/index.d.ts');
});
