import {Project} from "ts-morph";
import {ExportsRefactor} from "../../lib/code-refactor/exports-refactor/exports-refactor";

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true
});

test('should refactor element access export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'exports.item = {};\nexports.item["item"] = 4;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let item = {};\nitem["item"] = 4;\n\nexport { item };\n');
});

test('should refactor element access default export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'exports["item"] = 4;\n', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let _default = {};\n\n_default["item"] = 4;\n\nexport default _default;\n');
});

test('should refactor usage of named export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'exports.item = 12;\nconsole.log(exports.item);', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const item = 12;\nconsole.log(item);\n\nexport { item };\n');
});

test('should refactor usage of default export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'module.exports = () => {};\nconsole.log(module.exports());', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const _default = () => {};\nconsole.log(_default());\n\nexport default _default;\n');
});

test('should refactor usage of shorthand default export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'exports = () => {};\nconsole.log(exports());', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const _default = () => {};\nconsole.log(_default());\n\nexport default _default;\n');
});

test('should refactor usage of shorthand element access default export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'exports["fun"] = () => {};\nconsole.log(exports["fun"]());', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let _default = {};\n\n_default["fun"] = () => {};\nconsole.log(_default["fun"]());\n\nexport default _default;\n');
});

test('should refactor usage of element access default export', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'module.exports["fun"] = () => {};\nconsole.log(module.exports["fun"]());', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let _default = {};\n\n_default["fun"] = () => {};\nconsole.log(_default["fun"]());\n\nexport default _default;\n');
});
