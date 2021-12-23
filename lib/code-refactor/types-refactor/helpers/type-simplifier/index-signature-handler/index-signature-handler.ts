import { IndexSignatureDeclaration } from 'ts-morph';
import TypeHandler from '../../../type-handler/type-handler';
import { TypeMemberKind } from '../../../../helpers/combined-types/combined-types';

class IndexSignatureHandler {
  static getCombinedTypesOfSignatures = (
    signatures: IndexSignatureDeclaration[],
    member: IndexSignatureDeclaration,
    ...keyTypes: string[]
  ): string | undefined => {
    const newTypes = signatures
      .filter((s) => keyTypes.includes(s.getKeyType().getText()))
      .reduce((acc: string[], s) =>
        (keyTypes.includes(s.getKeyType().getText()) && !s.getReturnType().isAny() ? acc.concat(s.getReturnType().getText()) : acc), []);
    return TypeHandler.combineTypeWithList(member.getReturnType(), ...newTypes);
  };

  static addIndexSignature = (
    member: IndexSignatureDeclaration,
    leftIndex: IndexSignatureDeclaration | undefined,
    left: TypeMemberKind,
    combinedTypes: string | undefined,
  ): IndexSignatureDeclaration => {
    if (!leftIndex) {
      return left.addIndexSignature({
        keyName: member.getKeyName(),
        keyType: member.getKeyType().getText(),
        returnType: combinedTypes || member.getReturnType().getText(),
      });
    } if (leftIndex.getReturnType().getText() !== member.getReturnType().getText()) {
      const newReturn = leftIndex.setReturnType(combinedTypes || leftIndex.getReturnType().getText()).getReturnType();
      return leftIndex.setReturnType(newReturn.getText());
    }
    return leftIndex;
  };
}

export default IndexSignatureHandler;
