import {TypeNode, Node, ArrayTypeNode} from "ts-morph";
import {TypeSimplifier} from "../type-simplifier/type-simplifier";
import {TypeChecker} from "../type-checker/type-checker";

export class ArrayTypeHandler {
  static combineArrayTypes = (typeNode: TypeNode) => {
    if (Node.isUnionTypeNode(typeNode)) {
      const typeNodes = typeNode.getTypeNodes().filter(node => !TypeChecker.isAny(node.getType()));
      const nonArrayLiterals = typeNodes.filter(node => !Node.isArrayTypeNode(node)).map(node => node.getText());
      const typeLiterals = typeNodes.reduce((acc, cur) =>
        Node.isArrayTypeNode(cur) ? acc.concat(cur.getElementTypeNode()) : acc, new Array<TypeNode>());
      const simplifiedList = TypeSimplifier.simplifyTypeNodeList(typeLiterals);
      if (simplifiedList && nonArrayLiterals.length > 0) {
        return `(${simplifiedList} | ${nonArrayLiterals.join(' | ')})[]`;
      }
      if (nonArrayLiterals.length > 0) {
        const newType = nonArrayLiterals.join(' | ');
        return (/[&| ]+/).test(newType) ? `(${nonArrayLiterals.join(' | ')})[]` : `${nonArrayLiterals.join(' | ')}[]`;
      }
      if (simplifiedList) {
        return (/[&| ]+/).test(simplifiedList) ? `(${simplifiedList})[]` : `${simplifiedList}[]`;
      }
      return;
    }
    return;
  }

  static combineArrayTypeList = (...typeNodes: ArrayTypeNode[]) => {
    const simplifiedList = TypeSimplifier.simplifyTypeNodeList(typeNodes);
    return (/[&| ]+/).test(simplifiedList) ? `(${simplifiedList})[]` : `${simplifiedList}[]`;
  }
}
