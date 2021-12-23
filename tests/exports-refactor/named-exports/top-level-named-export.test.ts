import { Project } from 'ts-morph';
import ExportsRefactor from '../../../lib/code-refactor/exports-refactor/exports-refactor';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

test('should refactor export with literal value', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'module.exports.item = 2;',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const item = 2;\n\nexport { item };\n');
});

test('should refactor shorthand export with literal value', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'exports.item = 2;',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const item = 2;\n\nexport { item };\n');
});

test('should refactor export with equally named identifier assignment', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'const item = 2;\nmodule.exports.item = item;',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const item = 2;\n\nexport { item };\n');
});

test('should refactor export with differently named identifier assignment', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'const _number = 2;\nmodule.exports.item = _number;',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const _number = 2;\n\nexport { _number as item };\n');
});

test('should refactor re-assignment of export', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'module.exports.item = 2;\nmodule.exports.item = 12;',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let item = 2;\nitem = 12;\n\nexport { item };\n');
});

test('should refactor deep property access export', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'module.exports.item = {};\nmodule.exports.item.name = 2;',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('let item = {};\nitem.name = 2;\n\nexport { item };\n');
});

test('should refactor re-assignment of export with identifier', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'const item = 45;\nmodule.exports.item = item;\nmodule.exports.item = "liam";',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('const item = 45;\nlet _item = item;\n\n_item = "liam";\n\nexport { _item as item };\n');
});

test('should refactor assignment of class export', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'class Car {}\nmodule.exports.Car = Car;',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('class Car {}\n\nexport { Car };\n');
});

test('should refactor re-assignment of class export', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'class Car {};\nmodule.exports.Car = Car;\nmodule.exports.Car = 12;',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('class Car {};\n\nlet _Car = Car;\n\n_Car = 12;\n\nexport { _Car as Car };\n');
});

test('should refactor name collision exports', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'const item = 1;\nconst item0 = 2;\nexports.item = 3;\nexports.item0 = 4;',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText())
    .toEqual('const item = 1;\nconst item0 = 2;\nconst _item = 3;\nconst _item0 = 4;\n\nexport { _item as item, _item0 as item0 };\n');
});

test('should refactor named class expression export', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'exports.Car = class Car {};',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('class Car {}\n\nexport { Car };\n');
});

test('should refactor named class expression export with different class name', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'exports.Car = class {};',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('class Car {}\n\nexport { Car };\n');
});

test('should refactor named class expression export with usage', () => {
  const sourceFile = project.createSourceFile(
    'standard-require.ts',
    'exports.Car = class {};\nconst _class = new exports.Car();',
    { overwrite: true },
  );
  ExportsRefactor.moduleExportsToExport(sourceFile);
  expect(sourceFile.getText()).toEqual('class Car {}\n\nconst _class = new Car();\n\nexport { Car };\n');
});
