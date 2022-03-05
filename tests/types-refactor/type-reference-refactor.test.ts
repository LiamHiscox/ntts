import { Project, SyntaxKind } from 'ts-morph';
import * as fse from 'fs-extra';
import TypeNodeRefactor from '../../lib/code-refactor/types-refactor/type-node-refactor/type-node-refactor';
import ScriptRunner from '../../lib/helpers/script-runner/script-runner';
import fs, {existsSync} from "fs";

let project: Project;

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';
const cwd = process.cwd();

afterEach(() => {
  if (existsSync('ntts-generated-models.ts')) {
    fs.unlinkSync('ntts-generated-models.ts');
  }
})

beforeAll(() => {
  fse.copySync(sample, sampleCopy);
  fse.copySync('tsconfig.json', 'tests/sample-copy/tsconfig.json');
  process.chdir(sampleCopy);
  ScriptRunner.runSync('npm i @types/express express @types/node');
  project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });
});

afterAll(() => {
  process.chdir(cwd);
  fse.rmSync(sampleCopy, { recursive: true, force: true });
});

test('should import global variable', () => {
  const sourceFile = project.createSourceFile(
    'global-types.ts',
    'let a: qs.ParsedQs;',
    { overwrite: true },
  );
  TypeNodeRefactor.importGlobalTypes(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.TypeReference), sourceFile);
  expect(sourceFile.getText()).toEqual('import qs from "qs";\n\nlet a: qs.ParsedQs;');
});

test('should not import global variable twice', () => {
  const sourceFile = project.createSourceFile(
    'global-types.ts',
    'let a: qs.ParsedQs;\nlet b: qs.IParseOptions;',
    { overwrite: true },
  );
  TypeNodeRefactor.importGlobalTypes(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.TypeReference), sourceFile);
  expect(sourceFile.getText()).toEqual('import qs from "qs";\n\nlet a: qs.ParsedQs;\nlet b: qs.IParseOptions;');
});

test('should not import promise', () => {
  const sourceFile = project.createSourceFile(
    'global-types.ts',
    'let a: Promise<string>;',
    { overwrite: true },
  );
  TypeNodeRefactor.importGlobalTypes(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.TypeReference), sourceFile);
  expect(sourceFile.getText()).toEqual('let a: Promise<string>;');
});
