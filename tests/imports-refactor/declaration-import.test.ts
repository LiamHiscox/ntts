import {Project} from "ts-morph";
import {ImportsRefactor} from "../../lib/code-refactor/imports-refactor/imports-refactor";

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true
});

test('should refactor standard require', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const content = require("ts-morph");', {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import content from "ts-morph";');
});

test('should refactor standard require with object destructuring assignment', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const {content1, content2} = require("ts-morph");', {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import { content1, content2 } from "ts-morph";');
});

test('should refactor array require with destructuring assignment', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const [content1, content2] = require("ts-morph");', {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import ts_morph from "ts-morph";\n\nconst [content1, content2] = ts_morph;');
});

test('should refactor object require with destructuring spread assignment', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const {content1, ...content2} = require("ts-morph");', {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import ts_morph from "ts-morph";\n\nconst {content1, ...content2} = ts_morph;');
});

test('should refactor empty object require', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const {} = require("ts-morph");', {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('');
});

test('should refactor simple name binding require', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const {name: rename} = require("ts-morph");', {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import { name as rename } from "ts-morph";');
});

test('should refactor string literal binding require', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const {"name": rename} = require("ts-morph");', {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import { name as rename } from "ts-morph";');
});

test('should refactor computed property binding require', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const {["name"]: rename} = require("ts-morph");', {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import { name as rename } from "ts-morph";');
});

test('should refactor invalid computed property binding require', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const value = "name";\nconst {[value]: rename} = require("ts-morph");', {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import ts_morph from "ts-morph";\n\nconst value = "name";\nconst {[value]: rename} = ts_morph;');
});

test('should import different file type', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const json = require("./file.json");', {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import json from "./file.json";');
});
