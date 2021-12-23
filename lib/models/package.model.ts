export type PackageVersion = string;

export interface PackageListModel {
  [packageName: string]: { version: PackageVersion };
}

export interface PackageVersionModel {
  dependencies: PackageListModel;
}

export interface PackageModel {
  packageName: string, version?: PackageVersion;
}
