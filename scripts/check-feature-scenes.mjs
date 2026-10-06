import { browserCheck } from "./browser-check.mjs";
import { writeFile } from "node:fs/promises";
const browser = await browserCheck();
const results = [];
const assert = (condition, message) => {
  if (!condition) throw Error(message);
};
async function load(id) {
  await browser.navigate(`?demo=canonical&scene=${id}&backend=gpu&paused=1`);
  for (let i = 0; i < 400; i++) {
    if (await browser.evaluate("globalThis.__AVBD_LAB__?.diagnostics.ready"))
      return;
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  throw Error(`Scene did not initialize: ${id}`);
}
async function snapshot() {
  return browser.evaluate(
    "(async()=>{await __AVBD_LAB__.collect();return __AVBD_LAB__.snapshot();})()",
  );
}
function valid(s) {
  assert(
    s.poses.flat().every(Number.isFinite) &&
      !s.stats.overflow &&
      !s.stats.clashes &&
      !s.errors.length,
    JSON.stringify(s),
  );
}
function height(s, index) {
  return Array.isArray(s.poses[0])
    ? s.poses[index][1]
    : s.poses[index * 40 + 2];
}
function angle(s, index) {
  if (Array.isArray(s.poses[0])) return s.poses[index][2];
  const a = 2 * Math.atan2(s.poses[index * 40 + 5], s.poses[index * 40 + 7]);
  return Math.atan2(Math.sin(a), Math.cos(a));
}
try {
  for (const dimension of [2, 3]) {
    const id = `${dimension}d-limited-hinges`;
    await load(id);
    await browser.evaluate("__AVBD_LAB__.step(720)");
    const s = await snapshot();
    valid(s);
    const angles = s.features.arms.map((arm) => angle(s, arm.index));
    assert(
      s.features.arms.every(
        (arm, i) =>
          angles[i] >= arm.minAngle - 0.04 && angles[i] <= arm.maxAngle + 0.04,
      ),
      `${id}: powered arms exceed their stops`,
    );
    assert(
      angles[0] * angles[1] < -0.2,
      `${id}: opposite motors should press against opposite stops`,
    );
    await browser.evaluate(
      "document.querySelector('#lab-motor-reverse').click();__AVBD_LAB__.step(480)",
    );
    const reversed = await snapshot();
    valid(reversed);
    assert(
      reversed.features.arms.every(
        (arm, i) => angles[i] * angle(reversed, arm.index) < -0.2,
      ),
      `${id}: motors did not reverse`,
    );
    await browser.evaluate(
      "document.querySelector('#lab-motor-stop').click();__AVBD_LAB__.step(120)",
    );
    const stopped = await snapshot();
    valid(stopped);
    const before = angle(stopped, stopped.features.wheel);
    await browser.evaluate("__AVBD_LAB__.step(120)");
    const after = await snapshot();
    valid(after);
    assert(
      Math.abs(angle(after, after.features.wheel) - before) < 0.05,
      `${id}: powered wheel did not stop`,
    );
    await browser.screenshot(`test-results/screenshots/${id}.png`);
    results.push({
      scene: id,
      passed: true,
      angles,
      reversed: true,
      stopped: true,
    });
    console.log(`PASS ${id}: stops, reversal and braking`);
    const filters = `${dimension}d-triggers-and-masks`;
    await load(filters);
    await browser.evaluate("__AVBD_LAB__.step(720)");
    const base = await snapshot();
    valid(base);
    const lane = (s, name) =>
      s.features.lanes
        .find((l) => l.name === name)
        .indices.map((i) => height(s, i));
    assert(
      Math.min(...lane(base, "coral")) > 3.35 &&
        Math.min(...lane(base, "blue")) < 0.7 &&
        Math.min(...lane(base, "purple")) < 0.7,
      `${filters}: masking or trigger blocked the wrong lane`,
    );
    assert(
      base.features.entries.coral > 0 &&
        base.features.entries.blue >= 7 &&
        base.features.entries.purple === 0 &&
        base.features.maxSensorImpulse < 1e-6,
      `${filters}: trigger must report allowed overlaps without applying impulses: ${JSON.stringify(base.features)}`,
    );
    const shades = Object.values(base.features.contactColors);
    assert(
      shades.includes("shelf") && shades.includes("floor"),
      `${filters}: contact colors must show actual solid contacts`,
    );
    await browser.screenshot(`test-results/screenshots/${filters}.png`);
    const ray = await browser.evaluate("__AVBD_LAB__.queryFeature()");
    const cast = await browser.evaluate("__AVBD_LAB__.queryFeature(0.25)");
    const coral = base.features.lanes.find((l) => l.name === "coral").indices;
    assert(
      ray.hit &&
        cast.hit &&
        coral.includes(ray.hit.index) &&
        coral.includes(cast.hit.index) &&
        cast.hit.distance < ray.hit.distance,
      `${filters}: filtered ray and swept circle/sphere should hit coral bodies`,
    );
    await browser.evaluate(`__AVBD_LAB__.select('${filters}','gpu')`);
    await browser.evaluate(
      "document.querySelector('#lab-blue-shelf').click();__AVBD_LAB__.step(120)",
    );
    const masked = await snapshot();
    valid(masked);
    assert(
      masked.features.blueShelfEnabled &&
        Math.min(...lane(masked, "blue")) > 3.35 &&
        Math.min(...lane(masked, "purple")) < 2,
      `${filters}: live mask change must affect blue bodies, while purple bodies still require their own mask`,
    );
    await browser.evaluate(`__AVBD_LAB__.select('${filters}','gpu')`);
    await browser.evaluate(
      "document.querySelector('#lab-sensor-enabled').click();__AVBD_LAB__.step(720)",
    );
    const disabled = await snapshot();
    valid(disabled);
    assert(
      !disabled.features.sensorEnabled &&
        !disabled.features.blueShelfEnabled &&
        Object.values(disabled.features.entries).every(
          (count) => count === 0,
        ) &&
        Math.min(...lane(disabled, "blue")) < 0.7,
      `${filters}: disabling detection must not make the sensor solid`,
    );
    results.push({
      scene: filters,
      passed: true,
      entries: base.features.entries,
      maxSensorImpulse: base.features.maxSensorImpulse,
      queries: { ray, cast },
      maskChange: true,
      disabledDetection: true,
    });
    console.log(
      `PASS ${filters}: overlaps, zero impulse, mutual masks, live edits and reset`,
    );
  }
  assert(!browser.errors.length, browser.errors.join("\n"));
  await writeFile(
    "test-results/feature-scenes.json",
    JSON.stringify({ passed: true, results, errors: browser.errors }, null, 2),
  );
} finally {
  await browser.close();
}
