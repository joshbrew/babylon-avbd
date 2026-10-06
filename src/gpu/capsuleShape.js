import { Rigid } from "../../reference/three-avbd/src/avbd3d/ref/body.ts";
const capsules = new WeakSet();
export const isCapsule = (body) => capsules.has(body);
export function capsule(
  ref,
  radius,
  height,
  density = 1,
  friction = 0.6,
  position = [0, 0, 0],
) {
  if (
    !Number.isFinite(radius) ||
    radius <= 0 ||
    !Number.isFinite(height) ||
    height < 2 * radius
  )
    throw Error("Capsule height must be at least twice its positive radius");
  if (!Number.isFinite(density) || density < 0)
    throw Error("Capsule density must be nonnegative");
  const b = new Rigid(
    ref,
    [2 * radius, height, 2 * radius],
    density,
    friction,
    position,
  );
  const length = height - 2 * radius,
    cylinder = Math.PI * radius * radius * length * density,
    caps = (4 / 3) * Math.PI * radius ** 3 * density;
  b.mass = cylinder + caps;
  const axial = (cylinder * radius ** 2) / 2 + (caps * 2 * radius ** 2) / 5;
  const radial =
    cylinder * (length ** 2 / 12 + radius ** 2 / 4) +
    caps *
      ((2 * radius ** 2) / 5 + length ** 2 / 4 + (3 * length * radius) / 8);
  b.moment.set([radial, axial, radial]);
  b.radius = height / 2;
  capsules.add(b);
  return b;
}
