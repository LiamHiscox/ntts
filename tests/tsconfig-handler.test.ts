import * as fse from 'fs-extra';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import TsconfigHandler from '../lib/tsconfig-handler/tsconfig-handler';

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';
const cwd = process.cwd();

beforeEach(() => {
  fse.copySync(sample, sampleCopy);
  process.chdir(sampleCopy);
});

afterEach(() => {
  process.chdir(cwd);
  fse.rmSync(sampleCopy, { recursive: true, force: true });
});

test('should add a tsconfig.json in root', () => {
  TsconfigHandler.addConfig('', []);
  expect(existsSync('./tsconfig.json'));
});

test('should add a tsconfig.json in root with path', () => {
  TsconfigHandler.addConfig('src', ['node_modules']);
  expect(existsSync('./tsconfig.json'));
  const tsconfig = JSON.parse(readFileSync('./tsconfig.json', { encoding: 'utf-8' }));
  expect(tsconfig.include).toEqual(['src']);
  expect(tsconfig.exclude).toEqual(['node_modules']);
});

test('should add a tsconfig.ntts.json in root', () => {
  writeFileSync('tsconfig.json', '{}');
  TsconfigHandler.addConfig('', []);
  expect(existsSync('./tsconfig.ntts.json'));
});

test('should add a tsconfig.ntts.json in root with path', () => {
  writeFileSync('tsconfig.json', '{}');
  TsconfigHandler.addConfig('src', ['node_modules']);
  expect(existsSync('./tsconfig.ntts.json'));
  const tsconfig = JSON.parse(readFileSync('./tsconfig.ntts.json', { encoding: 'utf-8' }));
  expect(tsconfig.include).toEqual(['src']);
  expect(tsconfig.exclude).toEqual(['node_modules']);
});
