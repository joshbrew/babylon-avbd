struct Body {
  position: vec4<f32>,
  velocity: vec4<f32>,
  shape: vec4<f32>,
  orientation: vec4<f32>,
  angularVelocity: vec4<f32>,
  flags: vec4<u32>,
}

struct Camera {
  viewProjection: mat4x4<f32>,
  eye: vec4<f32>,
  light: vec4<f32>,
}

@group(0) @binding(0) var<storage, read> bodies: array<Body>;
@group(0) @binding(1) var<uniform> camera: Camera;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @builtin(instance_index) instance: u32,
}

struct VertexOutput {
  @builtin(position) clip: vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) worldPosition: vec3<f32>,
  @location(2) speed: f32,
  @location(3) awake: f32,
}

override BODY_OFFSET: u32 = 1u;
override PRE_SCALED: u32 = 0u;

fn quatRotate(q: vec4<f32>, value: vec3<f32>) -> vec3<f32> {
  let t = 2.0 * cross(q.xyz, value);
  return value + q.w * t + cross(q.xyz, t);
}

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  let body = bodies[input.instance + BODY_OFFSET];
  let local = select(input.position * body.shape.xyz, input.position, PRE_SCALED != 0u);
  let world = body.position.xyz + quatRotate(body.orientation, local);
  var output: VertexOutput;
  output.clip = camera.viewProjection * vec4<f32>(world, 1.0);
  output.normal = quatRotate(body.orientation, input.normal);
  output.worldPosition = world;
  output.speed = length(body.velocity.xyz);
  output.awake = f32(body.flags.y);
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let lightDirection = normalize(camera.light.xyz - input.worldPosition);
  let diffuse = 0.25 + 0.75 * max(0.0, dot(normalize(input.normal), lightDirection));
  let brick = vec3<f32>(0.55, 0.20, 0.105);
  let moving = vec3<f32>(1.0, 0.47, 0.16);
  let cannon = vec3<f32>(0.10, 0.13, 0.18);
  let bodyColor = select(mix(brick, moving, clamp(input.speed * 0.08, 0.0, 0.8)), cannon, BODY_OFFSET == 0u);
  return vec4<f32>(bodyColor * diffuse, 1.0);
}
