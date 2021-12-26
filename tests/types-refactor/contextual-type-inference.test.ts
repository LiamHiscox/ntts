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
    fs.unlinkSync('ntts-generated-models.ts');  }
})

test('should set type of variable by contextual type', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'import path from "path";\nconst a = fun();\npath.join(a);',
    { overwrite: true },
  );
  sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  TypesRefactor.inferContextualType(sourceFile);
  expect(sourceFile.getText()).toEqual('import path from "path";\nconst a: string = fun();\npath.join(a);');
});

test('should set type of variable by contextual type with union type', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'function b(b: number | string | boolean);\nconst a = "asd";\nb(a);',
    { overwrite: true },
  );
  sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  TypesRefactor.inferContextualType(sourceFile);
  expect(sourceFile.getText()).toEqual('function b(b: number | string | boolean);\nconst a = "asd";\nb(a);');
});
