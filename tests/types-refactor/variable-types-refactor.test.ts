import { Project } from 'ts-morph';
import TypesRefactor from '../../lib/code-refactor/types-refactor/types-refactor';
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
    fs.unlinkSync('ntts-generated-models.ts');  }
})

test('should not set type if it is any', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'const a = asd();', { overwrite: true });
  TypesRefactor.setInitialTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('const a = asd();');
});
