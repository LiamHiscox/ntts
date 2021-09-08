import {ScriptRunner} from "../../script-runner/script-runner";
import {PackageVersion, PackageVersionModel} from "../../models/package-version.model";
import {existsSync, readFileSync} from "fs";
import {join} from "path";

export class DependencyHandler {
  static installedPackages = (): { [packageName: string]: { version: PackageVersion } } => {
    return ScriptRunner.runParsed<PackageVersionModel>('npm ls --json').dependencies;
  }

  static packageHasTypes = (packageName: string): boolean => {
    const pathToPackage = ScriptRunner.runPipe(`npm ls ${packageName} --parseable --depth`);
    if (existsSync(join(pathToPackage, 'index.d.ts'))) {
      return true;
    } else {
      const fullPath = join(pathToPackage, 'package.json');
      const packageJSON = JSON.parse(readFileSync(fullPath, {encoding: 'utf-8'})) as { [key: string]: any };
      return packageJSON.hasOwnProperty('types') || packageJSON.hasOwnProperty('typings');
    }
  }

  static packageToTypesFormat = (packageName: string): string => {
    if (DependencyHandler.isScoped(packageName)) {
      const formattedName = packageName.substring(1).replace('/', '__');
      return `@types/${formattedName}`;
    } else {
      return `@types/${packageName}`;
    }
  }

  private static isScoped = (packageName: string): boolean => {
    return /^@.+\/.+$/.test(packageName);
  }
}
