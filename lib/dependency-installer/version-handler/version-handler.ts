import {ScriptRunner} from "../../script-runner/script-runner";
import {PackageVersion} from "../../models/package.model";


export class VersionHandler {
    /**
     * @param packageName the package to get the available version of
     * @returns Array<PackageVersion> a list of all the available version of the given package
     */
    static packageVersions = async (packageName: string): Promise<PackageVersion[]> => {
        try {
            return await ScriptRunner.runParsed<PackageVersion[]>(`npm view ${packageName} versions --json`);
        } catch (e) {
            return Promise.resolve([]);
        }
    }

    /**
     * @returns PackageVersion the installed version of Node.js
     */
    static nodeVersion = (): PackageVersion => {
        return ScriptRunner.runSync('node --version').substring(1).trim();
    }

    /**
     * @returns PackageVersion the installed version of Node.js as a number array
     */
    static parsedNodeVersion = (): number[] => {
        return VersionHandler.nodeVersion().split('.').map(v => +v);
    }
}
