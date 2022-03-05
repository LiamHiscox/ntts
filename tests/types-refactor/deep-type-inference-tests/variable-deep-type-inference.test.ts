import {Project, SyntaxKind} from 'ts-morph';
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

const _class = `
export class Liam {
  prop = (asd) => {}
  expr = function (asd) {}
  method (asd) {}
}`;

const input = `
function dec (asd) {}
const arrow = (asd) => {}
const expr = function (asd) {}

const obj = {
  arrow: (asd) => {},
  expr: function (asd) {},
  method(asd) {}
}

function a (liam) {
  dec(liam);
  arrow(liam);
  expr(liam);
  
  liam.method(liam);
  liam.prop(liam);
  liam.expr(liam);
  
  obj.arrow(liam);
  obj.expr(liam);
  obj.method(liam);
}`;

test('should set class type of parameter in same file', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', _class + input, { overwrite: true });
  const liam = sourceFile.getClassOrThrow('Liam');
  const parameter = sourceFile.getDescendantsOfKind(SyntaxKind.Parameter).find(p => p.getName() === 'liam');
  const newParameter = parameter?.setType(liam.getType().getText());
  expect(newParameter).not.toBeUndefined();
  if (newParameter) {
    DeepTypeInference.propagateParameterTypes([newParameter]);
    expect(validate(sourceFile, 'Liam')).toBeTruthy();
  }
});

test('should set class type of parameter in separate file', () => {
  const sourceFile1 = project.createSourceFile('class.ts', _class, { overwrite: true });
  const sourceFile2 = project.createSourceFile('usage.ts', `import {Liam} from "./class";\n${input}`, { overwrite: true });
  const liam = sourceFile1.getClassOrThrow('Liam');
  const parameter = sourceFile2.getDescendantsOfKind(SyntaxKind.Parameter).find(p => p.getName() === 'liam');
  const newParameter = parameter?.setType(liam.getType().getText());
  expect(newParameter).not.toBeUndefined();
  if (newParameter) {
    DeepTypeInference.propagateParameterTypes([newParameter]);
    expect(validate(sourceFile1, 'Liam')).toBeTruthy();
    expect(validate(sourceFile2, 'Liam')).toBeTruthy();
  }
});
