import type { createObject, EntityId } from "../world-object";

export type EntityFactory = {
  create: (entityId: EntityId) => ReturnType<typeof createObject>;
};
