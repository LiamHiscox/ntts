import { Project } from 'ts-morph';
import InitialTypeHandler from "../../lib/code-refactor/types-refactor/initial-type-handler/initial-type-handler";
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

test('should not set type if it is any', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'const a = asd();', { overwrite: true });
  sourceFile.getVariableDeclarations().forEach((dec) => InitialTypeHandler.setInitialType(dec));
  expect(sourceFile.getText()).toEqual('const a = asd();');
});
