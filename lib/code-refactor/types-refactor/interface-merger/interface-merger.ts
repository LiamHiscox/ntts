import { InterfaceDeclaration } from 'ts-morph';
import TypeHandler from '../type-handler/type-handler';
import ProgressBar from 'progress';
import { findReferencesAsNodes } from '../../helpers/reference-finder/reference-finder';

class InterfaceMerger {
  static mergeDuplicates = (interfaceDeclarations: InterfaceDeclaration[], bar: ProgressBar) => {
    interfaceDeclarations.forEach((declaration) => {
      if (!declaration.wasForgotten()) {
        const duplicates = this.findDuplicates(
          declaration,
          interfaceDeclarations.filter((d) => !d.wasForgotten())
        );
        duplicates.forEach((duplicate) => {
          this.rename(duplicate, declaration.getName());
          duplicate.remove();
        });
      }
      bar.tick();
    });
  };

  private static rename = (i: InterfaceDeclaration, newName: string) => {
    const nameNode = i.getNameNode();
    findReferencesAsNodes(nameNode).forEach(ref => ref.replaceWithText(newName));
    nameNode.replaceWithText(newName);
  }

  private static findDuplicates = (
    target: InterfaceDeclaration,
    declarations: InterfaceDeclaration[],
  ): InterfaceDeclaration[] => declarations
    .filter((i) => i.getName() !== target.getName() && this.compareInterfaces(target, i));

  private static compareInterfaces = (declaration1: InterfaceDeclaration, declaration2: InterfaceDeclaration): boolean =>
    declaration1.getProperties().length === declaration2.getProperties().length
    && declaration1.getIndexSignatures().length === declaration2.getIndexSignatures().length
    && this.compareProperties(declaration1, declaration2)
    && this.compareIndexSignatures(declaration1, declaration2);

  private static compareIndexSignatures = (dec1: InterfaceDeclaration, dec2: InterfaceDeclaration): boolean => dec1
    .getIndexSignatures()
    .reduce((acc: boolean, cur) => {
      const prop2 = dec2.getIndexSignature((i) => i.getKeyType().getText() === cur.getKeyType().getText());
      return acc && !!prop2 && prop2.getReturnType().getText() === cur.getReturnType().getText();
    }, true);

  private static compareProperties = (declaration1: InterfaceDeclaration, declaration2: InterfaceDeclaration): boolean => declaration1
    .getProperties()
    .reduce((acc: boolean, cur) => {
      const prop2 = declaration2.getProperty(cur.getName());
      return acc && !!prop2 && TypeHandler.getType(prop2).getText() === TypeHandler.getType(cur).getText();
    }, true);
}

export default InterfaceMerger;
