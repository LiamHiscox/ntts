import {ScriptRunner} from "../script-runner/script-runner";
import {VersionHandler} from "./version-handler/version-handler";
import {VersionCalculator} from "./version-calculator/version-calculator";

export class DependencyInstaller {
    /**
     * @param packageName the package to install and add to the project
     */
    static install = (packageName: string) => {
        ScriptRunner.runInherit(`npm install ${packageName}`);
    }

    /**
     * @param packageName the package to install the the type definitions of
     * @param packageVersion the version of the installed package to calculate the closest version of the type definitions
     */
    static installTypes = (packageName: string, packageVersion: string) => {
        const typesVersions = VersionHandler.typesVersions(packageName);
        const closestTypesVersion = VersionCalculator.closestVersion(packageVersion, typesVersions);
        ScriptRunner.runInherit(`npm install @types/${packageName}@${closestTypesVersion}`);
    }

    /**
     * @description installs all the base dependencies needed for a node typescript project
     */
    static installBaseDependencies = () => {
        // Node.js type definitions
        DependencyInstaller.installTypes('node', VersionHandler.nodeVersion());
        // TypeScript
        DependencyInstaller.install('typescript');
        // ts-node
        DependencyInstaller.install('ts-node');
    }
}
