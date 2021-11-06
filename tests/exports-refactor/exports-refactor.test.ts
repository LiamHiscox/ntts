import {Project} from "ts-morph";
import {ExportsRefactor} from "../../lib/code-refactor/exports-refactor/exports-refactor";

const project = new Project();

test('should refactor export with literal value', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'module.exports.item = 2;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const item = 2;');
});

test('should refactor export with identifier assignment', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const item = 2;\nmodule.exports.item = item;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const item = 2;\nconst item0 = item;');
});

test('should refactor nested export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'if (true) module.exports.item = 2;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let item;\n\nif (true) item = 2;');
});

test('should refactor re-assignment of export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'module.exports.item = 2;\nmodule.exports.item = 12;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const item = 2;\nitem = 12;');
});

test('should refactor deep property access export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'module.exports.item = {};\nmodule.exports.item.name = 2;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const item = {};\nitem.name = 2;');
});
