import { Engine } from "@babylonjs/core/Engines/engine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import {
  Vector3,
  Quaternion,
  Matrix,
} from "@babylonjs/core/Maths/math.vector.js";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import "@babylonjs/core/Meshes/thinInstanceMesh.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import {
  hullOf,
  isSphere,
} from "../../../reference/three-avbd/src/avbd3d/shapes.ts";
import { isCapsule } from "../../../src/gpu/capsuleShape.js";
import {
  visualOf,
  clothsOf,
  ropesOf,
  RING,
} from "../../../reference/three-avbd/src/avbd3d/visuals.ts";
import { chainRingScales } from "../geometry/ringGeometry.js";
import { terrainSurfaceOf } from "../../terrain/visual.js";
import { tearableClothsOf } from "../../tearable-cloth/topology.js";
import {
  Joint,
  Spring,
} from "../../../reference/three-avbd/src/avbd3d/ref/forces.ts";
import {
  transform,
  vec3,
} from "../../../reference/three-avbd/src/avbd3d/ref/math.ts";

const renderPoint = (p) => new Vector3(p[0], p[2], p[1]);

// Demo-only renderer for the portable CPU execution backend.
// Thin instances share geometry; pose uploads count as drawing, not physics.
export class CpuRenderer3D {
  constructor(canvas, solver, { enhanced = true } = {}) {
    this.kind = "webgl";
    this.canvas = canvas;
    this.solver = solver;
    this.engine = new Engine(canvas, enhanced, { adaptToDeviceRatio: false });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.91, 0.92, 0.94, 1);
    this.camera = new ArcRotateCamera(
      "CPU view",
      -1.9,
      1.25,
      20,
      Vector3.Zero(),
      this.scene,
    );
    this.camera.minZ = 0.05;
    this.camera.lowerRadiusLimit = 2;
    this.camera.wheelDeltaPercentage = 0.01;
    this.camera.attachControl(canvas, true);
    new HemisphericLight("CPU light", new Vector3(0.4, 1, -0.3), this.scene);
    this.mesh = MeshBuilder.CreateBox("CPU bodies", { size: 1 }, this.scene);
    this.mesh.alwaysSelectAsActiveMesh = true;
    this.mesh.thinInstanceEnablePicking = true;
    const material = new StandardMaterial("CPU body material", this.scene);
    material.diffuseColor = Color3.White();
    material.specularColor = new Color3(0.12, 0.12, 0.12);
    this.mesh.material = material;
    this.material = material;
    this.forces = solver.forces.slice();
    const visualSource = solver.visualSource ?? solver;
    this.ringScales = chainRingScales(visualSource, visualOf, RING);
    // Rope links are hidden collision proxies in the scene metadata. Draw
    // their rounded rods, using the same local axis and dimensions as WebGPU.
    this.ropeStyles = new Map();
    for (const rope of ropesOf(visualSource))
      for (const body of rope.links)
        this.ropeStyles.set(body, { shape: "capsule", color: rope.color });
    this.visuals = { ringScales: this.ringScales };
    this.special = new Map();
    this.shapeGroups = new Map();
    this.matrices = new Float32Array(Math.max(1, solver.bodies.length) * 16);
    const colors = new Float32Array(Math.max(1, solver.bodies.length) * 4);
    solver.bodies.forEach((body, i) => {
      const paint = visualOf(visualSource.bodies[i])?.color;
      const color =
        paint !== undefined
          ? Color3.FromInts(
              (paint >> 16) & 255,
              (paint >> 8) & 255,
              paint & 255,
            )
          : body.mass > 0
            ? Color3.FromHSV((i * 37) % 360, 0.35, 0.8)
            : new Color3(0.65, 0.66, 0.68);
      colors.set([color.r, color.g, color.b, 1], i * 4);
    });
    this.mesh.thinInstanceSetBuffer("matrix", this.matrices, 16, false);
    this.mesh.thinInstanceSetBuffer("color", colors, 4, true);
    this.colors = colors;
    solver.bodies.forEach((b, i) => this.replaceShape(i, b));
    this.clothFaces = [];
    const tears = tearableClothsOf(visualSource);
    if (tears.length)
      for (const sheet of tears)
        for (const t of sheet.triangles)
          this.clothFaces.push({
            ...t,
            rest: t.bodies.map((b) => Array.from(b.positionLin)),
          });
    else
      for (const grid of clothsOf(visualSource))
        for (let x = 0; x < grid.length - 1; x++)
          for (let y = 0; y < grid[x].length - 1; y++)
            for (const bodies of [
              [grid[x][y], grid[x + 1][y], grid[x][y + 1]],
              [grid[x + 1][y], grid[x + 1][y + 1], grid[x][y + 1]],
            ])
              this.clothFaces.push({
                bodies,
                bonds: [],
                rest: bodies.map((b) => Array.from(b.positionLin)),
              });
    if (this.clothFaces.length) {
      this.fabric = new Mesh("CPU fabric", this.scene);
      const fabricMaterial = material.clone("CPU fabric material");
      fabricMaterial.backFaceCulling = false;
      fabricMaterial.diffuseColor = new Color3(0.35, 0.56, 0.68);
      this.fabric.material = fabricMaterial;
      this.fabric.alwaysSelectAsActiveMesh = true;
      this.fabric.isPickable = false;
    }
    this.mesh.setEnabled(solver.bodies.length > 0);
    this.renderStats = {
      renderer: "webgl",
      poseDownloads: 0,
      matrixUpdates: 0,
      cpuSubmitMs: 0,
    };
    this.fit();
    this.onDown = (event) => {
      if (event.button !== 0 || event.altKey) return;
      const hit = this.scene.pick(
        this.scene.pointerX,
        this.scene.pointerY,
        (m) =>
          m === this.mesh ||
          [...this.special.values()].some((s) => s.mesh && s.mesh === m),
      );
      const bodyIndex =
        hit?.pickedMesh === this.mesh
          ? hit.thinInstanceIndex
          : [...this.special.values()].find(
              (s) =>
                s.mesh === hit?.pickedMesh &&
                s.instanceIndex === hit?.thinInstanceIndex,
            )?.index;
      const body = solver.bodies[bodyIndex];
      if (!hit?.hit || !body || body.mass <= 0) return;
      const world = [hit.pickedPoint.x, hit.pickedPoint.z, hit.pickedPoint.y];
      const ray = this.scene.createPickingRay(
        this.scene.pointerX,
        this.scene.pointerY,
        Matrix.Identity(),
        this.camera,
      );
      const q = new Quaternion(
        -body.positionAng[0],
        -body.positionAng[2],
        -body.positionAng[1],
        body.positionAng[3],
      );
      const local = Vector3.TransformCoordinates(
        hit.pickedPoint,
        Matrix.Compose(
          Vector3.One(),
          q,
          renderPoint(body.positionLin),
        ).invert(),
      );
      const anchor = [local.x, local.z, local.y];
      this.drag = {
        joint: solver.nativeWorld
          ? solver.nativeWorld.createDrag(body, anchor, world)
          : new Joint(solver, null, body, world, anchor, 1000, 0),
        distance: Vector3.Distance(ray.origin, hit.pickedPoint),
      };
      this.camera.detachControl();
      canvas.setPointerCapture(event.pointerId);
    };
    this.onMove = () => {
      if (!this.drag) return;
      const ray = this.scene.createPickingRay(
        this.scene.pointerX,
        this.scene.pointerY,
        Matrix.Identity(),
        this.camera,
      );
      const p = ray.origin.add(ray.direction.scale(this.drag.distance));
      if (this.drag.joint.move) this.drag.joint.move([p.x, p.z, p.y]);
      else this.drag.joint.rA.set([p.x, p.z, p.y]);
    };
    this.onUp = () => {
      this.drag?.joint.destroy();
      this.drag = null;
      if (!this.disposed) this.camera.attachControl(canvas, true);
    };
    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointermove", this.onMove);
    canvas.addEventListener("pointerup", this.onUp);
    canvas.addEventListener("pointercancel", this.onUp);
  }
  fit() {
    const bodies = this.solver.bodies.filter(
      (b) => b.mass > 0 || Math.max(...b.size) < 60,
    );
    const lo = [Infinity, Infinity, 0],
      hi = [-Infinity, -Infinity, 0];
    for (const b of bodies)
      for (let a = 0; a < 3; a++) {
        lo[a] = Math.min(lo[a], b.positionLin[a] - b.radius);
        hi[a] = Math.max(hi[a], b.positionLin[a] + b.radius);
      }
    if (!bodies.length) {
      lo.splice(0, 3, -5, -5, 0);
      hi.splice(0, 3, 5, 5, 5);
    }
    this.camera.setTarget(renderPoint(lo.map((v, a) => (v + hi[a]) / 2)));
    this.camera.radius = Math.max(
      12,
      Math.hypot(...hi.map((v, a) => v - lo[a])) * 1.2,
    );
    this.camera.maxZ = Math.max(500, this.camera.radius * 5);
  }
  setCamera({ distance, target, azimuth, elevation }) {
    if (distance !== undefined) this.camera.radius = distance;
    if (target) this.camera.setTarget(renderPoint(target));
    if (azimuth !== undefined) this.camera.alpha = (azimuth * Math.PI) / 180;
    if (elevation !== undefined) this.camera.beta = Math.PI / 2 - elevation;
  }
  updateJointVisibility() {}
  updateContacts() {}
  setColor(index, rgba) {
    this.colors.set(rgba, index * 4);
    this.mesh.thinInstanceSetBuffer("color", this.colors, 4, true);
    const s = this.special.get(index);
    if (s?.group) {
      s.color = Array.from(rgba);
      s.group.dirty = true;
    }
  }
  replaceShape(index, body) {
    const previous = this.special.get(index);
    if (previous?.group) {
      previous.group.indices.delete(index);
      previous.group.dirty = true;
    }
    this.special.delete(index);
    const source = this.solver.visualSource?.bodies[index] ?? body;
    const surface = terrainSurfaceOf(source);
    const shape = hullOf(body),
      visual = this.ropeStyles.get(body) ?? visualOf(source),
      hidden = surface ? !!surface.hidden : visual?.shape === "hidden";
    let mesh;
    if (hidden) {
      this.special.set(index, { hidden: true, index });
      return;
    }
    // Bodies share geometry and thin-instance draws. Spheres and rings use a
    // uniform instance scale; capsule proportions and hull vertices stay exact.
    const ring = visual?.shape?.startsWith("ring");
    const instanceScale = isSphere(body)
      ? body.size[0]
      : ring
        ? body.size[0] * (this.ringScales.get(body) ?? 1)
        : 1;
    const key = surface?.vertices
      ? `terrain:${index}`
      : isSphere(body)
        ? "sphere"
        : ring
          ? visual.shape
          : isCapsule(body) || visual?.shape === "capsule"
            ? `capsule:${isCapsule(body)}:${Array.from(body.size)}`
            : shape
              ? `hull:${Array.from(shape.vertices)}:${shape.faces.map((f) => f.verts.join(",")).join(";")}`
              : null;
    const color =
      visual?.color === undefined
        ? Array.from(this.colors.subarray(index * 4, index * 4 + 4))
        : [
            ((visual.color >> 16) & 255) / 255,
            ((visual.color >> 8) & 255) / 255,
            (visual.color & 255) / 255,
            1,
          ];
    const register = (group) => {
      group.indices.add(index);
      group.dirty = true;
      this.special.set(index, {
        index,
        group,
        mesh: group.mesh,
        color,
        scale: instanceScale,
      });
    };
    if (key && this.shapeGroups.has(key)) {
      register(this.shapeGroups.get(key));
      return;
    }
    if (surface?.vertices) {
      mesh = new Mesh(`CPU terrain ${index}`, this.scene);
      const data = new VertexData(),
        positions = [],
        normals = [],
        indices = [];
      for (let i = 0; i < surface.vertices.length; i += 6) {
        const v = surface.vertices;
        positions.push(v[i], v[i + 2], v[i + 1]);
        normals.push(v[i + 3], v[i + 5], v[i + 4]);
      }
      for (let i = 0; i < positions.length / 3; i += 3)
        indices.push(i, i + 1, i + 2);
      Object.assign(data, { positions, normals, indices });
      data.applyToMesh(mesh);
    } else if (isSphere(body))
      mesh = MeshBuilder.CreateSphere(
        `CPU sphere ${index}`,
        { diameter: 1, segments: 16 },
        this.scene,
      );
    else if (visual?.shape?.startsWith("ring")) {
      const radius = visual.shape === "ringFlat" ? RING.flat : RING.link;
      mesh = MeshBuilder.CreateTorus(
        `CPU ring ${index}`,
        {
          diameter: radius * 2,
          thickness: RING.wire * 2,
          tessellation: 24,
        },
        this.scene,
      );
      if (visual.shape === "ringX")
        mesh.bakeTransformIntoVertices(Matrix.RotationX(Math.PI / 2));
      else if (visual.shape === "ringY")
        mesh.bakeTransformIntoVertices(Matrix.RotationZ(Math.PI / 2));
    } else if (isCapsule(body) || visual?.shape === "capsule") {
      const analytic = isCapsule(body);
      const radius = analytic
        ? body.size[0] / 2
        : Math.min(body.size[1], body.size[2]) / 2;
      mesh = MeshBuilder.CreateCapsule(
        `CPU capsule ${index}`,
        {
          radius,
          height: Math.max(2 * radius, body.size[analytic ? 1 : 0]),
          tessellation: 12,
          subdivisions: 1,
        },
        this.scene,
      );
      mesh.bakeTransformIntoVertices(
        analytic
          ? Matrix.RotationX(Math.PI / 2)
          : Matrix.RotationZ(Math.PI / 2),
      );
    } else if (shape) {
      mesh = new Mesh(`CPU hull ${index}`, this.scene);
      const data = new VertexData(),
        positions = [],
        indices = [];
      for (const f of shape.faces)
        for (let k = 1; k < f.verts.length - 1; k++)
          for (const i of [f.verts[0], f.verts[k + 1], f.verts[k]]) {
            positions.push(
              shape.vertices[i * 3],
              shape.vertices[i * 3 + 2],
              shape.vertices[i * 3 + 1],
            );
            indices.push(indices.length);
          }
      data.positions = positions;
      data.indices = indices;
      data.normals = [];
      VertexData.ComputeNormals(positions, indices, data.normals);
      data.applyToMesh(mesh);
    }
    if (mesh) {
      mesh.material = this.material;
      mesh.alwaysSelectAsActiveMesh = true;
      mesh.thinInstanceEnablePicking = true;
      const group = { mesh, indices: new Set(), dirty: true };
      this.shapeGroups.set(key, group);
      register(group);
    }
  }
  drawFabric() {
    if (!this.fabric) return;
    const positions = [];
    for (const t of this.clothFaces) {
      if (!t.bonds.length || t.bonds.every((b) => !b.broken)) {
        for (const b of t.bodies) {
          const p = b.positionLin;
          positions.push(p[0], p[2], p[1]);
        }
        continue;
      }
      // A torn face keeps a finite material patch at each live point. Broken
      // edges use the original local offset; fragments never expire.
      for (let c = 0; c < 3; c++) {
        const next = (c + 1) % 3,
          prev = (c + 2) % 3,
          base = t.bodies[c].positionLin;
        const edge = (k) => {
          const bond = t.bonds.find(
            (b) =>
              (b.bodyA === t.bodies[c] && b.bodyB === t.bodies[k]) ||
              (b.bodyB === t.bodies[c] && b.bodyA === t.bodies[k]),
          );
          return bond && !bond.broken
            ? Array.from(t.bodies[k].positionLin, (v, i) => v - base[i])
            : t.rest[k].map((v, i) => v - t.rest[c][i]);
        };
        const a = edge(next),
          b = edge(prev),
          mid = a.map((v, i) => base[i] + (v + b[i]) / 3),
          u = a.map((v, i) => base[i] + v / 2),
          v = b.map((v, i) => base[i] + v / 2);
        for (const p of [base, u, mid, base, mid, v])
          positions.push(p[0], p[2], p[1]);
      }
    }
    const indices = Array.from({ length: positions.length / 3 }, (_, i) => i),
      normals = [];
    VertexData.ComputeNormals(positions, indices, normals);
    const data = new VertexData();
    data.positions = positions;
    data.normals = normals;
    data.indices = indices;
    data.applyToMesh(this.fabric, true);
  }
  draw(debug = true) {
    const start = performance.now();
    this.engine.resize();
    for (const group of this.shapeGroups.values()) {
      if (!group.dirty) continue;
      group.mesh.setEnabled(group.indices.size > 0);
      if (group.indices.size) {
        group.matrices = new Float32Array(group.indices.size * 16);
        const colors = new Float32Array(group.indices.size * 4);
        let slot = 0;
        for (const index of group.indices) {
          const entry = this.special.get(index);
          entry.instanceIndex = slot;
          colors.set(entry.color, slot++ * 4);
        }
        group.mesh.thinInstanceSetBuffer("matrix", group.matrices, 16, false);
        group.mesh.thinInstanceSetBuffer("color", colors, 4, true);
      }
      group.dirty = false;
    }
    this.solver.bodies.forEach((body, i) => {
      const q = body.positionAng;
      const special = this.special.get(i);
      Matrix.Compose(
        special
          ? Vector3.Zero()
          : new Vector3(body.size[0], body.size[2], body.size[1]),
        new Quaternion(-q[0], -q[2], -q[1], q[3]),
        renderPoint(body.positionLin),
      ).copyToArray(this.matrices, i * 16);
      if (special?.group) {
        Matrix.Compose(
          new Vector3(special.scale, special.scale, special.scale),
          new Quaternion(-q[0], -q[2], -q[1], q[3]),
          renderPoint(body.positionLin),
        ).copyToArray(special.group.matrices, special.instanceIndex * 16);
      }
    });
    this.mesh.thinInstanceBufferUpdated("matrix");
    this.mesh.thinInstanceRefreshBoundingInfo();
    for (const group of this.shapeGroups.values())
      if (group.indices.size) {
        group.mesh.thinInstanceBufferUpdated("matrix");
        group.mesh.thinInstanceRefreshBoundingInfo();
      }
    this.renderStats.matrixUpdates = this.solver.bodies.length;
    this.renderStats.shapeDrawCalls = [...this.shapeGroups.values()].filter(
      (group) => group.indices.size > 0,
    ).length;
    this.drawFabric();
    // Rebuild debug geometry only when enabled. Contacts and broken bonds come
    // from the live CPU solver, including newly created mouse constraints.
    this.lines?.dispose();
    this.lines = null;
    if (debug) {
      const lines = [];
      for (const f of this.solver.forces) {
        if ((f instanceof Joint || f instanceof Spring) && !f.broken) {
          const a = f.bodyA
            ? transform(vec3(), f.bodyA.positionLin, f.bodyA.positionAng, f.rA)
            : f.rA;
          const b = transform(
            vec3(),
            f.bodyB.positionLin,
            f.bodyB.positionAng,
            f.rB,
          );
          lines.push([renderPoint(a), renderPoint(b)]);
        }
        if (f.contacts)
          for (const c of f.contacts) {
            const p = renderPoint(
              transform(vec3(), f.bodyA.positionLin, f.bodyA.positionAng, c.rA),
            );
            lines.push([
              p.subtract(new Vector3(0.035, 0, 0)),
              p.add(new Vector3(0.035, 0, 0)),
            ]);
          }
      }
      if (lines.length) {
        this.lines = MeshBuilder.CreateLineSystem(
          "CPU constraints and contacts",
          { lines },
          this.scene,
        );
        this.lines.color = new Color3(0.45, 0.25, 0.2);
        this.lines.isPickable = false;
      }
    }
    this.scene.render();
    this.renderStats.cpuSubmitMs = performance.now() - start;
  }
  dispose() {
    this.disposed = true;
    this.onUp();
    for (const [name, handler] of [
      ["pointerdown", this.onDown],
      ["pointermove", this.onMove],
      ["pointerup", this.onUp],
      ["pointercancel", this.onUp],
    ])
      this.canvas.removeEventListener(name, handler);
    this.scene.dispose();
    this.engine.dispose();
  }
}
