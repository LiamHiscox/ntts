import { Project, SyntaxKind } from 'ts-morph';
import TypesRefactor from '../../lib/code-refactor/types-refactor/types-refactor';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

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
