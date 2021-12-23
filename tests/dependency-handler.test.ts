import * as fse from 'fs-extra';
import DependencyHandler from '../lib/dependency-installer/dependency-handler/dependency-handler';

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';
const cwd = process.cwd();

beforeAll(async () => {
  fse.copySync(sample, sampleCopy);
  process.chdir(sampleCopy);
});

afterAll(() => {
  process.chdir(cwd);
  fse.rmSync(sampleCopy, { recursive: true, force: true });
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
