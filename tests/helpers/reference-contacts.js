import { collide } from "../../reference/three-avbd/src/avbd3d/ref/collide.ts";

// Narrowphase has no gravity axis: both engines receive identical world poses.
// Half extents in our ABI become full widths in the canonical ABI.
export function referenceBoxContact(a, b) {
  const convert = (spec) => ({
    positionLin: new Float64Array(spec.position),
    positionAng: new Float64Array(spec.orientation ?? [0, 0, 0, 1]),
    size: new Float64Array(spec.shape.map((half) => half * 2)),
  });
  const basis = new Float64Array(9);
  const contacts = collide(convert(a), convert(b), basis);
  return {
    hit: contacts.length > 0,
    normal: Array.from(basis.subarray(0, 3)),
    contacts,
  };
}

export function seededBoxPairs(count = 300) {
  let seed = 0x51a7b0d;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const box = () => {
    const axis = [random() - 0.5, random() - 0.5, random() - 0.5];
    const length = Math.hypot(...axis),
      angle = random() * Math.PI;
    return {
      kind: 1,
      shape: [
        0.08 + random() * 0.6,
        0.08 + random() * 0.6,
        0.08 + random() * 0.6,
      ],
      position: [
        (random() - 0.5) * 2,
        2 + (random() - 0.5) * 2,
        (random() - 0.5) * 2,
      ],
      orientation: [
        ...axis.map((x) => (x / length) * Math.sin(angle / 2)),
        Math.cos(angle / 2),
      ],
    };
  };
  // Round inputs exactly as they enter the GPU buffer before computing f64 truth.
  return Array.from({ length: count }, () =>
    [box(), box()].map((spec) => ({
      ...spec,
      shape: spec.shape.map(Math.fround),
      position: spec.position.map(Math.fround),
      orientation: spec.orientation.map(Math.fround),
    })),
  );
}
