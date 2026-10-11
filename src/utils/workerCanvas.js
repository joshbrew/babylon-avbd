/** DOM-free canvas sizing and event surface used by the demo renderers. */
export class WorkerCanvas {
  constructor(offscreenCanvas, width, height) {
    this.offscreenCanvas = offscreenCanvas;
    this.events = new Map();
    this.resize(width, height);
  }
  resize(width, height) {
    const w = Math.max(1, Math.floor(width)),
      h = Math.max(1, Math.floor(height));
    if (w !== this.clientWidth || h !== this.clientHeight)
      this.revision = (this.revision ?? 0) + 1;
    this.clientWidth = w;
    this.clientHeight = h;
  }
  get width() {
    return this.offscreenCanvas.width;
  }
  set width(value) {
    this.offscreenCanvas.width = value;
  }
  get height() {
    return this.offscreenCanvas.height;
  }
  set height(value) {
    this.offscreenCanvas.height = value;
  }
  getContext(...args) {
    return this.offscreenCanvas.getContext(...args);
  }
  getBoundingClientRect() {
    return {
      left: 0,
      top: 0,
      width: this.clientWidth,
      height: this.clientHeight,
    };
  }
  addEventListener(type, callback) {
    if (!this.events.has(type)) this.events.set(type, new Set());
    this.events.get(type).add(callback);
  }
  removeEventListener(type, callback) {
    this.events.get(type)?.delete(callback);
  }
  // Capture belongs to the page's HTML canvas; the worker receives its events.
  setPointerCapture() {}
  dispatch(type, data) {
    const event = { ...data, preventDefault() {} };
    for (const callback of this.events.get(type) ?? []) callback(event);
  }
}
