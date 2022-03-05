import { Project } from 'ts-morph';
import ImportsRefactor from '../../lib/code-refactor/imports-refactor/imports-refactor';
import fs, {existsSync} from "fs";


let project: Project;

beforeEach(() => {
  project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });
})

afterEach(() => {
  if (existsSync('ntts-generated-models.ts')) {
    fs.unlinkSync('ntts-generated-models.ts');
  }
})

test('should refactor expression statement require', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'require("ts-morph");', { overwrite: true });
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import "ts-morph";');
});

test('should not add empty import if import already exists', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', 'const morph = require("ts-morph");\nrequire("ts-morph");', { overwrite: true });
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual('import morph from "ts-morph";');
});
