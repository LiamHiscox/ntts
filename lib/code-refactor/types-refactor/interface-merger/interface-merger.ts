import {InterfaceDeclaration} from "ts-morph";
import {TypeHandler} from "../type-handler/type-handler";

export class InterfaceMerger {
  static mergeDuplicates = (interfaceDeclarations: InterfaceDeclaration[]) => {
    interfaceDeclarations.forEach((declaration) => {
      if (!declaration.wasForgotten()) {
        const duplicates = this.findDuplicates(declaration, interfaceDeclarations.filter(d => !d.wasForgotten()));
        duplicates.forEach(duplicate => {
          duplicate.rename(declaration.getName());
          duplicate.remove();
        })
      }
    })
  }

  private static findDuplicates = (targetDeclaration: InterfaceDeclaration, interfaceDeclarations: InterfaceDeclaration[]): InterfaceDeclaration[] => {
    return interfaceDeclarations.filter(declaration =>
      declaration.getName() !== targetDeclaration.getName() && this.compareInterfaces(targetDeclaration, declaration))
  }

  private static compareInterfaces = (declaration1: InterfaceDeclaration, declaration2: InterfaceDeclaration): boolean => {
    return declaration1.getProperties().length === declaration2.getProperties().length
      && declaration1.getIndexSignatures().length === declaration2.getIndexSignatures().length
      && declaration1.getProperties().reduce((acc: boolean, cur) => {
        const prop2 = declaration2.getProperty(cur.getName());
        return acc && !!prop2 && TypeHandler.getType(prop2).getText() === TypeHandler.getType(cur).getText();
      }, true)
      && declaration1.getIndexSignatures().reduce((acc: boolean, cur) => {
        const prop2 = declaration2.getIndexSignature(index => index.getKeyType().getText() === cur.getKeyType().getText());
        return acc && !!prop2 && prop2.getReturnType().getText() === cur.getReturnType().getText();
      }, true);
  }
}
