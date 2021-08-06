import {FileRename} from "../lib/file-rename/file-rename";
import * as fse from "fs-extra";
import { join } from "path";
import {readdirSync} from "fs";

const assetsCopy = 'tests/assets-copy';
const assets = 'tests/assets';

beforeEach(() => {
    fse.copySync(assets, assetsCopy);
});

afterEach(() => {
    fse.rmSync(assetsCopy, { recursive: true, force: true });
});

test('should rename a single file', () => {
    const singleFilePath = join(assetsCopy, 'src');
    FileRename.renameFiles(singleFilePath);
    expect(readdirSync(singleFilePath)[0]).toBe('index.ts');
});

test('should rename a files recursively', () => {
    const singleFilePath = join(assetsCopy, 'src');
    FileRename.renameFiles(assetsCopy);
    const assetsCopyDir = readdirSync(assetsCopy);
    expect(readdirSync(singleFilePath)[0]).toBe('index.ts');
    expect(assetsCopyDir.includes('js-ts.ts')).toBe(true);
    expect(assetsCopyDir.includes('README.md')).toBe(true);
});
