struct Body {pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f}
struct Settings {outletHeight:f32,opened:u32,count:u32,bins:u32}
@group(0) @binding(0) var<storage,read_write> bodies:array<Body>;
// xyz: initial hopper position, w: negative for scenery, zero for marbles.
@group(0) @binding(1) var<storage,read> feed:array<vec4f>;
@group(0) @binding(2) var<storage,read_write> filters:array<vec2u>;
@group(0) @binding(3) var<uniform> settings:Settings;
@compute @workgroup_size(64) fn holdAndRelease(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=settings.count){return;}
 let f=feed[i];if(f.w<0. || filters[i].y!=0u){return;}
 if(settings.opened!=0u){filters[i]=vec2u(1u,1u);return;}
 var b=bodies[i];
 var position=f.xyz;
 b.pos=vec4f(position,b.pos.w);
 b.initialPos=vec4f(position,b.initialPos.w);
 b.inertialPos=vec4f(position,b.inertialPos.w);
 b.velocity=vec4f(0.);b.angular=vec4f(0.);
 bodies[i]=b;
}

@group(0) @binding(4) var<storage,read_write> counts:array<atomic<u32>>;
@compute @workgroup_size(64) fn histogram(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=settings.count || feed[i].w<0.){return;}
 let p=bodies[i].pos.xyz;
 if(filters[i].y==0u || p.z>=settings.outletHeight){atomicAdd(&counts[settings.bins+1u],1u);return;}
 atomicAdd(&counts[settings.bins],1u);
 if(p.z>=7.5){return;}
 let bin=i32(floor((p.x+f32(settings.bins)*.52)/1.04));
 if(bin>=0 && bin<i32(settings.bins)){atomicAdd(&counts[u32(bin)],1u);}
 else {atomicAdd(&counts[settings.bins+2u],1u);}
}
