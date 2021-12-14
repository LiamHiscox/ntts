import {Type} from "ts-morph";

export class TypeChecker {
  static isAny = (type: Type): boolean => {
    if (type.isArray())
      return type.getArrayElementTypeOrThrow().isAny();
    if (type.isTuple())
      return type.getTupleElements().reduce((a: boolean, t) => a && this.isAny(t), true);
    return type.isAny();
  }

  static isAnyOrUnknown = (type: Type): boolean => {
    return type.isAny() || type.isUnknown();
  }

  static isBaseOrLiteralType = (type: Type): boolean => {
    const baseType = type.getBaseTypeOfLiteralType();
    return baseType.isNumber() || baseType.isString() || baseType.isBoolean();
  }
}
