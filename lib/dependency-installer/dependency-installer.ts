import {ScriptRunner} from "../script-runner/script-runner";
import {VersionHandler} from "./version-handler/version-handler";
import {VersionCalculator} from "./version-calculator/version-calculator";
import {DependencyHandler} from "./dependency-handler/dependency-handler";

export class DependencyInstaller {
  /**
  * @description installs type definitions of package if necessary and possible
  */
  static installTypeDependencies = () => {
    const installedPackages = DependencyHandler.installedPackages();
    Object.entries(installedPackages).map(([packageName, {version}]) => {
      DependencyInstaller.installTypes(packageName, version);
    });
  }

  /**
   * @description installs all the base dependencies needed for a node typescript project
   */
  static installBaseDependencies = () => {
    DependencyInstaller.installNodeTypes();
    DependencyInstaller.install('typescript');
    DependencyInstaller.install('ts-node');
  }

  private static install = (packageName: string, version?: string) => {
    const fullPackage = version ? `${packageName}@${version}` : packageName;
    ScriptRunner.runInherit(`npm install ${fullPackage}`);
  }

  private static installNodeTypes = () => {
    const typesVersions = VersionHandler.packageVersions('@types/node');
    const closestTypesVersion = VersionCalculator.closestVersion(VersionHandler.nodeVersion(), typesVersions);
    DependencyInstaller.install('@types/node', closestTypesVersion);
  }

  private static installTypes = (packageName: string, packageVersion: string) => {
    if (!DependencyHandler.isTypeDefinition(packageName) && !DependencyHandler.packageHasTypes(packageName)) {
      const typesName = DependencyHandler.packageToTypesFormat(packageName);
      const typesVersions = VersionHandler.packageVersions(typesName);
      const closestTypesVersion = VersionCalculator.closestVersion(packageVersion, typesVersions);
      DependencyInstaller.install(typesName, closestTypesVersion);
    }
  }
}
