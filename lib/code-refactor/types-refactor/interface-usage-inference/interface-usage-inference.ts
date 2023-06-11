import {
  ElementAccessExpression,
  Identifier,
  InterfaceDeclaration,
  Node, Project,
  Type
} from 'ts-morph';
import InterfaceReadReferenceChecker from './interface-read-reference-checker/interface-read-reference-checker.js';
import TypeHandler from '../type-handler/type-handler.js';
import {getInterfaces} from '../interface-handler/interface-creator/interface-creator.js';

class InterfaceUsageInference {
  static addPropertiesByUsage = (node: ElementAccessExpression | Identifier, interfaces: InterfaceDeclaration[], project: Project, target: string) => {
    const type = TypeHandler.getType(node);
    if (type.isInterface()) {
      return this.checkInterfaceType(type, node, interfaces, project, target);
    } else if (type.isUnion()) {
      return this.checkUnionType(type, node, interfaces, project, target);
    }
    return interfaces;
  };

  private static checkInterfaceType = (type: Type, node: Node, interfaces: InterfaceDeclaration[], project: Project, target: string) => {
    const interfaceDeclarations = interfaces.filter((i) => TypeHandler.getType(i).getText() === type.getText());
    if (interfaceDeclarations.length > 0) {
      InterfaceReadReferenceChecker.addPropertyOrType(node, interfaceDeclarations, project, target);
      return getInterfaces(project, target);
    }
    return interfaces;
  };

  private static checkUnionType = (type: Type, node: Node, interfaces: InterfaceDeclaration[], project: Project, target: string) => {
    const interfaceTypes = type.getUnionTypes().filter((u) => u.isInterface());
    const interfaceDeclarations = interfaces.filter((i) => interfaceTypes.find((t) => t.getText() === TypeHandler.getType(i).getText()));
    if (interfaceDeclarations.length > 0) {
      InterfaceReadReferenceChecker.addPropertyOrType(node, interfaceDeclarations, project, target);
      return getInterfaces(project, target);
    }
    return interfaces;
  };
}

export default InterfaceUsageInference;
