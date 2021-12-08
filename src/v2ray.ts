import { spawn } from "child_process";
import fs from "fs";
import { getSessionPassword } from "./common";

function generateV2rayConfig(port: number, sessionID: string) {
  const config = fs.readFileSync("v2ray/config.json", "utf8");

  const replacedConfig = config
    .replace('"${PORT}"', port.toString())
    .replace("${PROXY_HOST}", process.env.PROXY_HOST as string)
    .replace('"${PROXY_PORT}"', process.env.PROXY_PORT as string)
    .replace("${PROXY_USERNAME}", process.env.PROXY_USERNAME as string)
    .replace("${PROXY_PASSWORD}", getSessionPassword(sessionID));

  fs.writeFileSync(`v2ray/config-${port}.json`, replacedConfig);
}

export function startV2ray(port: number, sessionID: string) {
  generateV2rayConfig(port, sessionID)

  const childProcess = spawn(`v2ray/v2ray.exe`, [
    `-config=v2ray/config-${port}.json`,
  ]);

  childProcess.stdout.on("data", (data) => {
    console.log(`${port} - v2ray: stdin: ${data}`);
  });

  childProcess.stderr.on("data", (data) => {
    console.error(`${port} - v2ray: stderr: ${data}`);
  });

  childProcess.on("close", (code, signal) => {
    console.log(`${port} - v2ray: child process (${childProcess.pid}) exited with code ${code} and signal ${signal}`);
  });

  return childProcess
}
