import {Project} from "ts-morph";
import {ExportsRefactor} from "../../../lib/code-refactor/exports-refactor/exports-refactor";

const project = new Project();

test('should refactor nested export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'if (true) module.exports.item = 2;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let item;\n\nif (true) item = 2;\n\nexport { item };\n');
});

test('should refactor nested shorthand export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'if (true) exports.item = 2;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let item;\n\nif (true) item = 2;\n\nexport { item };\n');
});

test('should refactor nested identifier export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'let item = 2;\nif (true) module.exports.item = item;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let item = 2;\nlet item0;\n\nif (true) item0 = item;\n\nexport { item0 as item };\n');
});

test('should refactor nested export with nested identifier', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'if (true) {\nlet item = 2;\nmodule.exports.item = item;\n}', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let item0;\n\nif (true) {\nlet item = 2;\nitem0 = item;\n}\n\nexport { item0 as item };\n');
});
