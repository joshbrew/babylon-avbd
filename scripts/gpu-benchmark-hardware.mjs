import { execFile } from "node:child_process";
import { promisify } from "node:util";

export async function gpuBenchmarkHardware(adapter) {
  if (process.platform !== "win32" || !adapter?.vendor) return {};
  try {
    const { stdout } = await promisify(execFile)(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "Get-CimInstance Win32_VideoController | Select-Object Name,DriverVersion | ConvertTo-Json -Compress",
      ],
      { windowsHide: true, timeout: 10000 },
    );
    const matches = [JSON.parse(stdout)]
      .flat()
      .filter((gpu) =>
        gpu.Name.toLowerCase().includes(adapter.vendor.toLowerCase()),
      );
    return matches.length === 1
      ? {
          hardware: matches[0].Name,
          driver: matches[0].DriverVersion,
          identification:
            "Current Windows GPU name uniquely matched to the WebGPU adapter vendor",
        }
      : {};
  } catch {
    return {};
  }
}
