import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import fs from 'fs'
import { chooseResidentialProxy } from "./common";

export const v2ray: {
  [port: number]: ChildProcessWithoutNullStreams;
} = {};

export async function generateV2rayConfig(port: number, state: string) {
  const sessionPassword = await chooseResidentialProxy(state);

  const config = fs.readFileSync("v2ray/config.json", "utf8");

  const replacedConfig = config
    .replace('"${PORT}"', port.toString())
    .replace("${PROXY_HOST}", process.env.PROXY_HOST as string)
    .replace('"${PROXY_PORT}"', process.env.PROXY_PORT as string)
    .replace("${PROXY_USERNAME}", process.env.PROXY_USERNAME as string)
    .replace("${PROXY_PASSWORD}", sessionPassword);

  fs.writeFileSync(`v2ray/config-${port}.json`, replacedConfig);
}

export function stopV2ray(port: number) {

}

export function startV2ray(port: number) {
  const childProcess = spawn(`v2ray/v2ray.exe`, [
    `-config=v2ray/config-${port}.json`,
  ]);
  v2ray[port] = childProcess;

  childProcess.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  childProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  childProcess.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
} 
