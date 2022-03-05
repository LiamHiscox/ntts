import { existsSync } from 'fs';
import ScriptRunner from '../helpers/script-runner/script-runner';
import VersionHandler from './version-handler/version-handler';
import VersionCalculator from './version-calculator/version-calculator';
import DependencyHandler from './dependency-handler/dependency-handler';
import Logger from '../logger/logger';
import { NPM, PackageManager, Yarn } from '../models/package-manager';
import ModuleDeclarator from '../module-declarator/module-declarator';
import { PackageListModel, PackageModel } from '../models/package.model';

class DependencyInstaller {
  static installProject = async (packageManager: PackageManager) => {
    Logger.info('Installing existing dependencies');
    await ScriptRunner.runIgnore(packageManager.install);
    Logger.success('Installed existing dependencies');
  };

  static installTypeDependencies = async (packageManager: PackageManager) => {
    Logger.info('Installing additional type definitions');
    const installedPackages = await DependencyHandler.installedPackages();
    const untypedModules = await DependencyInstaller.installTypes(installedPackages, packageManager);
    ModuleDeclarator.handleUntypedPackages(untypedModules);
  };

  static installBaseDependencies = async (packageManager: PackageManager) => {
    Logger.info('Installing base dependencies');
    const typePackage = await DependencyInstaller.getClosestNodeTypes();
    await DependencyInstaller.installPackages(
      packageManager,
      typePackage,
      { packageName: 'typescript' },
      { packageName: 'ts-node' },
    );
  };

  static addPackageJson = (packageManager: PackageManager) => {
    if (!existsSync('package.json')) {
      ScriptRunner.runSync(packageManager.init);
      Logger.info('package.json file added');
    }
  };

  static getPackageManager = (): PackageManager => {
    if (existsSync('yarn.lock') && this.yarnInstalled()) {
      Logger.info('Using yarn as your package manager');
      return Yarn;
    }
    Logger.info('Using npm as your package manager');
    return NPM;
  };

  private static yarnInstalled = (): boolean => /^\d+\.\d+\.\d+.*$/.test(ScriptRunner.runSync('yarn --version'));

  private static installPackages = async (packageManager: PackageManager, ...packages: PackageModel[]) => {
    const fullPackages = packages.map((p) => (p.version ? `${p.packageName}@${p.version}` : p.packageName)).join(' ');
    Logger.info(`Installing ${fullPackages}`);
    await ScriptRunner.runIgnore(`${packageManager.add} ${fullPackages}`);
    Logger.success('Packages installed!');
  };

  private static getClosestNodeTypes = async (): Promise<PackageModel> => {
    const typesVersions = await VersionHandler.packageVersions('@types/node');
    const closestTypesVersion = VersionCalculator.closestVersion(VersionHandler.nodeVersion(), typesVersions);
    return { packageName: '@types/node', version: closestTypesVersion };
  };

  private static getTypesToInstall = async (packageList: PackageListModel): Promise<{ untyped: string[], typed: PackageModel[] }> => {
    const filteredPromises = Object.entries(packageList)
      .map(async (entry) => {
        if (DependencyHandler.isTypeDefinition(entry[0])
          || await DependencyHandler.packageHasTypes(entry[0])) {
          return undefined;
        }
        return entry;
      });
    const filtered = await Promise.all(filteredPromises);
    const promises = filtered
      // filter out the packages that are already typed
      .reduce((acc: [string, { version: string }][], cur) => (cur ? acc.concat([cur]) : acc), [])
      // get the best suitable version for the untyped packages
      .map<Promise<PackageModel>>(async ([packageName, { version }]) => {
        const typesName = DependencyHandler.packageToTypesFormat(packageName);
        const typesVersions = await VersionHandler.packageVersions(typesName);
        if (typesVersions.length <= 0) {
          Logger.warn(`Package ${packageName} has no type definitions`);
          return { packageName };
        }
        const closestTypesVersion = VersionCalculator.closestVersion(version, typesVersions);
        return { packageName: typesName, version: closestTypesVersion };
      });
    const packages = await Promise.all(promises);
    // return the names of the packages without installable type declarations
    return {
      untyped: packages.reduce((acc: string[], p) => (!p.version ? acc.concat(p.packageName) : acc), []),
      typed: packages.filter((p) => p.version),
    };
  };

  private static installTypes = async (packageList: PackageListModel, packageManager: PackageManager): Promise<string[]> => {
    const { untyped, typed } = await this.getTypesToInstall(packageList);
    await DependencyInstaller.installPackages(packageManager, ...typed);
    return untyped;
  };
}

export default DependencyInstaller;
