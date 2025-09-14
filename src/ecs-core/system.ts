import { Entity } from "./entity";
import { type Component } from "./component";

export class System {
  private requiredComponents: Set<string>;

  constructor(requiredComponents: string[]) {
    this.requiredComponents = new Set(requiredComponents);
  }

  update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      if (this.checkRequirements(entity)) {
        this.process(entity, deltaTime);
      }
    }
  }

  private checkRequirements(entity: Entity): boolean {
    return [...this.requiredComponents].every((component) =>
      entity.hasComponent(component)
    );
  }

  protected process(entity: Entity, deltaTime: number): void {
    // Override this method in subclasses to implement specific logic
  }
}
