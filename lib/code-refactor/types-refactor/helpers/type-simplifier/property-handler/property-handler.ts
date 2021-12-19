import {InterfaceDeclaration, PropertySignature, TypeLiteralNode} from "ts-morph";
import {TypeHandler} from "../../../type-handler/type-handler";
import {TypeSimplifier} from "../type-simplifier";

export class PropertyHandler {
  static updateProperties = (left: TypeLiteralNode | InterfaceDeclaration, right: TypeLiteralNode) => {
    const leftProperties = left.getProperties();
    const rightProperties = right.getProperties();
    const intersectingProperties = PropertyHandler.getIntersectingProperties(leftProperties, rightProperties);
    const leftOptionals = PropertyHandler.getNonIntersectingProperties(intersectingProperties, leftProperties);
    const rightOptionals = PropertyHandler.getNonIntersectingProperties(intersectingProperties, rightProperties);
    PropertyHandler.addProperties(left, rightOptionals, true);
    PropertyHandler.updatePropertyTypes(left, intersectingProperties);
    PropertyHandler.setPropertiesOptional(leftOptionals, true);
  }

  static updatePropertyTypes = (left: TypeLiteralNode | InterfaceDeclaration, properties: PropertySignature[]) => {
    properties.forEach(property => {
      const currentProperty = left.getPropertyOrThrow(property.getName());
      currentProperty.setHasQuestionToken(currentProperty.hasQuestionToken() || property.hasQuestionToken());
      if (TypeHandler.getType(currentProperty).getText() !== TypeHandler.getType(property).getText()) {
        const combined = TypeHandler.combineTypes(TypeHandler.getType(currentProperty), TypeHandler.getType(property));
        const newProperty = TypeHandler.setTypeFiltered(currentProperty, combined);
        const stringSimplified = TypeSimplifier.simplifyTypeNode(TypeHandler.getTypeNode(newProperty));
        stringSimplified && TypeHandler.setTypeFiltered(newProperty, stringSimplified);
      }
    });
  }

  static setPropertiesOptional = (properties: PropertySignature[], optional: boolean) => {
    properties.forEach(property => property.setHasQuestionToken(optional))
  }

  static addProperties = (left: TypeLiteralNode | InterfaceDeclaration, properties: PropertySignature[], optional: boolean) => {
    properties.forEach(property => {
      left.addProperty({
        name: property.getName(),
        type: TypeHandler.getType(property).getText(),
        hasQuestionToken: optional
      });
    });
  }

  static getIntersectingProperties = (leftProperties: PropertySignature[], rightProperties: PropertySignature[]) => {
    return rightProperties.filter(right => !!leftProperties.find(left => left.getName() === right.getName()));
  }

  static getNonIntersectingProperties = (intersectingProperties: PropertySignature[], properties: PropertySignature[]) => {
    return properties.filter(property => !intersectingProperties.find(intersecting => property.getName() === intersecting.getName()));
  }
}
