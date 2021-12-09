import { spawn } from "child_process";
import fs from "fs";
import { getSessionPassword } from "./common";

function generateClashConfig(port: number, sessionID: string) {
  const config = fs.readFileSync("packetstream/config.yaml", "utf8");

  const replacedConfig = config
    .replace('"${PORT}"', port.toString())
    .replace("${PROXY_HOST}", process.env.PROXY_HOST as string)
    .replace('"${PROXY_PORT}"', process.env.PROXY_PORT as string)
    .replace("${PROXY_USERNAME}", process.env.PROXY_USERNAME as string)
    .replace("${PROXY_PASSWORD}", getSessionPassword(sessionID));

  fs.mkdirSync(`clash/${port}`, { recursive: true });
  fs.writeFileSync(`clash/${port}/config.yaml`, replacedConfig);
}

export function startClash(port: number, sessionID: string) {
  generateClashConfig(port, sessionID);

  const childProcess = spawn(`clash.exe`, [`-d`, `clash/${port}`]);

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
