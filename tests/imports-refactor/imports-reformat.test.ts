import {Project} from "ts-morph";
import {ImportsRefactor} from "../../lib/code-refactor/imports-refactor/imports-refactor";
import * as fse from "fs-extra";

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';
const cwd = process.cwd();

beforeAll(() => {
  fse.copySync(sample, sampleCopy);
  process.chdir(sampleCopy);
});

afterAll(() => {
  process.chdir(cwd);
  fse.rmSync(sampleCopy, {recursive: true, force: true});
});

const project = new Project();

const content = `
import morph from "ts-morph";
import module from "my-module";
import test from "./test.js";
import json from "./json.json";
import imports from "./imports.ts";
import liam from "./imports.md";
`;

const expectedContent =
`import morph from "ts-morph";
import module from "my-module";
import test from "./test";
import json from "./json.json";
import imports from "./imports.ts";
import liam from "./imports.md";
`;

test('should refactor module specifiers', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', content, {overwrite: true});
  const modules = ImportsRefactor.reformatImports(sourceFile, {declareFileEndingModules: [], declareModules: []});
  ImportsRefactor.resolveModuleSpecifierResults(modules);
  expect(sourceFile.getText()).toEqual(expectedContent);
  expect(["my-module"]).toEqual(modules.declareModules);
  expect(["md"]).toEqual(modules.declareFileEndingModules);
});
