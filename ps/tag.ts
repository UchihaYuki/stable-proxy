import got from "got";
import yaml from "js-yaml";

let transits: any[];

export async function getTransits() {
  if (transits) return transits;

  const response = await got(process.env.TAG_CLASH_URL as string);
  const { proxies } = yaml.load(response.body) as {
    proxies: { name: string }[];
  };
  transits = proxies.filter(p => p.name.includes("香港"));
  console.log("transits", transits);
  return transits;
}
