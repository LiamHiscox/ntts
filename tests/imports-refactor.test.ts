import {Project} from "ts-morph";
import {ImportsRefactor} from "../lib/code-refactor/imports-refactor/imports-refactor";

const project = new Project();

test('should refactor standard require', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const content = require("ts-morph");');
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import content from "ts-morph";');
});

test('should refactor standard require with object destructuring assignment', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const {content1, content2} = require("ts-morph");');
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import {content1, content2} from "ts-morph";');
});

test('should refactor array require with destructuring assignment', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const [content1, content2] = require("ts-morph");');
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import ts_morph from "ts-morph";\nconst [content1, content2] = ts_morph;\n');
});

test('should refactor object require with destructuring spread assignment', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const {content1, ...content2} = require("ts-morph");');
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import ts_morph from "ts-morph";\nconst {content1, ...content2} = ts_morph;\n');
});

test('should refactor empty object require', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const {} = require("ts-morph");');
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import {} from "ts-morph";');
});
