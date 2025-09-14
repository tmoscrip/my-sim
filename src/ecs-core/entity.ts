import { type Component } from "./component";

export class Entity {
  private components: Map<string, Component> = new Map();
  id: number;

  constructor(id: number) {
    this.id = id;
  }

  addComponent(component: Component): void {
    this.components.set(component.constructor.name, component);
  }

  removeComponent(componentClass: string): void {
    this.components.delete(componentClass);
  }

  getComponent<T extends Component>(
    componentClass: new (...args: any[]) => T
  ): T | undefined {
    return this.components.get(componentClass.name) as T | undefined;
  }

  hasComponent(componentClass: string): boolean {
    return this.components.has(componentClass);
  }
}
