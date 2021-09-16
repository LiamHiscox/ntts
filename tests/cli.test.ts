import * as fse from "fs-extra";
import {execSync} from "child_process";
import {join} from "path";

const testsRoot = 'tests';
const sampleCopy = 'sample-copy';
const sample = 'sample';

beforeEach(() => {
    fse.copySync(join(testsRoot, sample), join(testsRoot, sampleCopy));
});

afterEach(() => {
    fse.rmSync(join(testsRoot, sampleCopy), { recursive: true, force: true });
});

test('should not throw an error', () => {
    expect(() => execSync('ntts refactor', {cwd: join(testsRoot, sampleCopy)})).not.toThrow();
});

test('should not throw an error with paramaters', () => {
    expect(() => execSync(`ntts refactor -t src`, {cwd: join(testsRoot, sampleCopy)})).not.toThrow();
});
