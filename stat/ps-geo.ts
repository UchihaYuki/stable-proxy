import { config } from "dotenv";
config({
  path: ".env.local",
});
import got from "got";
import fs from "fs";
import hpagent from "hpagent";

async function getResidentialProxyLocation() {
  const proxy = `http://${process.env.PS_PROXY_USERNAME}:${process.env.PS_PROXY_PASSWORD}_country-UnitedStates@${process.env.PS_PROXY_HOST}:31112`;
  const agent = {
    https: new hpagent.HttpsProxyAgent({ proxy }),
  };
  try {
    const { body } = (await got("https://ipapi.co/json/", {
      agent,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
      },
      responseType: "json",
      timeout: {
        request: 5e3,
      },
    })) as { body: Location };
    return { ip: body.ip, city: body.city, region: body.region };
  } catch (error) {
    return { ip: "error", city: "error", region: "error" };
  }
}

interface Counter {
  [key: string]: {
    count: number;
  } & Location;
}

interface Location {
  ip: string;
  city: string;
  region: string;
}

function inc(counter: Counter, key: string, location: Location) {
  if (counter[key]) {
    counter[key].count++;
  } else {
    counter[key] = {
      count: 1,
      ...location,
    };
  }
}

function sort(counter: Counter) {
  const result: ({ count: number; key: string } & Location)[] = [];

  for (const key in counter) {
    result.push({
      key,
      count: counter[key].count,
      ip: counter[key].ip,
      city: counter[key].city,
      region: counter[key].region,
    });
  }

  result.sort((a, b) => {
    return b.count - a.count;
  });

  return result.map((entry) => JSON.stringify(entry)).join("\r\n");
}

async function main() {
  fs.mkdirSync("tmp", { recursive: true });

  const ipCounter = {};
  const cityCounter = {};
  const regionCounter = {};
  for (let i = 0; i < 100; ++i) {
    const requests: Promise<Location>[] = [];
    for (let j = 0; j < 25; ++j) {
      requests.push(getResidentialProxyLocation());
    }

    const locations = await Promise.all(requests);
    console.log(i, locations);
    for (const location of locations) {
      inc(ipCounter, location.ip, location);
      inc(cityCounter, location.city, location);
      inc(regionCounter, location.region, location);
    }

    fs.writeFileSync(`tmp/ip-${i + 1}.txt`, sort(ipCounter));
    fs.writeFileSync(`tmp/city-${i + 1}.txt`, sort(cityCounter));
    fs.writeFileSync(`tmp/region-${i + 1}.txt`, sort(regionCounter));
  }
}

main();
