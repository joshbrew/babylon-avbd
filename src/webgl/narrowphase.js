export function contactFragment(dimension, math, variant = "all") {
  const common = `#version 300 es
precision highp float;precision highp int;
precision highp sampler2D;precision highp usampler2D;
uniform sampler2D poses,rotations,sizes,geometry,axes;
uniform usampler2D neighbors0,neighbors1,neighbors2,neighbors3,hulls;
uniform uint bodyCount,bodyCapacity,bodyWidth,outputWidth,neighborCapacity,geometryWidth,axisWidth,hullWidth;
layout(location=0) out vec4 normal;
layout(location=1) out vec4 anchorA;
layout(location=2) out vec4 anchorB;
layout(location=3) out uvec4 metadata;
ivec2 bodyAddress(uint i){return ivec2(i%bodyWidth,i/bodyWidth);}
vec4 loadGeometry(uint i){return texelFetch(geometry,ivec2(i%geometryWidth,i/geometryWidth),0);}
uvec4 loadHull(uint i){return texelFetch(hulls,ivec2(i%hullWidth,i/hullWidth),0);}
uint neighbor(uint body,uint index){
  uint page=index/15u,slot=index%15u+1u;
  ivec2 uv=bodyAddress(page*bodyCapacity+body);
  if(slot<4u)return texelFetch(neighbors0,uv,0)[int(slot)];
  if(slot<8u)return texelFetch(neighbors1,uv,0)[int(slot-4u)];
  if(slot<12u)return texelFetch(neighbors2,uv,0)[int(slot-8u)];
  return texelFetch(neighbors3,uv,0)[int(slot-12u)];
}
${math}
`;
  const load =
    dimension === 3
      ? `
w_Body loadBody(uint i){
  w_Body b=w_Body(vec4(0.),vec4(0.),vec4(0.),vec4(0.),vec4(0.),vec4(0.),vec4(0.),vec4(0.),vec4(0.),vec4(0.));
  ivec2 uv=bodyAddress(i);b.w_pos=texelFetch(poses,uv,0);b.w_rot=texelFetch(rotations,uv,0);b.w_size=texelFetch(sizes,uv,0);b.w_angVel.w=b.w_size.w;return b;
}`
      : `
w_Body loadBody(uint i){
  w_Body b=w_Body(vec4(0.),vec4(0.),vec4(0.),vec4(0.),vec4(0.),vec4(0.));
  ivec2 uv=bodyAddress(i);b.w_pose=texelFetch(poses,uv,0);b.w_shape=texelFetch(sizes,uv,0);return b;
}`;
  if (variant === "axes")
    return (
      common +
      load +
      `
void main(){
  normal=vec4(-3.4e38,0.,1.,0.);anchorA=vec4(0.);anchorB=vec4(0.);metadata=uvec4(0u);
  uint index=uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth;
  uint axis=index%132u,pair=index/132u,a=pair/neighborCapacity,k=pair%neighborCapacity;
  if(a>=bodyCount)return;
  uint encoded=neighbor(a,k);if(encoded==0u)return;uint b=encoded-1u;
  vec4 ga=loadGeometry(a),gb=loadGeometry(b);
  if((ga.x==0.&&gb.x==0.)||ga.x==3.||gb.x==3.)return;
  w_Axis2D hit=w_glAxis2D(a,b,axis);normal=vec4(hit.w_gap,hit.w_normal,0.);
}`
    );
  const collide =
    dimension === 3
      ? `
  w_params.w_flags=2u;
  ${
    variant === "all"
      ? ""
      : `float ka=loadBody(a).w_angVel.w,kb=loadBody(b).w_angVel.w;
  if(!(${{ box: "ka==0.&&kb==0.", spheres: "ka==1.&&kb==1.", spherebox: "(ka==1.&&kb==0.)||(ka==0.&&kb==1.)", caps: "ka== -1.&&kb== -1.", capsphere: "(ka== -1.&&kb==1.)||(ka==1.&&kb== -1.)", capbox: "(ka== -1.&&kb==0.)||(ka==0.&&kb== -1.)", poly: "(ka>=3.&&(kb==0.||kb>=3.))||(kb>=3.&&(ka==0.||ka>=3.))", spherepoly: "(ka==1.&&kb>=3.)||(kb==1.&&ka>=3.)", cappoly: "(ka== -1.&&kb>=3.)||(kb== -1.&&ka>=3.)" }[variant]}))discard;`
  }
  w_GlCollision hit=${variant === "all" ? "w_glCollision" : "w_gl_" + variant}(a,b);
  uint count=hit.w_found.w_count;
  if(point>=count)return;
  vec3 pa=get_w_Found_xA(hit.w_found,point),pb=get_w_Found_xB(hit.w_found,point);
  normal=vec4(hit.w_normal,float(count));
  anchorA=vec4(w_qrotate(w_qconj(loadBody(a).w_rot),pa-loadBody(a).w_pos.xyz),0.);
  anchorB=vec4(w_qrotate(w_qconj(loadBody(b).w_rot),pb-loadBody(b).w_pos.xyz),0.);
  metadata=uvec4(a,b,get_w_Found_feature(hit.w_found,point),count);
`
      : `
  ${variant === "all" ? "" : `bool boxes=loadGeometry(a).x==0.&&loadGeometry(b).x==0.;if(${variant === "box" ? "!boxes" : "boxes"})discard;`}
  ${
    variant === "finish"
      ? `
  w_Collision hit;
  if(loadGeometry(a).x==3.||loadGeometry(b).x==3.)hit=w_planeContacts2D(a,b);
  else{
    w_Axis2D best=w_Axis2D(-3.4e38,vec2(0.,1.));
    for(uint j=0u;j<131u;j++){
      uint address=pair*132u+j;vec4 test=texelFetch(axes,ivec2(address%axisWidth,address/axisWidth),0);
      if(test.x>best.w_gap+1.e-6)best=w_Axis2D(test.x,test.yz);
    }
    if(best.w_gap==-3.4e38){uint address=pair*132u+131u;vec4 test=texelFetch(axes,ivec2(address%axisWidth,address/axisWidth),0);best=w_Axis2D(test.x,test.yz);}
    hit=w_glFinish2D(a,b,best);
  }`
      : `w_Collision hit=${variant === "box" ? "w_collideBoxes(loadBody(a).w_pose.xyz,loadBody(a).w_shape.xy*.5,loadBody(b).w_pose.xyz,loadBody(b).w_shape.xy*.5)" : "w_collideShapes2D(a,b)"};`
  }
  uint count=hit.w_count;
  if(point>=count)return;
  w_ContactOut contact=get_w_Collision_c(hit,point);
  normal=vec4(contact.w_n,0.,float(count));
  anchorA=vec4(contact.w_rA,0.,0.);
  anchorB=vec4(contact.w_rB,0.,0.);
  metadata=uvec4(a,b,contact.w_feature,count);
`;
  return (
    common +
    load +
    `
void main(){
  normal=vec4(0.);anchorA=vec4(0.);anchorB=vec4(0.);metadata=uvec4(0u);
  uint index=uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth;
  uint point=index%${dimension === 3 ? 8 : 2}u,pair=index/${dimension === 3 ? 8 : 2}u;
  uint a=pair/neighborCapacity,k=pair%neighborCapacity;
  if(a>=bodyCount)return;
  uint encoded=neighbor(a,k);
  if(encoded==0u)return;
  uint b=encoded-1u;
  ${collide}
}`
  );
}

