class PathParser {
  static win32ToPosixPath = (path: string): string => path.split(/\\+/).join('/');
}

export default PathParser;
