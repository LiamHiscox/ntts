import {ScriptRunner} from "../script-runner/script-runner";
import {VersionHandler} from "./version-handler/version-handler";
import {VersionCalculator} from "./version-calculator/version-calculator";
import {DependencyHandler} from "./dependency-handler/dependency-handler";
import {existsSync} from "fs";
import {Logger} from "../logger/logger";
import {NPM, PackageManager, Yarn} from "../models/package-manager";
import {ModuleDeclarator} from "../module-declarator/module-declarator";
import {PackageListModel, PackageModel} from "../models/package.model";

export class DependencyInstaller {
  static installProject = (packageManager: PackageManager) => {
    Logger.info('Installing existing dependencies');
    ScriptRunner.runIgnore(packageManager.install);
    Logger.success('Installed existing dependencies');
  }

  /**
   * @description installs type definitions of package if necessary and possible
   */
  static installTypeDependencies = (packageManager: PackageManager) => {
    Logger.info('Installing additional type definitions');
    const installedPackages = DependencyHandler.installedPackages();
    const untypedModules = DependencyInstaller.installTypes(installedPackages, packageManager);
    ModuleDeclarator.handleUntypedPackages(untypedModules);
  }

  /**
   * @description installs all the base dependencies needed for a node typescript project
   */
  static installBaseDependencies = (packageManager: PackageManager) => {
    Logger.info('Installing base dependencies');
    const typePackage = DependencyInstaller.getClosestNodeTypes();
    DependencyInstaller.installPackages(
      packageManager,
      typePackage,
      {packageName: 'typescript'},
      {packageName: 'ts-node'}
    );
  }

  /**
   * @description adds a basic package.json file if none exists
   */
  static addPackageJson = (packageManager: PackageManager) => {
    if (!existsSync('package.json')) {
      ScriptRunner.runIgnore(packageManager.init);
      Logger.info('package.json file added');
    }
  };

  /**
   * @description adds a basic package.json file if none exists
   */
  static getPackageManager = (): PackageManager => {
    if (existsSync('yarn.lock') && this.yarnInstalled()) {
      Logger.info('Using yarn as your package manager');
      return Yarn;
    } else {
      Logger.info('Using npm as your package manager');
      return NPM;
    }
  };

  private static yarnInstalled = (): boolean => {
    return /^\d+\.\d+\.\d+.*$/.test(ScriptRunner.runPipe('yarn --version'));
  }

  private static installPackages = (packageManager: PackageManager, ...packages: PackageModel[]) => {
    const fullPackages = packages.map(p => p.version ? `${p.packageName}@${p.version}` : p.packageName).join(' ');
    Logger.info(`Installing ${fullPackages}`);
    ScriptRunner.runIgnore(`${packageManager.add} ${fullPackages}`);
    Logger.success('Packages installed!');
  }

  private static getClosestNodeTypes = (): PackageModel => {
    const typesVersions = VersionHandler.packageVersions('@types/node');
    const closestTypesVersion = VersionCalculator.closestVersion(VersionHandler.nodeVersion(), typesVersions);
    return {packageName: '@types/node', version: closestTypesVersion};
  }

  private static getTypesToInstall = (packageList: PackageListModel): { untyped: string[], typed: PackageModel[] } => {
    return Object
      .entries(packageList)
      .reduce((acc: { untyped: string[], typed: PackageModel[] }, [packageName, {version}]) => {
        if (!DependencyHandler.isTypeDefinition(packageName) && !DependencyHandler.packageHasTypes(packageName)) {
          const typesName = DependencyHandler.packageToTypesFormat(packageName);
          const typesVersions = VersionHandler.packageVersions(typesName);

          if (typesVersions.length <= 0) {
            Logger.warn(`Package ${packageName} has no type definitions`);
            return {...acc, untyped: acc.untyped.concat(packageName)};
          }
          const closestTypesVersion = VersionCalculator.closestVersion(version, typesVersions);
          return {...acc, typed: acc.typed.concat({packageName: typesName, version: closestTypesVersion})};
        }
        return acc;
      }, {untyped: [], typed: []});
  }

  private static installTypes = (packageList: PackageListModel, packageManager: PackageManager): string[] => {
    const {untyped, typed} = this.getTypesToInstall(packageList);
    DependencyInstaller.installPackages(packageManager, ...typed);
    return untyped;
  }
}
