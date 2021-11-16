import {VersionCalculator} from "../lib/dependency-installer/version-calculator/version-calculator";

test('get closest version with same major version', () => {
    const targetVersion = '3.1.1';
    const versions = ['3.1.5', '3.2.0', '3.0.9'];
    const closestVersion = VersionCalculator.closestVersion(targetVersion, versions);
    expect(closestVersion).toBe('3.1.5');
});

test('get closest version with higher major version', () => {
    const targetVersion = '3.1.1';
    const versions = ['4.1.5', '4.2.0', '4.0.9', '5.0.0'];
    const closestVersion = VersionCalculator.closestVersion(targetVersion, versions);
    expect(closestVersion).toBe('4.0.9');
});

test('get closest version with lower major version', () => {
    const targetVersion = '3.1.1';
    const versions = ['2.1.5', '2.2.0', '2.0.9', '1.5.1'];
    const closestVersion = VersionCalculator.closestVersion(targetVersion, versions);
    expect(closestVersion).toBe('2.2.0');
});

test('get version with higher major version on draw', () => {
    const targetVersion = '3.1.1';
    const versions = ['4.0.0', '2.0.0'];
    const closestVersion = VersionCalculator.closestVersion(targetVersion, versions);
    expect(closestVersion).toBe('4.0.0');
});

test('get closest version with largest patch version', () => {
    const targetVersion = '3.1.1';
    const versions = ['3.1.5', '3.1.1', '3.1.0'];
    const closestVersion = VersionCalculator.closestVersion(targetVersion, versions);
    expect(closestVersion).toBe('3.1.5');
});
