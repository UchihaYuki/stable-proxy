import { spawn } from "child_process";
import fs from 'fs'

export function startClash(port: number) {
  const childProcess = spawn(`clash.exe`, [
    `-f`,
    `tag/config/config-${port}.yml`,
  ]);

  childProcess.stdout.on("data", (data: Buffer) => {
    console.log(port, "clash", "stdout", data.toString());
  });

  childProcess.stderr.on("data", (data: Buffer) => {
    console.log(port, "clash", "stderr", data.toString());
  });

  childProcess.on("close", (code, signal) => {
    console.log(
      port,
      "clash",
      `Child process (pid:${childProcess.pid}) exited with code ${code} and signal ${signal}.`
    );
  });

  return childProcess;
}
