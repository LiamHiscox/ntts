class VersionCalculator {
  /**
   * @param targetVersion the target version to get the closest version of
   * @param versionList the list of versions to find the closest to the target version
   * @returns string the best suited version out of the given versionList
   */
  static closestVersion = (targetVersion: string, versionList: string[]): string => {
    const versions = versionList
      .filter((version) => VersionCalculator.validVersion(version))
      .map((version) => VersionCalculator.versionList(version));

    const [targetMajor, targetMinor] = VersionCalculator.versionList(targetVersion);

    const major = VersionCalculator.closestTargetVersion(versions, targetMajor, 0);
    const filteredByMajor = VersionCalculator.filterByClosestVersion(versions, major, 0);

    const minor = VersionCalculator.bestMinorVersion(filteredByMajor, targetMinor, major - targetMajor);
    const filteredByMinor = VersionCalculator.filterByClosestVersion(filteredByMajor, minor, 1);

    const patch = VersionCalculator.limitTargetVersion(filteredByMinor, 2, Math.max);

    return [major, minor, patch].join('.');
  };

  private static closestTargetVersion = (versionList: number[][], targetVersion: number, index: number): number => versionList
    .reduce((closest: number, version) => {
      const versionDistance = targetVersion - version[index];
      const closestDistance = targetVersion - closest;
      if (Math.abs(versionDistance) < Math.abs(closestDistance)
        || (Math.abs(versionDistance) === Math.abs(closestDistance) && version[index] > closest)) {
        return version[index];
      }
      return closest;
    }, versionList[0][index]);

  private static limitTargetVersion = (versionList: number[][],
                                       index: number,
                                       condition: (...values: number[]) => number
  ): number => condition(...versionList.map((version) => version[index]));

  private static versionList = (version: string): number[] => version.split('.').map((v) => +v);

  private static validVersion = (version: string): boolean => /^\d+\.\d+\.\d+$/.test(version);

  private static filterByClosestVersion = (versions: number[][], target: number, index: number): number[][] => versions
    .filter((version) => version[index] === target);

  private static bestMinorVersion = (versions: number[][], targetMinor: number, majorDistance: number): number => {
    if (majorDistance === 0) {
      return VersionCalculator.closestTargetVersion(versions, targetMinor, 1);
    }
    if (majorDistance > 0) {
      return VersionCalculator.limitTargetVersion(versions, 1, Math.min);
    }
    return VersionCalculator.limitTargetVersion(versions, 1, Math.max);
  };
}

export default VersionCalculator;
