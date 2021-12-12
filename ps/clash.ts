import { spawn } from "child_process";
import fs from "fs";
import { getSessionPassword } from "./common";
import yaml from "js-yaml";
import got from "got";
import { getTransits } from "./tag";

async function generateClashConfig(port: number, sessionID: string) {
  const config = {} as any;
  config["log-level"] = "warning";
  config.port = port;
  config.mode = "rule";
  config.proxies = [
    {
      name: "ps",
      type: "http",
      server: process.env.PS_PROXY_HOST,
      port: parseInt(process.env.PS_PROXY_PORT as string),
      username: process.env.PS_PROXY_USERNAME,
      password: getSessionPassword(sessionID),
      tls: process.env.PS_PROXY_TLS == "true",
    },
  ];

  if (process.env.PS_TRANSIT == "true") {
    const transits = await getTransits();
    config.proxies = config.proxies.concat((transits));
    config["proxy-groups"] = [
      {
        name: "transits",
        proxies: transits.map((t) => t.name),
        type: "url-test",
        url: "http://www.gstatic.com/generate_204",
        interval: 300,
      },
      {
        name: "relay",
        type: "relay",
        proxies: [
          "transits",
          "ps"
        ]
      },
    ];
    config["rules"] = [`MATCH,relay`];
  } else {
    config["rules"] = [`MATCH,ps`];
  }

  fs.mkdirSync(`clash/${port}`, { recursive: true });
  fs.writeFileSync(`clash/${port}/config.yaml`, yaml.dump(config));
}

export async function startClash(port: number, sessionID: string) {
  await generateClashConfig(port, sessionID);

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
