import { config } from "dotenv";
config({
  path: ".env.local",
});
import yaml from "js-yaml";
import fs from "fs";
import { startClash } from "./clash";
import { promisify } from "util";
import got from "got";

async function main() {
  const proxies = fs.readFileSync("ws/proxies.txt", "utf8").split("\r\n").filter(proxy => !!proxy)

  let port = 8000;
  for (const proxy of proxies) {
    port++;

    await startClash(port, proxy);
  }
}

main();
