export type Cleanup = () => void;

export function listen<T extends Event>(
  el: EventTarget | null | undefined,
  type: string,
  handler: (e: T) => void,
  cleanups: Cleanup[],
) {
  if (!el) return;
  const wrapped = handler as EventListener;
  el.addEventListener(type, wrapped);
  cleanups.push(() => el.removeEventListener(type, wrapped));
}

export function requireElement<T extends HTMLElement>(
  id: string,
  kind: string,
): T {
  const el = document.getElementById(id) as T | null;
  if (!el) throw new Error(`Missing #${id} ${kind}`);
  return el;
}

export function optionalElement<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}
