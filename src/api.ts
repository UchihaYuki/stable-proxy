import express from "express";
import bodyParser from "body-parser";
import { proxies, startProxy, stopProxy } from "./proxy";

const app = express();

app.use(express.static("www"));

app.use(bodyParser.json());

app.post("/api/matchProxies", async (req, res) => {
  const body: { inUse: boolean; port: number; state: string }[] = (
    req.body as { inUse: string; port: string; state: string }[]
  ).map((proxy) => ({
    inUse: proxy.inUse == "yes",
    port: parseInt(proxy.port),
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
      pid: proxy.childProcess.pid,
      state: proxy.state,
      realState: proxy.realState,
      sessionID: proxy.sessionID,
      timeoutCounter: proxy.timeoutCounter,
      speed: proxy.speed,
      lastSpeedTest: proxy.lastSpeedTest,
      ip: proxy.ip,
      ipChanged: proxy.ipChanged
    });
  }
  res.json(result);
});

app.listen(3000, "127.0.0.1", () => {
  console.log("listening at 127.0.0.1:3000...");
});
