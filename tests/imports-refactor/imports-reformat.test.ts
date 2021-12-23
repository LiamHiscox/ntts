import { Project } from 'ts-morph';
import * as fse from 'fs-extra';
import { writeFileSync } from 'fs';
import { ImportsRefactor } from '../../lib/code-refactor/imports-refactor/imports-refactor';

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';
const cwd = process.cwd();

beforeAll(() => {
  fse.copySync(sample, sampleCopy);
  process.chdir(sampleCopy);
  writeFileSync('tsconfig.json', '{"compilerOptions": {}}');
});

afterAll(() => {
  process.chdir(cwd);
  fse.rmSync(sampleCopy, { recursive: true, force: true });
});

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

const content = `
import morph from "ts-morph";
import module from "my-module";
import test from "./test.js";
import json from "./json.json";
import imports from "./imports.ts";
import liam from "./.gitignore";
`;

const expectedContent = `import morph from "ts-morph";
import module from "my-module";
import test from "./test";
import json from "./json.json";
import imports from "./imports.ts";
import liam from "./.gitignore";
`;

test('should refactor module specifiers', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', content, { overwrite: true });
  const modules = ImportsRefactor.reformatImports(sourceFile, { fileEndings: [] });
  ImportsRefactor.resolveModuleSpecifierResults(modules);
  expect(sourceFile.getText()).toEqual(expectedContent);
  expect(['gitignore']).toEqual(modules.fileEndings);
});
