import { Entity } from "./entity";
import { System } from "./system";

export class World {
  private entities: Entity[] = [];
  private systems: System[] = [];
  private nextEntityId: number = 0;

  public createEntity(): Entity {
    const entity = new Entity(this.nextEntityId++);
    this.entities.push(entity);
    return entity;
  }

  public removeEntity(entityId: number): void {
    this.entities = this.entities.filter((e) => e.id !== entityId);
  }

  public addSystem(system: System): void {
    this.systems.push(system);
  }

  public removeSystem(system: System): void {
    this.systems = this.systems.filter((s) => s !== system);
  }

  public update(deltaTime: number): void {
    for (const system of this.systems) {
      system.update(this.entities, deltaTime);
    }
  }

  public getEntities(): Entity[] {
    return this.entities;
  }
}
