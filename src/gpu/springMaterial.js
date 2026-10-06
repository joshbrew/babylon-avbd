// Spring fracture is tensile: compression never tears the material. Zero GPU
// thresholds mean unbreakable, retaining the behavior of existing springs.
const materials = new WeakMap();
export function springMaterial(options = {}) {
  const result = {};
  for (const name of ["breakStrain", "breakForce"]) {
    const value = options[name] ?? Infinity;
    if (value !== Infinity && (!Number.isFinite(value) || value <= 0))
      throw Error(`${name} must be positive or Infinity`);
    result[name] = value;
  }
  return result;
}
export function setInitialSpringMaterial(force, options) {
  const material = springMaterial(options);
  if (
    Number.isFinite(material.breakStrain) ||
    Number.isFinite(material.breakForce)
  )
    materials.set(force, material);
  else materials.delete(force);
}
export const initialSpringMaterial = (force) => materials.get(force);

export function withSpringFracture(source) {
  const marker = "fn dualJoint(j: u32) {";
  if (source.split(marker).length !== 2)
    throw Error("Review spring fracture kernel integration");
  return source.replace(
    marker,
    `${marker}
  if (info[j].x == T_SPRING) {
    var material = joints[j];
    let strainLimit = material.lamLin.w;
    let forceLimit = material.lamAng.w;
    if (material.penLin.w > 0.0 && (strainLimit > 0.0 || forceLimit > 0.0)) {
      let a = info[j].y;
      let b = info[j].z;
      let lengthNow = length(anchorA(material,a) - (qrotate(bodies[b].rot,material.rB.xyz) + bodies[b].pos.xyz));
      let extension = max(0.0,lengthNow - material.rA.w);
      let strain = extension / max(material.rA.w,1.0e-6);
      let tension = material.penLin.w * extension;
      if ((strainLimit > 0.0 && material.rA.w > 1.0e-6 && strain > strainLimit) || (forceLimit > 0.0 && tension > forceLimit)) {
        material.penLin = vec4f(0.0);
        material.penAng = vec4f(0.0);
        material.lamLin = vec4f(vec3f(0.0),strainLimit);
        material.lamAng = vec4f(vec3f(0.0),forceLimit);
        joints[j] = material;
        return;
      }
    }
  }
`,
  );
}
