const check = (condition, message) => {
  if (!condition) throw Error(message);
};

export function checkReleasedCompute(compute) {
  check(compute.textures.size === 0, "World textures must be released");
  const cached = new Set(compute.programCache.values());
  check(
    compute.programs.size === cached.size &&
      [...compute.programs].every((p) => cached.has(p)),
    "Only pipeline-owned cached programs may remain",
  );
  for (const [source, program] of compute.programCache) {
    check(
      compute.program(source) === program,
      "Identical shaders must reuse their cached program",
    );
    check(
      compute.gl.isProgram(program.handle),
      "Cached programs must remain usable",
    );
  }
}

export function destroyComputeAndCheck(compute) {
  const handles = [...compute.programs].map((program) => program.handle);
  compute.destroy();
  check(
    compute.textures.size === 0 &&
      compute.programs.size === 0 &&
      compute.programCache.size === 0,
    "Pipeline disposal must release its resources",
  );
  for (const handle of handles)
    check(
      !compute.gl.isProgram(handle),
      "Pipeline disposal must delete cached GPU programs",
    );
}
