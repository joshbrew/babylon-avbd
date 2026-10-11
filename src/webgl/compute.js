// WebGL2 fragment-compute resources. The solver owns a dedicated context so
// simulation passes do not disturb a renderer's state. No Babylon dependency.
const vertex = `#version 300 es
void main() {
  vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);
  gl_Position=vec4(p*2.-1.,0.,1.);
}`;

export class GlCompute {
  constructor(gl) {
    if (!gl || typeof gl.texStorage2D !== "function")
      throw Error("A WebGL2 context is required");
    if (!gl.getExtension("EXT_color_buffer_float"))
      throw Error("WebGL2 physics requires EXT_color_buffer_float");
    this.gl = gl;
    this.textures = new Set();
    this.programs = new Set();
    this.programCache = new Map();
    this.framebuffer = gl.createFramebuffer();
    this.vao = gl.createVertexArray();
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.maxTargets = Math.min(
      gl.getParameter(gl.MAX_DRAW_BUFFERS),
      gl.getParameter(gl.MAX_COLOR_ATTACHMENTS),
    );
    this.maxSamplers = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  }
  assertLive() {
    if (this.destroyed)
      throw Error("WebGL2 compute context has been destroyed");
    if (this.gl.isContextLost()) throw Error("WebGL2 compute context was lost");
  }
  texture(width, height, integer = false, data) {
    this.assertLive();
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 1 ||
      height < 1 ||
      width > this.maxTextureSize ||
      height > this.maxTextureSize
    )
      throw Error("Compute texture exceeds the WebGL2 dimensions");
    const gl = this.gl,
      handle = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, handle);
    gl.texStorage2D(
      gl.TEXTURE_2D,
      1,
      integer ? gl.RGBA32UI : gl.RGBA32F,
      width,
      height,
    );
    const allocationError = gl.getError();
    if (allocationError !== gl.NO_ERROR) {
      gl.deleteTexture(handle);
      throw Error(
        `WebGL2 could not allocate a ${width} × ${height} compute texture (graphics error ${allocationError}). Use a smaller scene or WebGPU.`,
      );
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const texture = { handle, width, height, integer };
    this.textures.add(texture);
    if (data) this.upload(texture, data);
    return texture;
  }
  upload(texture, data) {
    this.assertLive();
    const Type = texture.integer ? Uint32Array : Float32Array;
    if (
      !(data instanceof Type) ||
      data.length !== texture.width * texture.height * 4
    )
      throw Error("Compute texture upload has the wrong type or length");
    const gl = this.gl;
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);
    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, 0);
    gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, 0);
    gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture.handle);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      texture.width,
      texture.height,
      texture.integer ? gl.RGBA_INTEGER : gl.RGBA,
      texture.integer ? gl.UNSIGNED_INT : gl.FLOAT,
      data,
    );
  }
  program(fragment) {
    this.assertLive();
    if (this.programCache.has(fragment)) return this.programCache.get(fragment);
    const gl = this.gl,
      shaders = [],
      handle = gl.createProgram();
    try {
      for (const [kind, source] of [
        [gl.VERTEX_SHADER, vertex],
        [gl.FRAGMENT_SHADER, fragment],
      ]) {
        const shader = gl.createShader(kind);
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          throw Error(gl.getShaderInfoLog(shader));
        gl.attachShader(handle, shader);
      }
      gl.linkProgram(handle);
      if (!gl.getProgramParameter(handle, gl.LINK_STATUS))
        throw Error(gl.getProgramInfoLog(handle));
      const program = { handle, uniforms: new Map() };
      this.programs.add(program);
      this.programCache.set(fragment, program);
      return program;
    } catch (error) {
      gl.deleteProgram(handle);
      throw error;
    } finally {
      for (const shader of shaders) gl.deleteShader(shader);
    }
  }
  uploadLinear(texture, data, start = 0) {
    this.assertLive();
    const Type = texture.integer ? Uint32Array : Float32Array;
    if (
      !(data instanceof Type) ||
      data.length % 4 ||
      !Number.isInteger(start) ||
      start < 0 ||
      start + data.length / 4 > texture.width * texture.height
    )
      throw Error("Invalid linear compute texture upload");
    const gl = this.gl;
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);
    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, 0);
    gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, 0);
    gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture.handle);
    let offset = 0,
      remaining = data.length / 4;
    while (remaining) {
      const x = start % texture.width,
        y = Math.floor(start / texture.width),
        full = x === 0 && remaining >= texture.width;
      const width = full
          ? texture.width
          : Math.min(remaining, texture.width - x),
        height = full ? Math.floor(remaining / texture.width) : 1,
        count = width * height;
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        x,
        y,
        width,
        height,
        texture.integer ? gl.RGBA_INTEGER : gl.RGBA,
        texture.integer ? gl.UNSIGNED_INT : gl.FLOAT,
        data.subarray(offset * 4, (offset + count) * 4),
      );
      start += count;
      offset += count;
      remaining -= count;
    }
  }
  async programAsync(fragment) {
    this.assertLive();
    const gl = this.gl,
      extension = gl.getExtension("KHR_parallel_shader_compile");
    if (!extension) return this.program(fragment);
    const handle = gl.createProgram(),
      shaders = [];
    try {
      for (const [kind, source] of [
        [gl.VERTEX_SHADER, vertex],
        [gl.FRAGMENT_SHADER, fragment],
      ]) {
        const shader = gl.createShader(kind);
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        gl.attachShader(handle, shader);
      }
      gl.linkProgram(handle);
      const started = performance.now();
      while (!gl.getProgramParameter(handle, extension.COMPLETION_STATUS_KHR)) {
        this.assertLive();
        if (performance.now() - started > 45000)
          throw Error("WebGL2 compute shader compilation exceeded 45 seconds");
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
      for (const shader of shaders)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          throw Error(gl.getShaderInfoLog(shader));
      if (!gl.getProgramParameter(handle, gl.LINK_STATUS))
        throw Error(gl.getProgramInfoLog(handle));
      const program = { handle, uniforms: new Map() };
      this.programs.add(program);
      return program;
    } catch (error) {
      gl.deleteProgram(handle);
      throw error;
    } finally {
      for (const shader of shaders) gl.deleteShader(shader);
    }
  }
  location(program, name) {
    if (!program.uniforms.has(name))
      program.uniforms.set(
        name,
        this.gl.getUniformLocation(program.handle, name),
      );
    return program.uniforms.get(name);
  }
  dispatch(program, targets, inputs = {}, uniforms = {}) {
    this.assertLive();
    if (!targets.length || targets.length > this.maxTargets)
      throw Error("Invalid number of compute outputs");
    const { width, height } = targets[0],
      gl = this.gl;
    for (const t of targets)
      if (t.width !== width || t.height !== height)
        throw Error("Compute outputs must have equal dimensions");
    for (const t of Object.values(inputs))
      if (targets.some((out) => out.handle === t.handle))
        throw Error("A compute pass cannot read its own output texture");
    gl.bindVertexArray(this.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    for (let i = 0; i < this.maxTargets; i++)
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0 + i,
        gl.TEXTURE_2D,
        targets[i]?.handle ?? null,
        0,
      );
    gl.drawBuffers(targets.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
      throw Error("Incomplete WebGL2 compute framebuffer");
    for (const flag of [
      gl.BLEND,
      gl.DEPTH_TEST,
      gl.STENCIL_TEST,
      gl.SCISSOR_TEST,
      gl.CULL_FACE,
      gl.RASTERIZER_DISCARD,
      gl.DITHER,
    ])
      gl.disable(flag);
    gl.colorMask(true, true, true, true);
    gl.viewport(0, 0, width, height);
    gl.useProgram(program.handle);
    let unit = 0;
    for (const [name, texture] of Object.entries(inputs)) {
      const location = this.location(program, name);
      if (location === null) continue;
      if (unit >= this.maxSamplers)
        throw Error("Compute pass exceeds WebGL2 sampler capacity");
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture.handle);
      gl.bindSampler(unit, null);
      gl.uniform1i(location, unit++);
    }
    for (const [name, [kind, value]] of Object.entries(uniforms))
      gl[kind](this.location(program, name), value);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  /** One-time capacity validation during world creation. Ordinary steps use no readback. */
  readInitialStatus(texture) {
    this.assertLive();
    const gl = this.gl,
      out = new Uint32Array(4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    for (let i = 0; i < this.maxTargets; i++)
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0 + i,
        gl.TEXTURE_2D,
        i === 0 ? texture.handle : null,
        0,
      );
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    gl.readBuffer(gl.COLOR_ATTACHMENT0);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    gl.pixelStorei(gl.PACK_ROW_LENGTH, 0);
    gl.pixelStorei(gl.PACK_SKIP_PIXELS, 0);
    gl.pixelStorei(gl.PACK_SKIP_ROWS, 0);
    gl.readPixels(0, 0, 1, 1, gl.RGBA_INTEGER, gl.UNSIGNED_INT, out);
    if (gl.getError() !== gl.NO_ERROR)
      throw Error("WebGL2 initial capacity validation failed");
    return out;
  }
  // Explicit asynchronous download. Physics passes themselves never read back
  // body arrays, cell records or candidate pairs to perform collision detection.
  async read(texture) {
    this.assertLive();
    const gl = this.gl,
      buffer = gl.createBuffer();
    let fence;
    try {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
      for (let i = 0; i < this.maxTargets; i++)
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0 + i,
          gl.TEXTURE_2D,
          i === 0 ? texture.handle : null,
          0,
        );
      gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
      gl.readBuffer(gl.COLOR_ATTACHMENT0);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
      gl.pixelStorei(gl.PACK_ROW_LENGTH, 0);
      gl.pixelStorei(gl.PACK_SKIP_PIXELS, 0);
      gl.pixelStorei(gl.PACK_SKIP_ROWS, 0);
      gl.bufferData(
        gl.PIXEL_PACK_BUFFER,
        texture.width * texture.height * 16,
        gl.STREAM_READ,
      );
      gl.readPixels(
        0,
        0,
        texture.width,
        texture.height,
        texture.integer ? gl.RGBA_INTEGER : gl.RGBA,
        texture.integer ? gl.UNSIGNED_INT : gl.FLOAT,
        0,
      );
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const started = performance.now();
      for (;;) {
        this.assertLive();
        const status = gl.clientWaitSync(fence, 0, 0);
        if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED)
          break;
        if (status === gl.WAIT_FAILED || performance.now() - started > 30000)
          throw Error("WebGL2 compute download did not complete");
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      const out = texture.integer
        ? new Uint32Array(texture.width * texture.height * 4)
        : new Float32Array(texture.width * texture.height * 4);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
      gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, out);
      return out;
    } finally {
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      if (fence) gl.deleteSync(fence);
      gl.deleteBuffer(buffer);
    }
  }
  release(resource) {
    if (this.textures.delete(resource)) this.gl.deleteTexture(resource.handle);
    // Programs are immutable and shared by worlds on this pipeline. Retain
    // them until context disposal so topology edits never recompile shaders.
  }
  destroy() {
    if (this.destroyed) return;
    // WebGL defers deleting the current program until it is unbound.
    this.gl.useProgram(null);
    for (const t of this.textures) this.gl.deleteTexture(t.handle);
    for (const p of this.programs) this.gl.deleteProgram(p.handle);
    this.textures.clear();
    this.programs.clear();
    this.programCache.clear();
    this.gl.deleteFramebuffer(this.framebuffer);
    this.gl.deleteVertexArray(this.vao);
    this.destroyed = true;
  }
}
