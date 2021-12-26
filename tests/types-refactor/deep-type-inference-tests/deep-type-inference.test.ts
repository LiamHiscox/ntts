import { Project, SyntaxKind } from 'ts-morph';
import DeepTypeInference from '../../../lib/code-refactor/types-refactor/deep-type-inference/deep-type-inference';
import validate from './helper-function';
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

const file1 = `
export class Liam {}
class Test {
  l;
  constructor(l) { this.l = l; }
};
export default Test;
`;
const file2 = `
export const fun2 = (l) => { console.log(l); };
function fun3 (l) { console.log(l); }
export { fun3 as fun4 };
function fun5 (l) { console.log(l); }
export default fun5;
`;
const file3 = `
import Test, {Liam} from './file1';
import _default, {fun2, fun4} from './file2';

function fun1 (liam) {
  const l = liam;
  fun2(l);
  fun4(l);
  _default(l);
};
const liam = new Liam();
fun1(liam);
const test = new Test(liam);
`;

test('should set types of parameters across files', () => {
  const sourceFile1 = project.createSourceFile('file1.ts', file1, { overwrite: true });
  const sourceFile2 = project.createSourceFile('file2.ts', file2, { overwrite: true });
  const sourceFile3 = project.createSourceFile('file3.ts', file3, { overwrite: true });
  sourceFile3
    .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
    .forEach((declaration) => DeepTypeInference.propagateClassOrInterfaceType(declaration));
  expect(validate(sourceFile1, 'Liam')).toBeTruthy();
  expect(validate(sourceFile2, 'Liam')).toBeTruthy();
  expect(validate(sourceFile3, 'Liam')).toBeTruthy();
});

const file4 = `
import Test, {Liam} from './file1';

const liam = new Liam();
new Test(liam);
`;

test('should set types of parameters across files with default export assignment', () => {
  const sourceFile1 = project.createSourceFile('file1.ts', file1, { overwrite: true });
  const sourceFile3 = project.createSourceFile('file4.ts', file4, { overwrite: true });
  sourceFile3
    .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
    .forEach((declaration) => DeepTypeInference.propagateClassOrInterfaceType(declaration));
  expect(validate(sourceFile1, 'Liam')).toBeTruthy();
  expect(validate(sourceFile3, 'Liam')).toBeTruthy();
});
