import * as fse from "fs-extra";
import {DependencyInstaller} from "../lib/dependency-installer/dependency-installer";
import {VersionHandler} from "../lib/dependency-installer/version-handler/version-handler";

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';
const cwd = process.cwd();

beforeAll(() => {
    fse.copySync(sample, sampleCopy);
    process.chdir(sampleCopy);
});

afterAll(() => {
    process.chdir(cwd);
    fse.rmSync(sampleCopy, { recursive: true, force: true });
});

test('should install a simple dependency', () => {
    DependencyInstaller.install('simple-test-package@0.2.2');
    expect(VersionHandler.packageVersion('simple-test-package')).toBe('0.2.2');
});

test('should install a simple dependency', () => {
    DependencyInstaller.installTypes('yargs', '17.0.1');
    expect(VersionHandler.packageVersion('@types/yargs')).toBe('17.0.2');
});
