import { Project } from 'ts-morph';
import { ImportsRefactor } from '../../lib/code-refactor/imports-refactor/imports-refactor';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

test('should refactor binary expression require 1', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const app = 12 + require("ts-morph");', { overwrite: true });
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import ts_morph from "ts-morph";\n\nconst app = 12 + ts_morph;');
});

test('should refactor binary expression require 2', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const app = require("ts-morph") + 12;', { overwrite: true });
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import ts_morph from "ts-morph";\n\nconst app = ts_morph + 12;');
});

test('should refactor binary expression require with variable write', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'let app;\napp = require("ts-morph");', { overwrite: true });
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import ts_morph from "ts-morph";\n\nlet app;\napp = ts_morph;');
});
