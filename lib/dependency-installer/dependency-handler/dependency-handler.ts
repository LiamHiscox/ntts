import {ScriptRunner} from "../../helpers/script-runner/script-runner";
import {existsSync, readFileSync} from "fs";
import {join} from "path";
import {PackageListModel, PackageVersionModel} from "../../models/package.model";

export class DependencyHandler {
  /**
   * @returns Promise<PackageListModel> object with all the dependencies pf the project
   */
  static installedPackages = async (): Promise<PackageListModel> => {
    const packageVersion = await ScriptRunner.runParsed<PackageVersionModel>('npm ls --json');
    return packageVersion.dependencies;
  }

  /**
   * @param packageName the name the package to check if it has types already provided
   * @returns boolean true if the package already provides type definitions
   */
  static packageHasTypes = async (packageName: string): Promise<boolean> => {
    const pathToPackage = await ScriptRunner.runPipe(`npm ls ${packageName} --parseable --depth=0`);
    if (existsSync(join(pathToPackage, 'index.d.ts'))) {
      return true;
    }
    const fullPath = join(pathToPackage, 'package.json');
    const packageJSON = JSON.parse(readFileSync(fullPath, {encoding: 'utf-8'})) as { [key: string]: any };
    return packageJSON.hasOwnProperty('types') || packageJSON.hasOwnProperty('typings');
  }

  /**
   * @param packageName format a package name to the appropriate type definitions format
   */
  static packageToTypesFormat = (packageName: string): string => {
    if (DependencyHandler.isScoped(packageName)) {
      const formattedName = packageName.substring(1).replace('/', '__');
      return `@types/${formattedName}`;
    } else {
      return `@types/${packageName}`;
    }
  }

  /**
   * @param packageName the package name to check if it already is a type definition package
   */
  static isTypeDefinition = (packageName: string): boolean => {
    return /^@types\/.+$/.test(packageName);
  }

  private static isScoped = (packageName: string): boolean => {
    return /^@.+\/.+$/.test(packageName);
  }
}
