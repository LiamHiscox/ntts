import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import ScriptRunner from '../../helpers/script-runner/script-runner';
import { PackageListModel, PackageVersionModel } from '../../models/package.model';

class DependencyHandler {
  static installedPackages = async (): Promise<PackageListModel> => {
    const packageVersion = await ScriptRunner.runParsed<PackageVersionModel>('npm ls --json');
    return packageVersion.dependencies || {};
  };

  static packageHasTypes = async (packageName: string): Promise<boolean> => {
    const pathToPackage = await ScriptRunner.runPipe(`npm ls ${packageName} --parseable --depth=0`);
    if (existsSync(join(pathToPackage, 'index.d.ts'))) {
      return true;
    }
    const fullPath = join(pathToPackage, 'package.json');
    const packageJSON = JSON.parse(readFileSync(fullPath, { encoding: 'utf-8' })) as { [key: string]: unknown };
    return Object.prototype.hasOwnProperty.call(packageJSON, 'types')
      || Object.prototype.hasOwnProperty.call(packageJSON, 'typings');
  };

  static packageToTypesFormat = (packageName: string): string => {
    if (DependencyHandler.isScoped(packageName)) {
      const formattedName = packageName.substring(1).replace('/', '__');
      return `@types/${formattedName}`;
    }
    return `@types/${packageName}`;
  };

  static isTypeDefinition = (packageName: string): boolean => /^@types\/.+$/.test(packageName);

  private static isScoped = (packageName: string): boolean => /^@.+\/.+$/.test(packageName);
}

export default DependencyHandler;
