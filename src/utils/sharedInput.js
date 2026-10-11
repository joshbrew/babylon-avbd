// Single producer / single consumer latest-state mailbox. Discrete events stay
// ordered through messages. No blocking waits, transferred poses, or shared GPU resources.
export const INPUT_WORDS = 9;
export function createSharedInput() {
  return globalThis.crossOriginIsolated &&
    typeof SharedArrayBuffer === "function"
    ? new Int32Array(new SharedArrayBuffer(INPUT_WORDS * 4))
    : null;
}
export function writeSharedInput(view, event, wheel = 0) {
  Atomics.add(view, 0, 1); // odd: a write is in progress
  const values = [
    Math.round(event.clientX * 1024),
    Math.round(event.clientY * 1024),
    event.pointerId ?? 1,
    event.buttons ?? 0,
    event.altKey ? 1 : 0,
    event.shiftKey ? 1 : 0,
    event.ctrlKey ? 1 : 0,
    Math.round(wheel * 1024),
  ];
  values.forEach((value, i) => Atomics.store(view, i + 1, value));
  Atomics.add(view, 0, 1); // even: publish the complete state
}
export function readSharedInput(view, previous = -1) {
  const sequence = Atomics.load(view, 0);
  if (sequence & 1 || sequence === previous) return null;
  const values = Array.from({ length: INPUT_WORDS - 1 }, (_, i) =>
    Atomics.load(view, i + 1),
  );
  if (Atomics.load(view, 0) !== sequence) return null;
  return {
    sequence,
    event: {
      clientX: values[0] / 1024,
      clientY: values[1] / 1024,
      pointerId: values[2],
      buttons: values[3],
      altKey: !!values[4],
      shiftKey: !!values[5],
      ctrlKey: !!values[6],
    },
    wheel: values[7] / 1024,
  };
}
