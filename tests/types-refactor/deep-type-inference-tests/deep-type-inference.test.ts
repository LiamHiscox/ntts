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
    fs.unlinkSync('ntts-generated-models.ts');
  }
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

function fun1 (_liam) {
  const l = _liam;
  fun2(l);
  fun4(l);
  _default(l);
};

function a (liam) {
  fun1(liam);
  const test = new Test(liam);
};
`;

test('should set types of parameters across files', () => {
  const sourceFile1 = project.createSourceFile('file1.ts', file1, { overwrite: true });
  const sourceFile2 = project.createSourceFile('file2.ts', file2, { overwrite: true });
  const sourceFile3 = project.createSourceFile('file3.ts', file3, { overwrite: true });
  const liamClass = sourceFile1.getClassOrThrow('Liam');
  const parameter = sourceFile3.getDescendantsOfKind(SyntaxKind.Parameter).find(p => p.getName() === "liam");
  const newParameter = parameter?.setType(liamClass.getType().getText());
  expect(newParameter).not.toBeUndefined();
  if (newParameter) {
    DeepTypeInference.propagateParameterTypes([newParameter]);
    expect(validate(sourceFile1, 'Liam')).toBeTruthy();
    expect(validate(sourceFile2, 'Liam')).toBeTruthy();
    expect(validate(sourceFile3, 'Liam')).toBeTruthy();
  }
});

const file4 = `
import Test, {Liam} from './file1';

function a (liam) {
  fun1(liam);
  const test = new Test(liam);
};
`;

test('should set types of parameters across files with default export assignment', () => {
  const sourceFile1 = project.createSourceFile('file1.ts', file1, { overwrite: true });
  const sourceFile2 = project.createSourceFile('file4.ts', file4, { overwrite: true });
  const liamClass = sourceFile1.getClassOrThrow('Liam');
  const parameter = sourceFile2.getDescendantsOfKind(SyntaxKind.Parameter).find(p => p.getName() === "liam");
  const newParameter = parameter?.setType(liamClass.getType().getText());
  expect(newParameter).not.toBeUndefined();
  if (newParameter) {
    DeepTypeInference.propagateParameterTypes([newParameter]);
    expect(validate(sourceFile1, 'Liam')).toBeTruthy();
    expect(validate(sourceFile2, 'Liam')).toBeTruthy();
  }
});
