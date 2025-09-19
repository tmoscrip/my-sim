// Keyboard input + action mapping for 8-directional player movement

export type PlayerControlComponent = {
  // 8-directional movement flags (updated each frame by the input system)
  moveUp: boolean;
  moveDown: boolean;
  moveLeft: boolean;
  moveRight: boolean;
};

// Logical actions (const object instead of enum for erasableSyntaxOnly compatibility)
export const InputAction = {
  MoveUp: "MoveUp",
  MoveRight: "MoveRight",
  MoveDown: "MoveDown",
  MoveLeft: "MoveLeft",
} as const;
export type InputAction = (typeof InputAction)[keyof typeof InputAction];

export interface ActionState {
  pressed: boolean; // held
  justPressed: boolean; // transitioned this frame
  justReleased: boolean; // released this frame
  value: number; // analog placeholder (0/1)
}

type KeyCode = string;

interface Binding {
  action: InputAction;
  keys: Set<KeyCode>;
}

const bindings = new Map<InputAction, Binding>();
const keyToActions = new Map<KeyCode, Set<InputAction>>();
const actionStates = new Map<InputAction, ActionState>();

function ensureState(action: InputAction) {
  let st = actionStates.get(action);
  if (!st) {
    st = { pressed: false, justPressed: false, justReleased: false, value: 0 };
    actionStates.set(action, st);
  }
  return st;
}

export function addBinding(action: InputAction, keyCodes: KeyCode[]) {
  let binding = bindings.get(action);
  if (!binding) {
    binding = { action, keys: new Set() };
    bindings.set(action, binding);
  }
  for (const k of keyCodes) {
    binding.keys.add(k);
    let set = keyToActions.get(k);
    if (!set) {
      set = new Set();
      keyToActions.set(k, set);
    }
    set.add(action);
  }
  ensureState(action);
}

export function clearBinding(action: InputAction) {
  const binding = bindings.get(action);
  if (!binding) return;
  for (const k of binding.keys) {
    const set = keyToActions.get(k);
    if (set) {
      set.delete(action);
      if (set.size === 0) keyToActions.delete(k);
    }
  }
  bindings.delete(action);
}

let listenersAttached = false;

// Helper to add keyboard listeners with correct typing under union target
function addKBListener(
  target: Window | HTMLElement,
  type: "keydown" | "keyup",
  handler: (e: KeyboardEvent) => void
) {
  target.addEventListener(type, handler as unknown as EventListener);
}
function removeKBListener(
  target: Window | HTMLElement,
  type: "keydown" | "keyup",
  handler: (e: KeyboardEvent) => void
) {
  target.removeEventListener(type, handler as unknown as EventListener);
}

export function attachKeyboard(target: Window | HTMLElement = window) {
  if (listenersAttached) return;
  addKBListener(target, "keydown", onKeyDown);
  addKBListener(target, "keyup", onKeyUp);
  listenersAttached = true;
}

export function detachKeyboard(target: Window | HTMLElement = window) {
  if (!listenersAttached) return;
  removeKBListener(target, "keydown", onKeyDown);
  removeKBListener(target, "keyup", onKeyUp);
  listenersAttached = false;
}

function onKeyDown(e: KeyboardEvent) {
  const actions = keyToActions.get(e.code);
  if (!actions) return;
  for (const a of actions) {
    const st = ensureState(a);
    if (!st.pressed) {
      st.pressed = true;
      st.justPressed = true;
      st.value = 1;
    }
  }
}

function onKeyUp(e: KeyboardEvent) {
  const actions = keyToActions.get(e.code);
  if (!actions) return;
  for (const a of actions) {
    const st = ensureState(a);
    if (st.pressed) {
      st.pressed = false;
      st.justReleased = true;
      st.value = 0;
    }
  }
}

export function updatePerFrame() {
  for (const st of actionStates.values()) {
    st.justPressed = false;
    st.justReleased = false;
  }
}

export function getActionState(action: InputAction): ActionState {
  return ensureState(action);
}

export function isPressed(action: InputAction) {
  return ensureState(action).pressed;
}

// Convenience to get normalized movement vector (screen-space y+ down)
export function getMoveVector() {
  const up = isPressed(InputAction.MoveUp) ? 1 : 0;
  const down = isPressed(InputAction.MoveDown) ? 1 : 0;
  const left = isPressed(InputAction.MoveLeft) ? 1 : 0;
  const right = isPressed(InputAction.MoveRight) ? 1 : 0;
  let x = right - left;
  let y = down - up;
  if (x !== 0 && y !== 0) {
    const inv = 1 / Math.sqrt(2);
    x *= inv;
    y *= inv;
  }
  return { x, y };
}

function initDefaultBindings() {
  addBinding(InputAction.MoveUp, ["KeyW"]);
  addBinding(InputAction.MoveRight, ["KeyS"]);
  addBinding(InputAction.MoveDown, ["KeyR"]);
  addBinding(InputAction.MoveLeft, ["KeyA"]);
}

initDefaultBindings();
attachKeyboard();
