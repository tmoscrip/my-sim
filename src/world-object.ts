import type { ComponentKey, Components } from "./components/components";

export type EntityId = number;

export type WorldObject = {
  id: EntityId;
  components: Partial<{ [K in ComponentKey]: Components[K] }>;
};

export function createObject(entityId: number): WorldObject {
  return {
    id: entityId,
    components: {},
  };
}

export function addComponent<K extends ComponentKey>(
  o: WorldObject,
  key: K,
  data: Components[K]
) {
  o.components[key] = data;
}

export function removeComponent<K extends ComponentKey>(
  o: WorldObject,
  key: K
) {
  delete o.components[key];
}

export function hasAll<K extends readonly ComponentKey[]>(
  o: WorldObject,
  ...keys: K
): o is WorldObject & {
  components: Required<Pick<typeof o.components, K[number]>> &
    typeof o.components;
} {
  return keys.every((k) => k in o.components) as any;
}
