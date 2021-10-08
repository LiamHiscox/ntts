import {ScriptRunner} from "../script-runner/script-runner";
import {VersionHandler} from "./version-handler/version-handler";
import {VersionCalculator} from "./version-calculator/version-calculator";
import {DependencyHandler} from "./dependency-handler/dependency-handler";
import {existsSync} from "fs";
import {Logger} from "../logger/logger";
import {NPM, PackageManager, Yarn} from "../models/package-manager";

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
    Object.entries(installedPackages).map(([packageName, {version}]) => {
      DependencyInstaller.installTypes(packageName, version, packageManager);
    });
  }

  /**
   * @description installs all the base dependencies needed for a node typescript project
   */
  static installBaseDependencies = (packageManager: PackageManager) => {
    Logger.info('Installing base dependencies');
    DependencyInstaller.installNodeTypes(packageManager);
    DependencyInstaller.install('typescript', packageManager);
    DependencyInstaller.install('ts-node', packageManager);
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
    if (existsSync('package-lock.json') || !this.yarnInstalled()) {
      Logger.info('Using npm as your package manager');
      return NPM;
    } else {
      Logger.info('Using yarn as your package manager');
      return Yarn;
    }
  };

  private static yarnInstalled = (): boolean => {
    return /^\d\.\d\.\d.*$/.test(ScriptRunner.runPipe('yarn --version'));
  }

  private static install = (packageName: string, packageManager: PackageManager, version?: string) => {
    Logger.info(`Installing ${packageName} ${version || ''}`);
    const fullPackage = version ? `${packageName}@${version}` : packageName;
    ScriptRunner.runIgnore(`${packageManager.add} ${fullPackage}`);
    Logger.success(`${packageName} installed!`);
  }

  private static installNodeTypes = (packageManager: PackageManager) => {
    const typesVersions = VersionHandler.packageVersions('@types/node');
    const closestTypesVersion = VersionCalculator.closestVersion(VersionHandler.nodeVersion(), typesVersions);
    DependencyInstaller.install('@types/node', packageManager, closestTypesVersion);
  }

  private static installTypes = (packageName: string, packageVersion: string, packageManager: PackageManager) => {
    if (!DependencyHandler.isTypeDefinition(packageName) && !DependencyHandler.packageHasTypes(packageName)) {
      const typesName = DependencyHandler.packageToTypesFormat(packageName);
      const typesVersions = VersionHandler.packageVersions(typesName);
      const closestTypesVersion = VersionCalculator.closestVersion(packageVersion, typesVersions);
      DependencyInstaller.install(typesName, packageManager, closestTypesVersion);
    }
  }
}
