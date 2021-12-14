import {Identifier, Node, QualifiedName} from "ts-morph";

export class ImportTypeParser {
  static getFirstIdentifier = (qualifer: QualifiedName | Identifier): Identifier => {
    if (Node.isIdentifier(qualifer))
      return qualifer;
    const left = qualifer.getLeft();
    if (Node.isQualifiedName(left))
      return this.getFirstIdentifier(left);
    return left;
  }
}
