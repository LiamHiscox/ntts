interface TsconfigModel {
  extends?: string;
  compilerOptions: { [key: string]: boolean | string | string[] };
  include?: string[];
  exclude?: string[];
  files?: string[];
}

export default TsconfigModel;
