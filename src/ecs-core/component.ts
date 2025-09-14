export interface Component {
  // Unique identifier for the component
  id: string;
  // Optional method to initialize the component
  initialize?: () => void;
  // Optional method to update the component
  update?: (deltaTime: number) => void;
}

export type ComponentType<T extends Component> = new (...args: any[]) => T;
