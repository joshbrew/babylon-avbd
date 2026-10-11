import {
  contactsWGSL,
  contactsHullWGSL,
} from "../reference/three-avbd/src/avbd3d/gpu/wgsl-collision.ts";
import { contactsWGSL as contacts2D } from "../reference/three-avbd/src/avbd2d/gpu/wgsl-collision.ts";
import { wgslToGlsl } from "./wgsl-to-glsl.mjs";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";

// Translate the existing contact equations at build time. Shader parsing is
// never a runtime dependency of the solver or its published package.
export async function webglContactSources(dimension, { hulls = false } = {}) {
  if (dimension === 2) {
    const source =
      contacts2D + (await readFile("src/gpu/contacts2D.wgsl", "utf8"));
    const options = {
      flatStructArrays: { Collision: ["c"] },
      // Native hulls have at most 32 vertices. Stating the existing bound
      // avoids a driver treating texture-supplied counts as unbounded loops.
      loopLimits: {
        "collideShapes2D.k": 32,
        "support2D.k": 32,
        "facing2D.k": 32,
      },
      storage: {
        bodies: { read: (i) => `loadBody(uint(${i}))` },
        geometry: { read: (i) => `loadGeometry(uint(${i}))` },
      },
      prelude: "w_Body loadBody(uint i);vec4 loadGeometry(uint i);",
    };
    const boxBranch =
      "if(ga.x==0.&&gb.x==0.){return collideBoxes(A.pose.xyz,A.shape.xy*.5,B.pose.xyz,B.shape.xy*.5);}";
    if (!source.includes(boxBranch))
      throw Error("2D contact shader dispatch changed");
    const generic = source.slice(source.indexOf("fn collideShapes2D("));
    const tail = generic.slice(generic.indexOf(" if(best.gap>0.)"));
    if (!tail.startsWith(" if(best.gap>0.)"))
      throw Error("2D SAT contact assembly changed");
    const staged =
      source +
      `
      fn glAxis2D(a:u32,b:u32,k:u32)->Axis2D {
        var best=Axis2D(-3.4e38,vec2f(0.,1.));
        if(k==131u){consider2D(a,b,vec2f(0.,1.),&best);return best;}
        if(k==130u){if(!polygon2D(a)&&!polygon2D(b)){consider2D(a,b,closestSpines2D(spine2D(a),spine2D(b)),&best);}return best;}
        let side=k/65u;let u=k%65u;
        let i=select(a,b,side==1u);let j=select(b,a,side==1u);let g=geometry[i];
        if(polygon2D(i)){
          if(u<32u&&u<vertices2D(i)){consider2D(a,b,outward2D(edge2D(i,u)),&best);}
          if(u>=32u&&u<64u&&!polygon2D(j)&&u-32u<vertices2D(i)){
            let spine=spine2D(j);let v=vertex2D(i,u-32u);consider2D(a,b,v-nearest2D(spine.a,spine.b,v),&best);
          }
        }else if(u==64u&&g.x==2.&&g.z>0.){consider2D(a,b,rot(bodies[i].pose.z,vec2f(0.,1.)),&best);}
        return best;
      }
      fn glFinish2D(a:u32,b:u32,best:Axis2D)->Collision{var out:Collision;
      ${tail}
    `;
    return {
      glsl: {
        box: wgslToGlsl(source, { ...options, roots: ["collideBoxes"] }),
        axes: wgslToGlsl(staged, { ...options, roots: ["glAxis2D"] }),
        finish: wgslToGlsl(staged, {
          ...options,
          roots: ["glFinish2D", "planeContacts2D"],
        }),
      },
      wgsl: source,
    };
  }
  if (dimension !== 3) throw Error("WebGL contact math requires 2D or 3D");
  const built = await build({
    entryPoints: ["src/gpu/capsuleCollision.js"],
    bundle: true,
    write: false,
    format: "esm",
    loader: { ".wgsl": "text" },
  });
  const { withCapsuleContacts } = await import(
    `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
  );
  let source = withCapsuleContacts(hulls ? contactsHullWGSL : contactsWGSL);
  const narrow = source.slice(source.indexOf("fn narrowphase("));
  const start = narrow.indexOf("  let A = makeBox(a);"),
    stop = narrow.indexOf("  if (found.count == 0u)");
  if (start < 0 || stop < start)
    throw Error("3D contact shader dispatch changed");
  // Preserve production shape dispatch, including reversing capsule and sphere
  // pairs. The GL backend only supplies storage and output scheduling.
  source += `\nstruct GlCollision {found:Found, normal:vec3f}\nfn glCollision(a:u32,b:u32)->GlCollision{\n${narrow.slice(start, stop)}\nreturn GlCollision(found,-sat.n);\n}`;
  const options = {
    globals: ["params", ...(hulls ? ["BOX_FACE_VERTS", "BOX_EDGES"] : [])],
    flatStructArrays: { Found: ["feature", "xA", "xB"], Box: ["ax"] },
    storage: {
      bodies: { read: (i) => `loadBody(uint(${i}))` },
      ...(hulls ? { hulls: { read: (i) => `loadHull(uint(${i}))` } } : {}),
    },
    prelude:
      "w_Body loadBody(uint i);" + (hulls ? "uvec4 loadHull(uint i);" : ""),
    loopBounds: { "faceManifold.i": 8, "clipPlane.i": 8, "addFound.i": 8 },
    loopLimits: { "capSegmentBox.i": 8, "capSegmentBox.j": 8 },
  };
  const reverse = `sat.n=-sat.n;for(var k=0u;k<found.count;k++){let p=found.xA[k];found.xA[k]=found.xB[k];found.xB[k]=p;}`;
  const variants = {
    box: "found=collide(A,B,&sat);",
    spheres: "found=sphereSphere(A,B,&sat);",
    spherebox: `if(bodies[a].angVel.w==SHAPE_SPHERE){let h=sphereBox(A,B,bodies[b].rot);sat.n=h.n;if(h.hit){addFound(&found,h.onSphere,h.onBox,SPHERE_FEATURE);}}else{let h=sphereBox(B,A,bodies[a].rot);sat.n=-h.n;if(h.hit){addFound(&found,h.onBox,h.onSphere,SPHERE_FEATURE);}}`,
    caps: "found=capsuleCapsule(capsuleOf(a),capsuleOf(b),&sat);",
    capsphere: `if(bodies[a].angVel.w== -1.){found=capsuleSphere(capsuleOf(a),B.c,B.h.x,&sat);}else{found=capsuleSphere(capsuleOf(b),A.c,A.h.x,&sat);${reverse}}`,
    capbox: `if(bodies[a].angVel.w== -1.){found=capsuleBox(capsuleOf(a),B,bodies[b].rot,&sat);}else{found=capsuleBox(capsuleOf(b),A,bodies[a].rot,&sat);${reverse}}`,
    ...(hulls
      ? {
          poly: "found=collidePoly(polyOf(a),polyOf(b),&sat);",
          spherepoly: `if(bodies[a].angVel.w==SHAPE_SPHERE){let h=sphereHull(A.c,A.h.x,polyOf(b));sat.n=h.n;if(h.hit){addFound(&found,h.onSphere,h.onBox,SPHERE_FEATURE);}}else{let h=sphereHull(B.c,B.h.x,polyOf(a));sat.n=-h.n;if(h.hit){addFound(&found,h.onBox,h.onSphere,SPHERE_FEATURE);}}`,
          cappoly: `if(bodies[a].angVel.w== -1.){found=capsulePoly(capsuleOf(a),polyOf(b),&sat);}else{found=capsulePoly(capsuleOf(b),polyOf(a),&sat);${reverse}}`,
        }
      : {}),
  };
  const glsl = Object.fromEntries(
    Object.entries(variants).map(([variant, dispatch]) => {
      const code =
        source +
        `\nfn gl_${variant}(a:u32,b:u32)->GlCollision{let A=makeBox(a);let B=makeBox(b);var sat:Sat;var found:Found;${dispatch}return GlCollision(found,-sat.n);}`;
      return [
        variant,
        wgslToGlsl(code, {
          ...options,
          roots: [`gl_${variant}`, "qconj"],
        }).replace("uniform w_Params w_params;", "w_Params w_params;"),
      ];
    }),
  );
  return { glsl, wgsl: source };
}
