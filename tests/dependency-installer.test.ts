import * as fse from "fs-extra";
import {DependencyInstaller} from "../lib/dependency-installer/dependency-installer";
import {DependencyHandler} from "../lib/dependency-installer/dependency-handler/dependency-handler";

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
