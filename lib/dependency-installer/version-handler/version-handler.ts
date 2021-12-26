import ScriptRunner from '../../helpers/script-runner/script-runner';
import { PackageVersion } from '../../models/package.model';

class VersionHandler {
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
  };

  /**
     * @returns PackageVersion the installed version of Node.js
     */
  static nodeVersion = (): PackageVersion => ScriptRunner.runSync('node --version').substring(1).trim();

  /**
     * @returns PackageVersion the installed version of Node.js as a number array
     */
  static parsedNodeVersion = (): number[] => VersionHandler.nodeVersion().split('.').map((v) => +v);
}

export default VersionHandler;
