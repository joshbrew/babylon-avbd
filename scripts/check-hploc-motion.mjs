// Six simulated seconds through impact, settling and periodic tree rebuilds.
process.env.AVBD_MOTION_BROADPHASE = "hploc";
process.env.AVBD_MOTION_SCENES = [
  "3d-mixed-sizes-10k",
  "3d-mixed-sizes-50k",
  "showcase-brick-ring-110k",
  "showcase-box-columns-100k",
  "paper-walls-510k-4",
].join(",");
await import("./check-paper-scenes.mjs");
