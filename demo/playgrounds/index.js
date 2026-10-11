import * as tornado from "../tornado-town/scene.js";
import * as domino from "../domino-spiral/scene.js";
import * as galton from "../galton-board/scene.js";

const modules = [tornado, domino, galton];
export const playScenes = modules.map((module) => module.scene);
export function buildPlayScene(def) {
  const module = modules.find((module) => module.scene.id === def.id);
  if (!module) throw Error(`Unknown playground: ${def.id}`);
  return module.buildScene(def);
}
