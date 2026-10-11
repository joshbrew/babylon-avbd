import { uniformData, uploadUniform } from "./uniformUpload.js";
import {
  PARAM_WORDS as WORDS_2D,
  FLAG_VBD,
  FLAG_RESCALE,
  FLAG_POST_STABILIZE,
  FLAG_MATCH_NEAREST as NEAREST_2D,
} from "../../reference/three-avbd/src/avbd2d/gpu/layout.ts";
import {
  PARAM_WORDS as WORDS_3D,
  FLAG_MATCH_NEAREST as NEAREST_3D,
  FLAG_FACE_BIAS,
  FLAG_REUSE_CONTACTS,
  FLAG_START_AT_REST,
  FLAG_MASS_PENALTY,
} from "../../reference/three-avbd/src/avbd3d/gpu/layout.ts";

function prepare(s, words) {
  return (s.stepParamsCache ??= uniformData(words));
}
function topology(s, f, u) {
  const cap = s.bodyCapacity;
  u[7] = s.bodyCount;
  u[8] = s.jointCount;
  u[9] = s.colorCap;
  f[10] = s.cellSize;
  u[11] = s.tableSize - 1;
  f[12] = s.maxSmallRadius;
  u[13] = s.largeCount;
  u[14] = s.noCollideCount;
  u[15] = s.pairCapacity;
  u[16] = s.contactCapacity;
  u[17] = s.hashSize - 1;
  u[18] = cap + 1;
  u[19] = 2 * cap + 1;
  u[20] = s.tableSize + 1;
  u[21] = 2 * s.tableSize + 1;
  u[22] = 2 * s.tableSize + 1 + cap;
  u[23] = cap;
  u[24] = s.colorHistOffset;
  u[25] = 2 * cap;
  u[26] = s.colorGroups;
  u[27] = 2 * cap + 65;
  u[28] = s.colorRounds;
}
export function writeStepParams2D(alpha, postStabilize) {
  const cache = prepare(this, WORDS_2D),
    { f, u } = cache,
    p = this.params;
  f[0] = p.dt;
  f[1] = p.gravity;
  f[2] = p.beta;
  f[3] = p.gamma;
  f[4] = alpha;
  f[5] = p.vbdStiffness;
  u[6] =
    (p.vbd ? FLAG_VBD : 0) |
    (p.stiffnessRescale ? FLAG_RESCALE : 0) |
    (postStabilize ? FLAG_POST_STABILIZE : 0) |
    (p.matchNearest ? NEAREST_2D : 0);
  topology(this, f, u);
  uploadUniform(this.device, this.paramsBuffer, cache);
}
export function writeStepParams3D() {
  const cache = prepare(this, WORDS_3D),
    { f, u } = cache,
    p = this.params;
  f[0] = p.dt;
  f[1] = p.gravity;
  f[2] = p.betaLin;
  f[3] = p.betaAng;
  f[4] = p.gamma;
  f[5] = p.alpha;
  u[6] =
    (p.matchNearest ? NEAREST_3D : 0) |
    (p.faceBias ? FLAG_FACE_BIAS : 0) |
    (p.reuseContacts ? FLAG_REUSE_CONTACTS : 0) |
    (p.startAtRest ? FLAG_START_AT_REST : 0) |
    (p.massPenalty ? FLAG_MASS_PENALTY : 0);
  topology(this, f, u);
  u[29] = this.manifoldCapacity;
  u[30] = this.stepCount;
  const log2 = (x) => Math.min(31, Math.max(0, Math.round(Math.log2(x))));
  u[31] =
    log2(this.primalLanes[0]) |
    (log2(this.primalLanes[1]) << 8) |
    (log2(this.primalLanes[2]) << 16);
  f[32] = p.windSpeed * Math.cos(p.windAngle);
  f[33] = p.windSpeed * Math.sin(p.windAngle);
  f[34] = 0;
  f[35] = p.windPressure;
  f[36] = p.windGust;
  f[40] = p.up[0];
  f[41] = p.up[1];
  f[42] = p.up[2];
  f[43] = 0;
  uploadUniform(this.device, this.paramsBuffer, cache);
}
