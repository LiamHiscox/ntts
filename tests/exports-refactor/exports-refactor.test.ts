import {Project} from "ts-morph";
import {ExportsRefactor} from "../../lib/code-refactor/exports-refactor/exports-refactor";

const project = new Project();

test('should refactor export with literal value', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'module.exports.item = 2;', {overwrite: true});
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const item = 2;');
});
