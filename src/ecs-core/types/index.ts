export type EntityId = string | number;

export interface Component {
  // Define the structure of a component
  [key: string]: any;
}

export interface Entity {
  id: EntityId;
  components: Record<string, Component>;
}

export interface System {
  update: (entities: Entity[]) => void;
}

export interface World {
  entities: Entity[];
  systems: System[];
  addEntity: (entity: Entity) => void;
  removeEntity: (entityId: EntityId) => void;
  addSystem: (system: System) => void;
  update: () => void;
}
