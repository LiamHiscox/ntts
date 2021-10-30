import {
  ClassDeclaration,
  ClassExpression,
  GetAccessorDeclaration,
  MethodDeclaration,
  PropertyDeclaration,
  Scope,
  SetAccessorDeclaration,
  SourceFile,
  SyntaxKind
} from "ts-morph";

type MethodFunction = MethodDeclaration | PropertyDeclaration | GetAccessorDeclaration | SetAccessorDeclaration;

export class ClassRefactor {
  static toTypeScriptClass (sourceFile: SourceFile) {
    this.getClassDescendants(sourceFile).forEach(_class => {
      this.addMissingProperties(_class);
      this.refactorClass(_class.getPos(), SyntaxKind.ClassExpression, sourceFile);
    });
  }

  private static getClassDescendants (sourceFile: SourceFile): (ClassDeclaration|ClassExpression)[] {
    return sourceFile.getDescendants().reduce((classes, descendant) => {
      switch (descendant.getKind()) {
        case SyntaxKind.ClassDeclaration:
        case SyntaxKind.ClassExpression:
          return classes.concat(descendant as ClassExpression|ClassDeclaration);
        default:
          return classes;
      }
    }, new Array<ClassDeclaration|ClassExpression>());
  }

  private static refactorClass (pos: number, type: SyntaxKind.ClassExpression | SyntaxKind.ClassDeclaration, sourceFile: SourceFile) {
    const _class = sourceFile.getDescendantAtPos(pos)?.getFirstAncestorByKind(type);
    const propertyNames = this.getMethodFunctionNames(_class);
    if (_class && propertyNames) {
      propertyNames.forEach(propertyName => {
        const ancestor = sourceFile.getDescendantAtPos(pos)?.getFirstAncestorByKind(type);
        const property = this.getMethodFunction(propertyName, ancestor);
        if (ancestor && property && property.getName().startsWith('#')) {
          property
            .setScope(Scope.Private)
            .rename(property.getName().substring(1));
        }
      });
    }
  }

  private static addMissingProperties (_class: ClassExpression | ClassDeclaration) {
    const declaredPropertyNames = _class.getProperties().map(p => p.getName());
    _class
      .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
      .forEach(propertyAccess => {
        const name = propertyAccess.getName();
        if (!declaredPropertyNames.includes(name)) {
          _class.addProperty({name});
        }
      })
  }

  private static getMethodFunctionNames (_class?: ClassExpression | ClassDeclaration): string[]|undefined {
    return _class?.getMembers().reduce((names, member) => {
      switch (member.getKind()) {
        case SyntaxKind.MethodDeclaration:
        case SyntaxKind.PropertyDeclaration:
        case SyntaxKind.GetAccessor:
        case SyntaxKind.SetAccessor:
          const methodMember = member as MethodFunction;
          return names.concat(methodMember.getName());
        default:
          return names;
      }
    }, new Array<string>())
  }

  private static getMethodFunction (name: string, _class?: ClassExpression | ClassDeclaration): MethodFunction|undefined {
    const member = _class?.getMember(name);
    switch (member?.getKind()) {
      case SyntaxKind.MethodDeclaration:
      case SyntaxKind.PropertyDeclaration:
      case SyntaxKind.GetAccessor:
      case SyntaxKind.SetAccessor:
        return member as MethodFunction;
      default:
        return;
    }
  }
}
