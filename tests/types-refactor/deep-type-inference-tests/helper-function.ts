import { Node, SourceFile, SyntaxKind } from 'ts-morph';

const validate = (sourceFile: SourceFile, qualifier: string): boolean => sourceFile
  .getDescendantsOfKind(SyntaxKind.Parameter)
  .reduce((acc: boolean, cur) => {
    const typeNode = cur.getTypeNode();
    return acc && Node.isImportTypeNode(typeNode) && typeNode.getQualifier()?.getText() === qualifier;
  }, true);

export default validate;
