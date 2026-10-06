// Alternate the order every step, keeping both worlds at the same simulation
// time. This reduces clock/temperature drift between long separate runs.
export async function pairedPerformance(
  { device, create, summarize, errors },
  scene,
  variants,
  warmup = 60,
  count = 60,
) {
  if (
    !Array.isArray(variants) ||
    variants.length !== 2 ||
    variants[0] === variants[1]
  )
    throw Error("Choose two different solver variants");
  if (
    !Number.isInteger(warmup) ||
    warmup < 0 ||
    !Number.isInteger(count) ||
    count < 1
  )
    throw Error(
      "Warmup and sample counts must be nonnegative/positive integers",
    );
  const worlds = [];
  try {
    for (const variant of variants)
      worlds.push({
        ...create(scene, variant),
        variant,
        samples: [],
        peakContacts: 0,
      });
    for (const world of worlds)
      world.initialScheduling = {
        colors: world.gpu.colorCap,
        rounds: world.gpu.colorRounds,
        minimumColors: world.gpu.minimumColors,
        minimumRounds: world.gpu.minimumColorRounds,
        primalLanes: [...world.gpu.primalLanes],
      };
    for (let step = 1; step <= warmup + count; step++) {
      for (const world of step % 2 ? worlds : [...worlds].reverse()) {
        const { gpu } = world;
        if (step > warmup || step === 1) {
          const profile = await new Promise((resolve, reject) => {
            const timeout = setTimeout(
              () => reject(Error("Paired timestamp readback timed out")),
              20000,
            );
            const profileStep = world.detailed
              ? gpu.profileDetailedNextStep.bind(gpu)
              : gpu.profileNextStep.bind(gpu);
            profileStep((profile) => {
              clearTimeout(timeout);
              resolve(profile);
            });
            gpu.step();
          });
          if (step > warmup) world.samples.push({ step, ...profile });
          else world.startup = profile;
        } else {
          gpu.step();
          await device.queue.onSubmittedWorkDone();
        }
        const counters = await gpu.readCounters();
        if (counters.overflow || counters.clashes)
          throw Error(
            JSON.stringify({ scene, variant: world.variant, step, counters }),
          );
        world.peakContacts = Math.max(world.peakContacts, counters.contacts);
        world.counters = counters;
        if (step > warmup) world.samples.at(-1).contacts = counters.contacts;
        if (step % 20 === 0) gpu.adapt(counters);
      }
    }
    const results = [];
    for (const world of worlds) {
      const poses = await world.gpu.readBodies();
      let quaternionError = 0;
      for (let i = 0; i < world.gpu.bodyCount; i++)
        quaternionError = Math.max(
          quaternionError,
          Math.abs(Math.hypot(...poses.subarray(i * 40 + 4, i * 40 + 8)) - 1),
        );
      if (
        !poses.every(Number.isFinite) ||
        quaternionError > 2e-4 ||
        errors.length
      )
        throw Error(
          JSON.stringify({
            scene,
            variant: world.variant,
            quaternionError,
            errors,
          }),
        );
      results.push({
        scene,
        variant: world.variant,
        bodyCount: world.gpu.bodyCount,
        jointCount: world.gpu.jointCount,
        params: { ...world.gpu.params },
        verifiedSteps: warmup + count,
        counters: world.counters,
        peakContacts: world.peakContacts,
        quaternionError,
        finite: true,
        rendering: false,
        sleeping: false,
        samples: world.samples,
        startup: world.startup,
        broadphase: world.gpu.broadphase,
        bvh: world.gpu.bvh ? { ...world.gpu.bvh.stats } : null,
        detailed: !!world.detailed,
        scheduling: {
          initial: world.initialScheduling,
          final: {
            colors: world.gpu.colorCap,
            rounds: world.gpu.colorRounds,
            primalLanes: [...world.gpu.primalLanes],
          },
        },
        details: world.detailed
          ? Object.fromEntries(
              Object.keys(world.samples[0].details).map((key) => [
                key,
                summarize(world.samples.map((p) => p.details[key])),
              ]),
            )
          : null,
        summary: Object.fromEntries(
          ["total", "collision", "adjacency", "coloring", "solve"].map(
            (key) => [key, summarize(world.samples.map((p) => p[key]))],
          ),
        ),
      });
    }
    const [before, after] = results;
    const pairedSavings = before.samples.map(
      (p, i) => 100 * (1 - after.samples[i].total / p.total),
    );
    const collisionChange =
      after.summary.collision.mean / before.summary.collision.mean - 1;
    const controlStage = variants.some((v) => v.startsWith("hploc"))
      ? "solve"
      : "collision";
    const controlChange =
      after.summary[controlStage].mean / before.summary[controlStage].mean - 1;
    return {
      scene,
      variants,
      warmup,
      count,
      results,
      pairedSavings: summarize(pairedSavings),
      saving: 100 * (1 - after.summary.total.mean / before.summary.total.mean),
      collisionChange,
      stableCollisionTiming: Math.abs(collisionChange) <= 0.1,
      controlStage,
      controlChange,
      stableControlTiming: Math.abs(controlChange) <= 0.1,
      method:
        "Two independent worlds, alternating execution order each fixed step; separate GPU phase timestamps, no drawing or sleeping. Every step checked for contact overflow and coloring conflicts.",
    };
  } finally {
    for (const { gpu } of worlds) gpu.destroy();
    await device.queue.onSubmittedWorkDone();
  }
}
