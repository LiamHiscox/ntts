import {
  ClassDeclaration,
  ClassExpression,
  GetAccessorDeclaration,
  MethodDeclaration,
  Node,
  PropertyDeclaration,
  SetAccessorDeclaration,
} from 'ts-morph';

type MethodFunction =
  MethodDeclaration
  | PropertyDeclaration
  | GetAccessorDeclaration
  | SetAccessorDeclaration;

class MethodFunctionHandler {
  static getMethodFunctionNames = (_class: ClassExpression | ClassDeclaration): string[] => _class
    .getMembers()
    .reduce((names: string[], member) => {
      if (Node.isConstructorDeclaration(member) || Node.isClassStaticBlockDeclaration(member)) {
        return names;
      }
      return names.concat(member.getName());
    }, []);

  static getMethodFunction = (
    name: string,
    _class: ClassExpression | ClassDeclaration,
  ): MethodFunction | undefined => {
    const member = _class.getMember(name);
    if (Node.isConstructorDeclaration(member) || Node.isClassStaticBlockDeclaration(member)) {
      return undefined;
    }
    return member;
  };
}

export default MethodFunctionHandler;
