# GPU regression fixtures

These five files are used by active GPU tests: `avbd.js`, `avbd.wgsl`,
`gpuStressDemo.js`, `gpuStress.wgsl` and `gpuStressRender.wgsl`.
They provide independent checks for broadphase, contacts, rotation, friction,
stacks and local impacts. They are excluded from the library and app routes.
The public app uses `src/gpu/` and `src/babylon/`.
