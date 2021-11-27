import {Type} from "ts-morph";

export class TypeChecker {
  static isAny = (type: Type): boolean => {
    if (type.isArray())
      return type.getArrayElementTypeOrThrow().isAny();
    if (type.isTuple())
      return type.getTupleElements().reduce((a: boolean, t) => a && this.isAny(t), true);
    return type.isAny();
  }
}
