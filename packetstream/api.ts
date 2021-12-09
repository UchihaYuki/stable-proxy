import express from "express";
import bodyParser from "body-parser";
import { proxies, startProxy, stopProxy } from "./proxy";

const app = express();

app.use(express.static("www"));

app.use(bodyParser.json());

app.post("/api/matchProxies", async (req, res) => {
  const body: { inUse: boolean; port: number; state: string }[] = (
    req.body as { inUse: string | boolean; port: number; state: string }[]
  ).map((proxy) => ({
    inUse: proxy.inUse == "TRUE" || proxy.inUse == "true" || proxy.inUse == true,
    port: proxy.port,
    state: proxy.state,
  }));
  console.log("/api/matchProxies", body);

  for (const { inUse, port, state } of body) {
    if (!inUse) {
      stopProxy(port);
      continue;
    }

    await startProxy(port, state);
  }

  res.send("Succeeded!");
});

app.post("/api/getStatus", (req, res) => {
  console.log("/api/getStatus")

  const result: any[] = [];
  for (const port in proxies) {
    const proxy = proxies[port];
    result.push({
      port,
      pid: proxy.childProcess.pid,
      state: proxy.state,
      realState: proxy.realState,
      sessionID: proxy.sessionID,
      timeoutCounter: proxy.timeoutCounter,
      speed: proxy.speed,
      lastSpeedTest: proxy.lastSpeedTest,
      ip: proxy.ip,
      ipChanged: proxy.ipChanged,
    });
  }
  res.send(JSON.stringify(result, null, 4));
});

app.listen(3000, "127.0.0.1", () => {
  console.log("listening at 127.0.0.1:3000...");
});
