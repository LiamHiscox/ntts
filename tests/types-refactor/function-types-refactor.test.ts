import { Project } from 'ts-morph';
import TypeSimplifier from '../../lib/code-refactor/types-refactor/helpers/type-simplifier/type-simplifier';
import TypeHandler from '../../lib/code-refactor/types-refactor/type-handler/type-handler';
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

test('simplify function union type node', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'const cb: ((resolve: any, reject: any) => Promise<void>)'
    + ' | ((resolve: any, _: any) => Promise<void>)'
    + ' | ((resolve: any) => NodeJS.Timeout)'
    + ' | ((_: any, reject: any) => any)'
    + ' | ((resolve: any) => NodeJS.Timeout);',
    { overwrite: true },
  );
  const declaration = sourceFile.getVariableDeclarationOrThrow('cb');
  const simplified = TypeSimplifier.simplifyTypeNode(declaration.getTypeNodeOrThrow());
  if (simplified) {
    TypeHandler.setTypeFiltered(declaration, simplified);
  }
  expect(sourceFile.getText()).toEqual('const cb: (resolve: any, reject: any) => Promise<void> | NodeJS.Timeout;');
});
