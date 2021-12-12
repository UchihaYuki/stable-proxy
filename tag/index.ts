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
  const response = await got(process.env.TAG_CLASH_URL as string);
  const { proxies } = yaml.load(response.body) as {
    proxies: { name: string }[];
  };

  let port = 9000;
  for (const proxy of proxies.filter((p) => p.name.includes("美国"))) {
    port++;

    await startClash(port, proxy);
  }
}

main();
