// Reuse the laboratory's interactions and rendering in an isolated document.
// Benchmark startup awaits complete teardown, including pending GPU work.
export class PerformancePreview {
  constructor() {
    this.host = document.getElementById("preview-content");
    this.message = document.getElementById("preview-message");
    this.state = { phase: "idle", scene: null, paused: false, errors: [] };
    this.generation = 0;
    this.queue = Promise.resolve();
  }
  enqueue(action) {
    const next = this.queue.then(action);
    this.queue = next.catch(() => {});
    return next;
  }
  controls() {
    const ready = this.state.phase === "ready";
    for (const id of [
      "preview-pause",
      "preview-step",
      "preview-reset",
      "preview-fit",
      "preview-shoot",
    ])
      document.getElementById(id).disabled = !ready;
    document.getElementById("preview-pause").textContent = this.state.paused
      ? "Play"
      : "Pause";
    document.getElementById("preview-shoot").hidden = ![
      "3d-100k-rook-impact",
      "3d-castle-siege",
      "2d-slingshot-siege",
    ].includes(this.state.scene);
    document.getElementById("preview-shoot").textContent =
      this.state.scene === "2d-slingshot-siege" ? "Launch ball" : "Fire cannon";
    this.host.classList.toggle(
      "preview-suspended",
      this.state.phase === "suspended",
    );
    this.message.hidden = ready;
  }
  async disposeFrame() {
    if (!this.frame) return;
    const frame = this.frame;
    try {
      await this.loaded;
      await frame.contentWindow?.__AVBD_LAB__?.dispose();
      await frame.contentWindow?.__SLINGSHOT__?.dispose();
    } finally {
      frame.remove();
      this.frame = null;
    }
  }
  load(
    scene,
    paused = this.state.paused,
    broadphase = this.state.broadphase ?? "auto",
    solverMode = this.state.solverMode ?? "auto",
    renderer = this.state.renderer ?? "webgpu",
  ) {
    const token = ++this.generation;
    this.state.phase = "loading";
    this.message.textContent = "Preparing scene…";
    this.controls();
    return this.enqueue(async () => {
      await this.disposeFrame();
      if (token !== this.generation) return;
      Object.assign(this.state, {
        phase: "loading",
        scene,
        paused,
        broadphase,
        solverMode,
        renderer,
        errors: [],
      });
      this.message.textContent = "Preparing scene…";
      document.getElementById("preview-open").href =
        scene === "2d-slingshot-siege"
          ? `/?demo=slingshot&renderer=${renderer}`
          : `/?demo=canonical&scene=${encodeURIComponent(scene)}&backend=gpu&broadphase=${encodeURIComponent(broadphase)}&solverMode=${encodeURIComponent(solverMode)}&renderer=${renderer}`;
      this.controls();
      const frame = document.createElement("iframe");
      frame.id = "preview-frame";
      frame.title = "Interactive physics scene";
      this.loaded = new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(Error("Scene document did not load")),
          20000,
        );
        frame.onload = () => {
          clearTimeout(timer);
          resolve();
        };
        frame.onerror = () => {
          clearTimeout(timer);
          reject(Error("Scene document failed to load"));
        };
      });
      this.frame = frame;
      frame.src =
        scene === "2d-slingshot-siege"
          ? `/?demo=slingshot&renderer=${renderer}&embed=1&paused=${paused ? 1 : 0}`
          : `/?demo=canonical&scene=${encodeURIComponent(scene)}&backend=gpu&broadphase=${encodeURIComponent(broadphase)}&solverMode=${encodeURIComponent(solverMode)}&renderer=${renderer}&embed=1&paused=${paused ? 1 : 0}`;
      this.host.append(frame);
      try {
        await this.loaded;
        const start = performance.now();
        while (
          token === this.generation &&
          !(
            frame.contentWindow.__AVBD_LAB__?.diagnostics.ready ||
            frame.contentWindow.__SLINGSHOT__?.ready
          )
        ) {
          const errors =
            frame.contentWindow.__AVBD_LAB__?.diagnostics.errors ??
            frame.contentWindow.__SLINGSHOT__?.state.errors;
          if (errors?.length) throw Error(errors.join("\n"));
          if (performance.now() - start > 30000)
            throw Error("Scene initialization timed out");
          await new Promise((resolve) => setTimeout(resolve, 30));
        }
        if (token !== this.generation) return;
        this.state.phase = "ready";
        this.controls();
      } catch (error) {
        await this.disposeFrame();
        this.state.phase = "error";
        this.state.errors.push(error.message);
        this.message.textContent = `Unable to show scene: ${error.message}`;
        this.controls();
      }
    });
  }
  stop() {
    ++this.generation;
    this.state.phase = "suspended";
    this.message.textContent =
      "Preview closed while measurements run. It will return afterward.";
    this.controls();
    return this.enqueue(() => this.disposeFrame());
  }
  api() {
    return (
      this.frame?.contentWindow.__AVBD_LAB__ ??
      this.frame?.contentWindow.__SLINGSHOT__
    );
  }
  pause() {
    if (this.state.phase !== "ready") return;
    this.state.paused = !this.state.paused;
    this.api().pause(this.state.paused);
    this.controls();
  }
  async step() {
    if (this.state.phase !== "ready") return;
    this.state.paused = true;
    this.api().pause(true);
    await this.api().step();
    this.controls();
  }
  async fit() {
    if (this.state.phase === "ready")
      if (this.state.scene === "2d-slingshot-siege") this.api().fit();
      else await this.frame.contentDocument.querySelector("#lab-fit").onclick();
  }
  async shoot() {
    if (this.state.phase === "ready") {
      if (this.state.scene === "2d-slingshot-siege") {
        if (!this.api().state.hold) this.api().reload();
        this.api().launch();
      } else await this.api().shoot();
    }
  }
}
