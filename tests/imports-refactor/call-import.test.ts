import {Project} from "ts-morph";
import {ImportsRefactor} from "../../lib/code-refactor/imports-refactor/imports-refactor";

const project = new Project();

test('should refactor call expression statement require', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'require("ts-morph")();', {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import ts_morph from "ts-morph";\n\nts_morph();');
});

test('should refactor call expression statement require with spacing', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'require (  "ts-morph" ) (  )  ;', {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import ts_morph from "ts-morph";\n\nts_morph (  )  ;');
});

test('should refactor call expression statement with variable statement', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const app = require("ts-morph")();', {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import ts_morph from "ts-morph";\n\nconst app = ts_morph();');
});

test('should refactor call expression statement with binary expression', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'app = require("ts-morph")();', {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import ts_morph from "ts-morph";\n\napp = ts_morph();');
});
