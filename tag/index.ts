import yaml from "js-yaml";
import fs from "fs";
import { startClash } from "./clash";
import { promisify } from "util";

async function main() {
  fs.mkdirSync("tag/config", { recursive: true });

  const { proxies } = yaml.load(fs.readFileSync("tag/proxies.yml", "utf8")) as {
    proxies: any[];
  };

  let port = 9000;
  for (const proxy of proxies) {
    port++;

    const config = {} as any;
    config["log-level"] = "warning";
    config["rules"] = [`MATCH,${proxy.name}`];
    config.proxies = [proxy];
    config.port = port;

    fs.writeFileSync(`tag/config/config-${port}.yml`, yaml.dump(config));

    startClash(port);
  }
}

main();
