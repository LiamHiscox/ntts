import {
  ClassDeclaration,
  ClassExpression,
  Node,
  Scope,
  SourceFile,
  SyntaxKind,
} from 'ts-morph';
import MethodFunctionHandler from './method-function-handler/method-function-handler';

class ClassRefactor {
  static toTypeScriptClasses = (sourceFile: SourceFile) => {
    sourceFile.getDescendants().forEach((descendant) => {
      if (!descendant.wasForgotten() && (
        Node.isClassExpression(descendant)
        || Node.isClassDeclaration(descendant))
      ) {
        this.addMissingProperties(descendant);
        this.refactorClass(descendant);
      }
    });
  };

  private static refactorClass = (_class: ClassExpression | ClassDeclaration) => {
    const propertyNames = MethodFunctionHandler.getMethodFunctionNames(_class);
    propertyNames.forEach((propertyName) => {
      const property = MethodFunctionHandler.getMethodFunction(propertyName, _class);
      if (property?.getName().startsWith('#')) {
        property.setScope(Scope.Private).rename(property.getName().substring(1));
      }
    });
  };

  private static getDeclaredMembers = (_class: ClassExpression | ClassDeclaration): string[] => _class.getMembers().map((p) => {
    if (Node.isConstructorDeclaration(p)) {
      return 'constructor';
    }
    return p.getName();
  });

  private static addMissingProperties = (_class: ClassExpression | ClassDeclaration) => {
    const declaredMemberNames = this.getDeclaredMembers(_class);
    _class
      .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
      .reduce((declared, access) => {
        const name = access.getName();
        if (access.getExpression().asKind(SyntaxKind.ThisKeyword) && !declared.includes(name)) {
          _class.insertProperty(0, { name });
          return declared.concat(name);
        }
        return declared;
      }, declaredMemberNames);
  };
}

export default ClassRefactor;
