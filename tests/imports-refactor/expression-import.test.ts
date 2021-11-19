import {Project} from "ts-morph";
import {ImportsRefactor} from "../../lib/code-refactor/imports-refactor/imports-refactor";

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true
});

test('should refactor expression statement require', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'require("ts-morph");', {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import "ts-morph";');
});

test('should not add empty import if import already exists', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'require("ts-morph");', {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import "ts-morph";');
});
