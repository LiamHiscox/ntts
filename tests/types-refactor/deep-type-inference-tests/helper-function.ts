import {Node, SourceFile, SyntaxKind} from "ts-morph";

export const validate = (sourceFile: SourceFile, qualifier: string): boolean => {
  return sourceFile.getDescendantsOfKind(SyntaxKind.Parameter).reduce((acc: boolean, cur) => {
    const typeNode = cur.getTypeNode();
    return acc && Node.isImportTypeNode(typeNode) && typeNode.getQualifier()?.getText() === qualifier;
  }, true);
}
