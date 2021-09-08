import {ScriptRunner} from "../../script-runner/script-runner";
import {PackageVersion, PackageVersionModel} from "../../models/package-version.model";


export class VersionHandler {
    /**
     * @param packageName the package to get the available version of
     * @returns Array<PackageVersion> a list of all the available version of the given package
     */
    static typesVersions = (packageName: string): Array<PackageVersion> => {
        return ScriptRunner.runParsed<Array<PackageVersion>>(`npm view @types/${packageName} versions --json`);
    }

    /**
     * @param packageName the name of the installed package
     * @returns PackageVersion the installed version of the given package
     */
    static packageVersion = (packageName: string): PackageVersion => {
        return ScriptRunner
            .runParsed<PackageVersionModel>(`npm ls ${packageName} --json --depth`)
            .dependencies[packageName]
            .version;
    }

    /**
     * @returns PackageVersion the installed version of Node.js
     */
    static nodeVersion = (): PackageVersion => {
        return ScriptRunner.runPipe('node --version').substring(1);
    }
}
