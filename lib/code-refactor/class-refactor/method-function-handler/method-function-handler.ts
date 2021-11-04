import {
  ClassDeclaration,
  ClassExpression,
  GetAccessorDeclaration,
  MethodDeclaration,
  PropertyDeclaration,
  SetAccessorDeclaration,
  SyntaxKind
} from "ts-morph";

type MethodFunction = MethodDeclaration | PropertyDeclaration | GetAccessorDeclaration | SetAccessorDeclaration;

export class MethodFunctionHandler {
  static getMethodFunctionNames(_class: ClassExpression | ClassDeclaration): string[] {
    return _class.getMembers().reduce((names, member) => {
      switch (member.getKind()) {
        case SyntaxKind.MethodDeclaration:
        case SyntaxKind.PropertyDeclaration:
        case SyntaxKind.GetAccessor:
        case SyntaxKind.SetAccessor:
          const methodMember = member as MethodFunction;
          return names.concat(methodMember.getName());
        default:
          return names;
      }
    }, new Array<string>())
  }

  static getMethodFunction(name: string, _class: ClassExpression | ClassDeclaration): MethodFunction | undefined {
    const member = _class.getMember(name);
    switch (member?.getKind()) {
      case SyntaxKind.MethodDeclaration:
      case SyntaxKind.PropertyDeclaration:
      case SyntaxKind.GetAccessor:
      case SyntaxKind.SetAccessor:
        return member as MethodFunction;
      default:
        return;
    }
  }
}
