import {
  ClassDeclaration,
  ClassExpression,
  ClassStaticBlockDeclaration,
  GetAccessorDeclaration,
  MethodDeclaration,
  PropertyDeclaration,
  Scope,
  SetAccessorDeclaration,
  SourceFile,
  SyntaxKind
} from "ts-morph";
import {MethodFunctionHandler} from "./method-function-handler/method-function-handler";
import {Logger} from "../../logger/logger";

type NamedMember =
  MethodDeclaration
  | PropertyDeclaration
  | GetAccessorDeclaration
  | SetAccessorDeclaration
  | ClassStaticBlockDeclaration;

export class ClassRefactor {
  static toTypeScriptClasses = (sourceFile: SourceFile) => {
    Logger.info(sourceFile.getFilePath());
    sourceFile.getDescendants().forEach(descendant => {
      switch (!descendant.wasForgotten() && descendant.getKind()) {
        case SyntaxKind.ClassDeclaration:
        case SyntaxKind.ClassExpression:
          const _class = descendant.asKind(SyntaxKind.ClassExpression) || descendant.asKindOrThrow(SyntaxKind.ClassDeclaration);
          this.addMissingProperties(_class);
          this.refactorClass(_class);
      }
    })
  }

  private static refactorClass = (_class: ClassExpression | ClassDeclaration) => {
    const propertyNames = MethodFunctionHandler.getMethodFunctionNames(_class);
    propertyNames.forEach(propertyName => {
      const property = MethodFunctionHandler.getMethodFunction(propertyName, _class);
      if (property?.getName().startsWith('#')) {
        property.setScope(Scope.Private).rename(property.getName().substring(1));
      }
    });
  }

  private static getDeclaredMembers = (_class: ClassExpression | ClassDeclaration): string[] => {
    return _class.getMembers().map((p) => {
      if (p.asKind(SyntaxKind.Constructor)) {
        return 'constructor';
      }
      return (p as NamedMember).getName();
    });

  }

  private static addMissingProperties = (_class: ClassExpression | ClassDeclaration) => {
    const declaredMemberNames = this.getDeclaredMembers(_class);
    _class
      .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
      .reduce((declared, propertyAccess) => {
        const name = propertyAccess.getName();
        if (propertyAccess.getExpression().asKind(SyntaxKind.ThisKeyword) && !declared.includes(name)) {
          _class.insertProperty(0, {name});
          return declared.concat(name);
        }
        return declared;
      }, declaredMemberNames)
  }
}
