import { spawn } from "child_process";
import fs from "fs";
import yaml from "js-yaml";

async function generateClashConfig(port: number, proxy: any) {
  const config = {} as any;
  config["log-level"] = "warning";
  config.port = port;
  config.mode = "rule";
  config["rules"] = [`MATCH,${proxy.name}`];
  config.proxies = [proxy];

  fs.mkdirSync(`clash/${port}`, { recursive: true });
  fs.writeFileSync(`clash/${port}/config.yaml`, yaml.dump(config));
}

export async function startClash(port: number, proxy: any) {
  await generateClashConfig(port, proxy);

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
