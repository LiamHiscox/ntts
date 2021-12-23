import { Project } from 'ts-morph';
import ExportsRefactor from '../../../lib/code-refactor/exports-refactor/exports-refactor';
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

test('should refactor nested export', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'if (true) module.exports.item = 2;',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let item;\n\nif (true) item = 2;\n\nexport { item };\n');
});

test('should refactor nested shorthand export', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'if (true) exports.item = 2;',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let item;\n\nif (true) item = 2;\n\nexport { item };\n');
});

test('should refactor nested identifier export', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'let item = 2;\nif (true) module.exports.item = item;',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText())
    .toEqual('let item = 2;\nlet _item;\n\nif (true) _item = item;\n\nexport { _item as item };\n');
});

test('should refactor nested export with nested identifier', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'if (true) {\nlet item = 2;\nmodule.exports.item = item;\n}',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText())
    .toEqual('let _item;\n\nif (true) {\nlet item = 2;\n_item = item;\n}\n\nexport { _item as item };\n');
});
