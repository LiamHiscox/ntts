import {FileRename} from "../lib/file-rename/file-rename";
import * as fse from "fs-extra";
import { join } from "path";
import {readdirSync} from "fs";

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';

beforeEach(() => {
    fse.copySync(sample, sampleCopy);
});

afterEach(() => {
    fse.rmSync(sampleCopy, { recursive: true, force: true });
});

test('should rename a single file', () => {
    const singleFilePath = join(sampleCopy, 'src');
    FileRename.renameFiles(singleFilePath);
    expect(readdirSync(singleFilePath)[0]).toBe('index.ts');
});

test('should rename a files recursively', () => {
    const singleFilePath = join(sampleCopy, 'src');
    FileRename.renameFiles(sampleCopy);
    const assetsCopyDir = readdirSync(sampleCopy);
    expect(readdirSync(singleFilePath)[0]).toBe('index.ts');
    expect(assetsCopyDir.includes('js-ts.ts')).toBe(true);
});
