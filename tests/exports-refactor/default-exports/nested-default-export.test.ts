import {Project} from "ts-morph";
import {ExportsRefactor} from "../../../lib/code-refactor/exports-refactor/exports-refactor";

const project = new Project();

test('should refactor nested default export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'if (true) module.exports = 2;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let _default;\n\nif (true) _default = 2;\n\nexport default _default;\n');
});

test('should refactor nested element access default export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'if (true) module.exports["item"] = 2;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let _default = {};\n\nif (true) _default["item"] = 2;\n\nexport default _default;\n');
});

test('should refactor nested shorthand default export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'if (true) exports = 2;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let _default;\n\nif (true) _default = 2;\n\nexport default _default;\n');
});

test('should refactor nested identifier default export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'let item = 2;\nif (true) module.exports = item;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let item = 2;\nlet _default;\n\nif (true) _default = item;\n\nexport default _default;\n');
});

test('should refactor nested export with nested default identifier', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'if (true) {\nlet item = 2;\nmodule.exports = item;\n}', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let _default;\n\nif (true) {\nlet item = 2;\n_default = item;\n}\n\nexport default _default;\n');
});
