import {Project} from "ts-morph";
import {ExportsRefactor} from "../../../lib/code-refactor/exports-refactor/exports-refactor";

const project = new Project();

test('should refactor default export with literal value', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'module.exports = 2;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const _default = 2;\n\nexport default _default;\n');
});

test('should refactor shorthand default export with literal value', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'exports = 2;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const _default = 2;\n\nexport default _default;\n');
});

test('should refactor name collision default export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'let _default;\nexports = 2;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let _default;\nconst _default0 = 2;\n\nexport default _default0;\n');
});

test('should refactor default export with equally named identifier assignment', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const item = 2;\nmodule.exports = item;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const item = 2;\n\nexport default item;\n');
});

test('should refactor default export with differently named identifier assignment', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const _number = 2;\nmodule.exports = _number;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const _number = 2;\n\nexport default _number;\n');
});

test('should refactor re-assignment of default export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'module.exports = 2;\nmodule.exports = 12;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let _default = 2;\n_default = 12;\n\nexport default _default;\n');
});

test('should refactor deep property access default export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'module.exports = {};\nmodule.exports.name = 2;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const _default = {};\nconst name = 2;\n\nexport default _default;\n\nexport { name };\n');
});

test('should refactor re-assignment of default export with identifier', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const item = 45;\nmodule.exports = item;\nmodule.exports = "liam";', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const item = 45;\nlet item0 = item;\n\nitem0 = "liam";\n\nexport default item0;\n');
});

test('should refactor assignment of class default export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'class Car {}\nmodule.exports = Car;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('class Car {}\n\nexport default Car;\n');
});

test('should refactor re-assignment of class default export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'class Car {};\nmodule.exports = Car;\nmodule.exports = 12;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('class Car {};\n\nlet Car0 = Car;\n\nCar0 = 12;\n\nexport default Car0;\n');
});

