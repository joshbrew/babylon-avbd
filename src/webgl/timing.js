/** Nonblocking GPU elapsed queries. Disjoint results are discarded. */
export class GlStepTiming {
  constructor(compute) {
    this.compute = compute;
    this.extension = compute.gl.getExtension("EXT_disjoint_timer_query_webgl2");
    this.pending = new Set();
  }
  begin(name) {
    if (!this.extension) return;
    const gl = this.compute.gl,
      q = gl.createQuery();
    this.current = { name, q };
    gl.beginQuery(this.extension.TIME_ELAPSED_EXT, q);
  }
  end() {
    if (!this.current) return;
    this.compute.gl.endQuery(this.extension.TIME_ELAPSED_EXT);
    this.queries ??= [];
    this.queries.push(this.current);
    this.current = null;
  }
  finish(callback) {
    if (!this.extension) {
      callback(null);
      return;
    }
    const queries = this.queries ?? [];
    this.queries = [];
    const job = { queries, callback, started: performance.now() };
    this.pending.add(job);
    this.compute.gl.flush();
    const poll = () => {
      if (this.destroyed) return;
      const gl = this.compute.gl;
      if (gl.isContextLost() || performance.now() - job.started > 30000) {
        this.complete(job, null);
        return;
      }
      if (
        queries.some(
          ({ q }) => !gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE),
        )
      ) {
        setTimeout(poll, 1);
        return;
      }
      const result = gl.getParameter(this.extension.GPU_DISJOINT_EXT)
        ? null
        : Object.fromEntries(
            queries.map(({ name, q }) => [
              name,
              gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6,
            ]),
          );
      if (result)
        result.total = Object.values(result).reduce((a, b) => a + b, 0);
      this.complete(job, result);
    };
    setTimeout(poll, 0);
  }
  complete(job, result) {
    this.pending.delete(job);
    for (const { q } of job.queries) this.compute.gl.deleteQuery(q);
    job.callback(result);
  }
  destroy() {
    this.destroyed = true;
    this.end();
    for (const job of this.pending) this.complete(job, null);
    for (const { q } of this.queries ?? []) this.compute.gl.deleteQuery(q);
    this.pending.clear();
  }
}
