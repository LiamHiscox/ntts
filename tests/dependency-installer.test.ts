import * as fse from "fs-extra";
import {DependencyInstaller} from "../lib/dependency-installer/dependency-installer";
import {DependencyHandler} from "../lib/dependency-installer/dependency-handler/dependency-handler";
import {existsSync, readFileSync, unlinkSync} from "fs";

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';
const cwd = process.cwd();

beforeAll(() => {
    fse.copySync(sample, sampleCopy);
    process.chdir(sampleCopy);
    DependencyInstaller.installBaseDependencies();
    DependencyInstaller.installTypeDependencies();
});

afterAll(() => {
    process.chdir(cwd);
    fse.rmSync(sampleCopy, { recursive: true, force: true });
});

test('should install base dependency dependency', () => {
    const installed = DependencyHandler.installedPackages();
    expect(installed).toHaveProperty('typescript');
    expect(installed).toHaveProperty('@types/node');
    expect(installed).toHaveProperty('ts-node');
});

test('should install type definitions', () => {
    const installed = DependencyHandler.installedPackages();
    expect(installed).not.toHaveProperty('@types/typescript');
    expect(installed).toHaveProperty('@types/yargs');
});

test('should keep package.json', () => {
    const content = readFileSync('package.json', {encoding: 'utf-8'});
    DependencyInstaller.addPackageJson();
    const contentNew = readFileSync('package.json', {encoding: 'utf-8'});
    expect(content).toEqual(contentNew);
});

test('should add package.json', () => {
    unlinkSync('package.json');
    expect(existsSync('package.json')).toBeFalsy();
    DependencyInstaller.addPackageJson();
    expect(existsSync('package.json')).toBeTruthy();
});
