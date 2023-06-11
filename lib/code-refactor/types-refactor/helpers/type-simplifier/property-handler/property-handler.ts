import { PropertySignature, TypeLiteralNode } from 'ts-morph';
import TypeHandler from '../../../type-handler/type-handler.js';
import TypeSimplifier from '../type-simplifier.js';
import { TypeMemberKind } from '../../../../helpers/combined-types/combined-types.js';

class PropertyHandler {
  static updateProperties = (left: TypeMemberKind, right: TypeLiteralNode) => {
    const leftProperties = left.getProperties();
    const rightProperties = right.getProperties();
    const intersectingProperties = PropertyHandler.getIntersectingProperties(leftProperties, rightProperties);
    const leftOptionals = PropertyHandler.getNonIntersectingProperties(intersectingProperties, leftProperties);
    const rightOptionals = PropertyHandler.getNonIntersectingProperties(intersectingProperties, rightProperties);
    PropertyHandler.addProperties(left, rightOptionals, true);
    PropertyHandler.updatePropertyTypes(left, intersectingProperties);
    PropertyHandler.setPropertiesOptional(leftOptionals, true);
  };

  static updatePropertyTypes = (left: TypeMemberKind, properties: PropertySignature[]) => {
    properties.forEach((property) => {
      const currentProperty = left.getPropertyOrThrow(property.getName());
      currentProperty.setHasQuestionToken(currentProperty.hasQuestionToken() || property.hasQuestionToken());
      if (TypeHandler.getType(currentProperty).getText() !== TypeHandler.getType(property).getText()) {
        const combined = TypeHandler.combineTypes(TypeHandler.getType(currentProperty), TypeHandler.getType(property));
        const newProperty = TypeHandler.setTypeFiltered(currentProperty, combined);
        const stringSimplified = TypeSimplifier.simplifyTypeNode(TypeHandler.getTypeNode(newProperty));
        TypeHandler.setTypeFiltered(newProperty, stringSimplified);
      }
    });
  };

  static setPropertiesOptional = (properties: PropertySignature[], optional: boolean) => {
    properties.forEach((property) => property.setHasQuestionToken(optional));
  };

  static addProperties = (left: TypeMemberKind, properties: PropertySignature[], optional: boolean) => {
    properties.forEach((property) => {
      left.addProperty({
        name: property.getName(),
        type: TypeHandler.getType(property).getText(),
        hasQuestionToken: optional,
      });
    });
  };

  static getIntersectingProperties = (leftProperties: PropertySignature[], rightProperties: PropertySignature[]) => rightProperties
    .filter((right) => !!leftProperties.find((left) => left.getName() === right.getName()));

  static getNonIntersectingProperties = (intersectingProperties: PropertySignature[], properties: PropertySignature[]) => properties
    .filter((property) => !intersectingProperties.find((intersecting) => property.getName() === intersecting.getName()));
}

export default PropertyHandler;
