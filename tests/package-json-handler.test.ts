import * as fse from 'fs-extra';
import { readFileSync, writeFileSync } from 'fs';
import PackageJsonHandler from '../lib/package-json-handler/package-json-handler';

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

test('should read from package.json file', () => {
  expect(PackageJsonHandler.readPackageJson())
    .toEqual(JSON.parse(readFileSync('package.json', { encoding: 'utf-8' })));
});

test('should write to package.json file', () => {
  const contents = { scripts: { start: "echo 'test'" } };
  PackageJsonHandler.writePackageJson(contents);
  expect(PackageJsonHandler.readPackageJson())
    .toEqual(contents);
});

test('should include build and watch scripts', () => {
  const scripts = PackageJsonHandler.addTsScripts({}, '');
  expect(scripts['tsc-watch']).toEqual('tsc -w -p tsconfig.json');
  expect(scripts['tsc-build']).toEqual('tsc -p tsconfig.json');
});

test('should rename a single script', () => {
  const scripts = PackageJsonHandler.addTsScripts({ start: 'node js-ts.js' }, '');
  expect(scripts.start).toEqual('ts-node -P tsconfig.json js-ts.ts');
});

test('should rename a single script with ntts tsconfig', () => {
  writeFileSync('tsconfig.ntts.json', '');
  const scripts = PackageJsonHandler.addTsScripts({ start: 'node js-ts.js' }, '');
  expect(scripts.start).toEqual('ts-node -P tsconfig.ntts.json js-ts.ts');
});

test('should rename a multiple scripts', () => {
  const scripts = PackageJsonHandler.addTsScripts({
    start: 'node js-ts.js',
    build: 'node test.js',
  }, '');
  expect(scripts.start).toEqual('ts-node -P tsconfig.json js-ts.ts');
  expect(scripts.build).toEqual('ts-node -P tsconfig.json test.ts');
});

test('should not rename script outside target', () => {
  const scripts = PackageJsonHandler.addTsScripts({
    start: 'node js-ts.js',
    build: 'node src/test.js',
  }, 'src');
  expect(scripts.start).toEqual('node js-ts.js');
  expect(scripts.build).toEqual('ts-node -P tsconfig.json src/test.ts');
});

test('should rename chained scripts', () => {
  const scripts = PackageJsonHandler.addTsScripts({
    start: 'node js-ts.js && node index.js -t asd & echo test',
  }, '');
  expect(scripts.start).toEqual('ts-node -P tsconfig.json js-ts.ts && ts-node -P tsconfig.json index.ts -t asd & echo test');
});
