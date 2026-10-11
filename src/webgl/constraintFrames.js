const source = `#version 300 es
precision highp float;precision highp int;precision highp sampler2D;precision highp usampler2D;
uniform sampler2D position,rotation,joints;uniform usampler2D jointInfo,commands;
uniform uint bodyWidth,jointWidth,infoWidth,commandWidth,outputWidth,jointCount;
ivec2 at(uint i,uint w){return ivec2(i%w,i/w);}
vec3 turn(vec4 q,vec3 v){vec3 t=2.*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
layout(location=0)out vec4 result;
void main(){uint i=uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth,j=i/8u,field=i%8u;result=texelFetch(joints,at(i,jointWidth),0);if(j>=jointCount)return;uint kind=texelFetch(commands,at(j,commandWidth),0).x;if(kind==0u)return;
 ivec4 info=ivec4(texelFetch(jointInfo,at(j,infoWidth),0));vec4 qa=info.y<0?vec4(0.,0.,0.,1.):texelFetch(rotation,at(uint(info.y),bodyWidth),0),qb=texelFetch(rotation,at(uint(info.z),bodyWidth),0);
 if(kind==1u){vec4 inv=vec4(-qa.xyz,qa.w),q=normalize(vec4(inv.w*qb.xyz+qb.w*inv.xyz+cross(inv.xyz,qb.xyz),inv.w*qb.w-dot(inv.xyz,qb.xyz)));if(field>=4u)result.w=q[int(field-4u)];}
 else if(field==6u){vec3 ra=texelFetch(joints,at(j*8u+6u,jointWidth),0).xyz,rb=texelFetch(joints,at(j*8u+7u,jointWidth),0).xyz;vec3 pa=info.y<0?ra:texelFetch(position,at(uint(info.y),bodyWidth),0).xyz+turn(qa,ra),pb=texelFetch(position,at(uint(info.z),bodyWidth),0).xyz+turn(qb,rb);result.w=length(pa-pb);}
}`;
export class GlConstraintFrames {
  constructor(compute) {
    this.compute = compute;
    this.program = compute.program(source);
  }
  capture(world, entries) {
    const c = this.compute,
      width = Math.min(
        c.maxTextureSize,
        Math.max(1, Math.ceil(Math.sqrt(world.jointCount))),
      ),
      height = Math.max(1, Math.ceil(world.jointCount / width)),
      data = new Uint32Array(width * height * 4);
    for (const { slot, spring } of entries) data[slot * 4] = spring ? 2 : 1;
    const commands = c.texture(width, height, true, data),
      i = world.inputs;
    try {
      c.dispatch(
        this.program,
        [world.spare.joints],
        {
          position: i.position,
          rotation: i.rotation,
          joints: i.joints,
          jointInfo: i.jointInfo,
          commands,
        },
        {
          bodyWidth: ["uniform1ui", world.broadphase.width],
          jointWidth: ["uniform1ui", i.joints.width],
          infoWidth: ["uniform1ui", i.jointInfo.width],
          commandWidth: ["uniform1ui", width],
          outputWidth: ["uniform1ui", world.spare.joints.width],
          jointCount: ["uniform1ui", world.jointCount],
        },
      );
      world.swap(["joints"]);
    } finally {
      c.release(commands);
    }
  }
  destroy() {
    this.compute.release(this.program);
  }
}
