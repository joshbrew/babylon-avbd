// Import the Babylon components used by the gallery and collision page.
// Their standard entry points retain the required runtime registrations.
import { RegisterRenderTargetTexture } from "@babylonjs/core/Materials/Textures/renderTargetTexture.pure.js";
// PCF shadows bind a depth sampler through Effect. Babylon's pure shadow
// imports do not register this method; its optional stub silently skips it.
RegisterRenderTargetTexture();
import "@babylonjs/core/Rendering/edgesRenderer.js";
export { Engine } from "@babylonjs/core/Engines/engine.js";
export { Scene } from "@babylonjs/core/scene.js";
export { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
export { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector.js";
export { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
export { Mesh } from "@babylonjs/core/Meshes/mesh.js";
export { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
export { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
export { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
export { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
export { DirectionalLight } from "@babylonjs/core/Lights/directionalLight.js";
export { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator.js";
export { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline.js";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder.js";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder.js";
import { CreateCapsule } from "@babylonjs/core/Meshes/Builders/capsuleBuilder.js";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder.js";
import { CreatePolyhedron } from "@babylonjs/core/Meshes/Builders/polyhedronBuilder.js";
export const MeshBuilder = {
  CreateBox,
  CreateSphere,
  CreateCapsule,
  CreateCylinder,
  CreatePolyhedron,
};
