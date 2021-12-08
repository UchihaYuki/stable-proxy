import express from "express";
import bodyParser from "body-parser";
import { generateV2rayConfig, startV2ray, stopV2ray } from "./v2ray";
import { proxies } from "./proxy";

const app = express();

app.use(express.static("www"));

app.use(bodyParser.json());

app.post("/api/matchProxies", async (req, res) => {
  const params: { inUse: boolean; port: number; state: string }[] = (
    req.body as { inUse: string; port: string; state: string }[]
  ).map((proxy) => ({
    inUse: proxy.inUse == "yes",
    port: parseInt(proxy.port),
    state: proxy.state,
  }));

  console.log("proxies", params);

  for (const { inUse, port, state } of params) {
    if (!inUse) {
      stopV2ray(port);
      continue;
    }

    if (proxies[port]) {
      continue;
    }

    await generateV2rayConfig(port, state);
    // startV2ray(port);
  }

  res.send("Succeeded!");
});

// app.post("/api/getStatus", (req, res) => {
//   const result: {
//     [port: number]: number | undefined;
//   } = {};
//   for (const port in v2ray) {
//     const childProcess = v2ray[port];

//     result[port] = childProcess.pid;
//   }
//   res.send(result);
// });

app.listen(3000, "127.0.0.1", () => {
  console.log("listening at 127.0.0.1:3000...");
});
