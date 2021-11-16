export type PackageVersion = string;

export interface PackageVersionModel {
  dependencies: PackageListModel;
}

export interface PackageListModel {
  [packageName: string]: { version: PackageVersion };
}

export interface PackageModel {
  packageName: string, version?: PackageVersion;
}
