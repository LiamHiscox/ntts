import ScriptRunner from '../../helpers/script-runner/script-runner.js';
import { PackageVersion } from '../../models/package.model.js';

class VersionHandler {
  static packageVersions = async (packageName: string): Promise<PackageVersion[]> => {
    try {
      return await ScriptRunner.runParsed<PackageVersion[]>(`npm view ${packageName} versions --json`);
    } catch (e) {
      return Promise.resolve([]);
    }
  };

  static nodeVersion = (): PackageVersion => ScriptRunner.runSync('node --version').substring(1).trim();

  static parsedNodeVersion = (): number[] => VersionHandler.nodeVersion().split('.').map((v) => +v);
}

export default VersionHandler;
