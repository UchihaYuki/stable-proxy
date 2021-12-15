import { config } from "dotenv";
config({
  path: ".env.local",
});
import hpagent from "hpagent";
import fetch from "node-fetch";
import process from "process";
import fs from "fs";
// @ts-ignore
import xlsx from "xlsx";
import { states } from "./eastern-time-zone";

interface IPInfo {
  city: string;
  region: string;
  "asn-type": string;
  "company-type": string;
}

async function getIPInfo(proxy: string): Promise<IPInfo> {
  try {
    const res = await fetch("https://ipinfo.io/widget", {
      agent: new hpagent.HttpsProxyAgent({ proxy }),
      headers: {
        accept: "*/*",
        "accept-language": "en",
        "sec-ch-ua":
          '" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        cookie:
          "flash=; __stripe_mid=d5bbac1b-4f26-4bc9-8997-14cbc390afa02946f7; __gads=ID=e5274f5245adc387-22e213fe66cf0082:T=1639129258:RT=1639129258:S=ALNI_MYUDzhLzbsUd9mp_esF1MJOS4rJZg; _ga_RWP85XL4SC=GS1.1.1639356934.5.0.1639356934.0; _ga=GA1.2.1385578115.1639051186; _gid=GA1.2.8512868.1639356935; _gat_UA-2336519-21=1",
        Referer: "https://ipinfo.io/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    });
    const json = await res.json();
    return {
      city: json.city,
      region: json.region,
      "asn-type": json.asn.type,
      "company-type": json.company.type,
    };
  } catch (error) {
    return {
      city: "error",
      region: "error",
      "asn-type": "error",
      "company-type": "error",
    };
  }
}

async function getProxyList() {
  const res = await fetch(process.env.WS_PROXY_LIST_URL);
  const text = await res.text();
  return text.split("\r\n") as string[];
}

async function main() {
  fs.mkdirSync("tmp", { recursive: true });

  const proxyList = await getProxyList();
  const result: any[] = [];
  //    console.log("proxy list", proxyList)
  let counter = 0;
  for (const proxy of proxyList) {
    counter++;
    console.log(counter);
    // if (counter == 6) break;
    const [ip, port, username, password] = proxy.split(":");
    const ipInfo = await getIPInfo(
      `http://${username}:${password}@${ip}:${port}`
    );

    // console.log(ipInfo);
    result.push({
      "double-isp-et":
        states.includes(ipInfo.region) &&
        ipInfo["asn-type"] == "isp" &&
        ipInfo["company-type"] == "isp",
      ip,
      port,
      username,
      password,
      city: ipInfo.city,
      region: (states.includes(ipInfo.region) ? "*" : "") + ipInfo.region,
      "asn-type": ipInfo["asn-type"],
      "company-type": ipInfo["company-type"]
    });
  }

  const workbook = xlsx.utils.book_new();
  const sheet = xlsx.utils.json_to_sheet(result);
  xlsx.utils.book_append_sheet(workbook, sheet);
  xlsx.writeFile(workbook, "tmp/stat-ws-type.xlsx");
}

main();
