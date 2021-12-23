export interface PackageManager {
  install: string;
  add: string;
  init: string;
}

export const NPM: PackageManager = {
  install: 'npm install',
  add: 'npm install',
  init: 'npm init -y',
};

export const Yarn: PackageManager = {
  install: 'yarn',
  add: 'yarn add',
  init: 'yarn init -y',
};
