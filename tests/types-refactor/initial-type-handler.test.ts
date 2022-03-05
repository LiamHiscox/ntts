import { Project, SyntaxKind } from 'ts-morph';
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
    fs.unlinkSync('ntts-generated-models.ts');
  }
})

test('should set type of variable if initializer type does not equal variable type', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a = null;\na = 12;', { overwrite: true });
  sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  TypesRefactor.setInitialTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('let a: null = null;\na = 12;');
});

test('should not set type of variable if initializer type is literal', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a = "asd";', { overwrite: true });
  sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  TypesRefactor.setInitialTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('let a = "asd";');
});
