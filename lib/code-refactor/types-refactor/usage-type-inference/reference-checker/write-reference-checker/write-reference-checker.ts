import {BinaryExpression, Node, PropertyAssignment, SyntaxKind, Type} from "ts-morph";
import {TypeHandler} from "../../../type-handler/type-handler";
import {TypeChecker} from "../../../helpers/type-checker/type-checker";

export class WriteReferenceChecker {
  static getType = (node: Node, initialType: Type): string | undefined => {
    const access = this.getWriteAccessAncestor(node);
    if (Node.isBinaryExpression(access) && access.getOperatorToken().asKind(SyntaxKind.EqualsToken)) {
      const assignedType = TypeHandler.getType(access.getRight()).getBaseTypeOfLiteralType();
      return !TypeChecker.isAny(assignedType) && assignedType.getText() !== initialType.getText() ? assignedType.getText() : undefined;
    }
    if (Node.isPropertyAssignment(access) && access.getInitializer()) {
      const assignedType = TypeHandler.getType(access.getInitializerOrThrow()).getBaseTypeOfLiteralType();
      return !TypeChecker.isAny(assignedType) && assignedType.getText() !== initialType.getText() ? assignedType.getText() : undefined;
    }
    return;
  }

  private static getWriteAccessAncestor = (node: Node): BinaryExpression | PropertyAssignment | undefined => {
    return node.getAncestors().find(a => Node.isBinaryExpression(a) || Node.isPropertyAssignment(a)) as (BinaryExpression | PropertyAssignment | undefined);
  }
}
