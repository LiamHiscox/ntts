import {Project} from "ts-morph";
import {CodeRefactor} from "../../lib/code-refactor/code-refactor";

const project = new Project();

test('should refactor expression statement require', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'require("ts-morph");', {overwrite: true});
  CodeRefactor.convertToTypescript(sourceFile);
  expect(sourceFile.getText()).toEqual('import ts_morph from "ts-morph";');
});
