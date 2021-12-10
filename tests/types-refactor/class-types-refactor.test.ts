import {TypesRefactor} from "../../lib/code-refactor/types-refactor/types-refactor";
import {Project} from "ts-morph";

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

const content =
  `class Car {
  mile;
  speed;
  private year;
  private month;
  static liam = "awd";

  constructor(year, month) {
    this.speed = 100;
    this.mile = {current: 12};
    this.year = year;
    this.month = month;
    this.mile.current = 45;
  }

  get showYear () {
    return this.year;
  }

  showDoubleYear () {
    return this.doubleYear();
  }

  private doubleYear () {
    return this.year * 2;
  }

  private set newYear (value) {
    this.year = value;
  }

  private static tripleYear () {
    return 2021 * 3;
  }
}
`;

const expectedContent =
  `class Car {
  mile: { current: number; };
  speed: number;
  private year;
  private month;
  static liam: string = "awd";

  constructor(year, month) {
    this.speed = 100;
    this.mile = {current: 12};
    this.year = year;
    this.month = month;
    this.mile.current = 45;
  }

  get showYear () {
    return this.year;
  }

  showDoubleYear (): number {
    return this.doubleYear();
  }

  private doubleYear (): number {
    return this.year * 2;
  }

  private set newYear (value): void {
    this.year = value;
  }

  private static tripleYear (): number {
    return 2021 * 3;
  }
}
`;

test('should type simple class', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', content, {overwrite: true});
  TypesRefactor.setInitialTypes(sourceFile);
  expect(sourceFile.getText()).toEqual(expectedContent);
});
