// Some drivers need stronger boundaries between dependent compute dispatches.
// Keep this off the normal path. Dispatches still share one command buffer and
// submission, with identical bindings, arguments and timestamp phase ranges.
export function isolatedComputePass(encoder, descriptor = {}) {
  let pipeline,
    pending,
    first = true;
  const bindings = new Map();
  const flush = (last) => {
    if (!pending && !last) return;
    const stamps = descriptor.timestampWrites;
    const pass = encoder.beginComputePass({
      ...descriptor,
      timestampWrites:
        stamps && (first || last)
          ? {
              querySet: stamps.querySet,
              ...(first && stamps.beginningOfPassWriteIndex !== undefined
                ? {
                    beginningOfPassWriteIndex: stamps.beginningOfPassWriteIndex,
                  }
                : {}),
              ...(last && stamps.endOfPassWriteIndex !== undefined
                ? { endOfPassWriteIndex: stamps.endOfPassWriteIndex }
                : {}),
            }
          : undefined,
    });
    if (pending) {
      pass.setPipeline(pending.pipeline);
      for (const [index, args] of pending.bindings)
        pass.setBindGroup(index, ...args);
      pass[pending.method](...pending.args);
    }
    pass.end();
    pending = null;
    first = false;
  };
  const dispatch = (method, args) => {
    flush(false);
    pending = { pipeline, bindings: new Map(bindings), method, args };
  };
  return {
    setPipeline(value) {
      pipeline = value;
    },
    setBindGroup(index, group, offsets) {
      bindings.set(
        index,
        offsets === undefined ? [group] : [group, [...offsets]],
      );
    },
    dispatchWorkgroups(...args) {
      dispatch("dispatchWorkgroups", args);
    },
    dispatchWorkgroupsIndirect(...args) {
      dispatch("dispatchWorkgroupsIndirect", args);
    },
    end() {
      flush(true);
    },
  };
}
