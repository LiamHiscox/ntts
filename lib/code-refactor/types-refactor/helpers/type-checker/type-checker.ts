import {Type} from 'ts-morph';

class TypeChecker {
  static isAny = (type: Type): boolean => {
    if (type.isArray()) {
      return type.getArrayElementTypeOrThrow().isAny();
    }
    if (type.isTuple()) {
      return type.getTupleElements().reduce((a: boolean, t) => a && this.isAny(t), true);
    }
    return type.isAny();
  };

  static isAnyOrUnknown = (type: Type): boolean => type.isAny() || type.isUnknown();

  static isAnyOrUnknownArray = (type: Type): boolean =>
    type.isArray() && (type.getArrayElementTypeOrThrow().isAny() || type.getArrayElementTypeOrThrow().isUnknown());

  static isNullOrUndefined = (type: Type): boolean => type.isNull() || type.isUndefined();

  static isBaseOrLiteralType = (type: Type): boolean => {
    const baseType = type.getBaseTypeOfLiteralType();
    return baseType.isNumber() || baseType.isString() || baseType.isBoolean();
  };
}

export default TypeChecker;
