import {Identifier, Node, QualifiedName} from "ts-morph";

export class ImportTypeParser {
  static getFirstIdentifier = (typeName: Identifier | QualifiedName): Identifier => {
    if (Node.isQualifiedName(typeName))
      return this.getFirstIdentifier(typeName.getLeft());
    return typeName;
  }
}
