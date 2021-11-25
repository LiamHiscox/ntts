import {
  ClassDeclaration,
  ClassExpression,
  GetAccessorDeclaration,
  MethodDeclaration,
  Node,
  PropertyDeclaration,
  SetAccessorDeclaration
} from "ts-morph";

type MethodFunction = MethodDeclaration | PropertyDeclaration | GetAccessorDeclaration | SetAccessorDeclaration;

export class MethodFunctionHandler {
  static getMethodFunctionNames = (_class: ClassExpression | ClassDeclaration): string[] => {
    return _class.getMembers().reduce((names, member) => {
      if (Node.isConstructorDeclaration(member) || Node.isClassStaticBlockDeclaration(member)) {
        return names;
      }
      return names.concat(member.getName());
    }, new Array<string>())
  }

  static getMethodFunction = (name: string, _class: ClassExpression | ClassDeclaration): MethodFunction | undefined => {
    const member = _class.getMember(name);
    if (Node.isConstructorDeclaration(member) || Node.isClassStaticBlockDeclaration(member)) {
      return;
    }
    return member;
  }
}
