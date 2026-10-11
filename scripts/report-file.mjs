import { writeFile, rename, unlink } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";

let serial = 0;
const transient = new Set(["EPERM", "EBUSY", "EACCES", "UNKNOWN"]);
async function retry(action) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await action();
    } catch (error) {
      if (!transient.has(error.code) || attempt >= 5) throw error;
      await setTimeout(50 * 2 ** attempt);
    }
  }
}
// Leave the preceding report intact if a write fails. Windows scanners and
// viewers can briefly lock an otherwise writable report during long runs.
export async function writeAtomicFile(path, data, options) {
  if (path instanceof URL) path = fileURLToPath(path);
  const temporary = `${path}.${process.pid}.${++serial}.tmp`;
  try {
    await retry(() => writeFile(temporary, data, options));
    await retry(() => rename(temporary, path));
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}
export function writeReport(path, value) {
  return writeAtomicFile(path, JSON.stringify(value, null, 2));
}