/** GPU contact-manifold evaluation over GPU broadphase adjacency.
 * Float local anchors and integer feature IDs remain in textures for solving.
 * 2D: boxes, circles, capsules, segments, planes and convex polygons.
 * 3D at this stage: boxes, spheres and analytic capsules.
 * Internal component; the complete WebGL2 solver is not exposed yet.
 */
export class GlNarrowphase {
  static create(compute, broadphase, options = {}) {
    const pipeline = new GlNarrowphase(compute, broadphase, options);
    try {
      pipeline.programs = [];
      const variants =
        typeof options.math === "string"
          ? [{ code: options.math, variant: "all" }]
          : Array.isArray(options.math)
            ? options.math
            : Object.entries(options.math).map(([variant, code]) => ({
                variant,
                code,
              }));
      for (const { code, variant } of variants) {
        options.onCompile?.(variant);
        const program = compute.program(
          contactFragment(options.dimension, code, variant),
        );
        pipeline.resources.push(program);
        pipeline.programs.push({ program, variant });
      }
      pipeline.ready = true;
      return pipeline;
    } catch (error) {
      pipeline.destroy();
      throw error;
    }
  }
  constructor(compute, broadphase, { dimension, math } = {}) {
    if (
      ![2, 3].includes(dimension) ||
      !math ||
      (typeof math !== "string" && typeof math !== "object")
    )
      throw Error(
        "Narrowphase requires generated contact math and a dimension",
      );
    this.compute = compute;
    this.broadphase = broadphase;
    this.contactsPerPair = dimension === 3 ? 8 : 2;
    this.slots =
      broadphase.bodyCount * broadphase.neighborCapacity * this.contactsPerPair;
    this.width = Math.min(
      compute.maxTextureSize,
      Math.max(1, Math.ceil(Math.sqrt(this.slots))),
    );
    this.height = Math.max(1, Math.ceil(this.slots / this.width));
    this.resources = [];
    try {
      this.outputs = Array.from({ length: 4 }, (_, i) => {
        const texture = compute.texture(this.width, this.height, i === 3);
        this.resources.push(texture);
        return texture;
      });
      if (dimension === 2 && math.axes) {
        const slots = broadphase.bodyCount * broadphase.neighborCapacity * 132;
        const width = Math.min(
          compute.maxTextureSize,
          Math.max(1, Math.ceil(Math.sqrt(slots))),
        );
        this.axes = compute.texture(
          width,
          Math.max(1, Math.ceil(slots / width)),
        );
        this.resources.push(this.axes);
      }
    } catch (error) {
      this.destroy();
      throw error;
    }
  }
  dispatch({ poses, rotations, sizes, geometry, hulls }) {
    if (this.destroyed) throw Error("WebGL2 narrowphase has been destroyed");
    if (!this.ready)
      throw Error("Await GlNarrowphase.create() before dispatching contacts");
    const c = this.compute,
      b = this.broadphase;
    for (const texture of [poses, rotations, sizes])
      if (
        !texture ||
        texture.integer ||
        texture.width !== b.width ||
        texture.height !== b.height
      )
        throw Error("Contact body textures have incompatible dimensions");
    if (!geometry || geometry.integer)
      throw Error("A float geometry texture is required");
    for (const { program, variant } of this.programs)
      c.dispatch(
        program,
        variant === "axes" ? [this.axes] : this.outputs,
        {
          poses,
          rotations,
          sizes,
          geometry,
          ...(hulls ? { hulls } : {}),
          ...Object.fromEntries(
            b.neighbors.map((t, i) => [`neighbors${i}`, t]),
          ),
          ...(variant === "finish" ? { axes: this.axes } : {}),
        },
        {
          bodyCount: ["uniform1ui", b.bodyCount],
          bodyCapacity: ["uniform1ui", b.capacity],
          bodyWidth: ["uniform1ui", b.width],
          outputWidth: [
            "uniform1ui",
            variant === "axes" ? this.axes.width : this.width,
          ],
          neighborCapacity: ["uniform1ui", b.neighborCapacity],
          geometryWidth: ["uniform1ui", geometry.width],
          axisWidth: ["uniform1ui", this.axes?.width ?? 1],
          hullWidth: ["uniform1ui", hulls?.width ?? 1],
        },
      );
    return this.outputs;
  }
  destroy() {
    if (this.destroyed) return;
    for (const r of this.resources) this.compute.release(r);
    this.resources.length = 0;
    this.destroyed = true;
  }
}
