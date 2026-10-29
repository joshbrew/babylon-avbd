import { runNativeUpdatesExample } from "./native-updates.js";
console.log("CPU compatibility example—not a GPU benchmark.");
console.log(
  JSON.stringify(
    await runNativeUpdatesExample({ backend: "cpu", log: console.log }),
    null,
    2,
  ),
);
