import { ChildProcessWithoutNullStreams } from "child_process";
import {
  chooseResidentialProxy,
  getResidentialProxyAverageSpeed,
} from "./common";
import { generateV2rayConfig, startV2ray } from "./v2ray";

export interface Proxy {
  v2ray: ChildProcessWithoutNullStreams;
  state: string;
  realState: string;
  sessionID: string;
  speedTestTimer: NodeJS.Timer;
  timeoutCounter: number;
  speed: number;
  lastSpeedTest: Date;
}

export const proxies: {
  [port: number]: Proxy;
} = {};

export function stopProxy(port: number) {
  if (proxies[port]) {
    proxies[port].v2ray.kill("SIGINT");

    clearInterval(proxies[port].speedTestTimer)

    delete proxies[port]
  }
}

export async function startProxy(port: number, state: string) {
  const { sessionID, speed, realState } = await chooseResidentialProxy(state);

  generateV2rayConfig(port, sessionID);
  const childProcess = startV2ray(port);

  const proxy: Proxy = {
    v2ray: childProcess,
    realState,
    state,
    sessionID,
    timeoutCounter: 0,
    speed,
    lastSpeedTest: new Date(),
    speedTestTimer: setInterval(async () => {
      const speed = await getResidentialProxyAverageSpeed(sessionID);
      proxy.speed = speed;
      proxy.lastSpeedTest = new Date();

      if (speed > parseInt(process.env.PROXY_SPEED_THRESHOLD as string)) {
        proxy.timeoutCounter++;
        console.log(
          proxy.timeoutCounter,
          `Proxy (${sessionID}) timed out.`
        );
      }
    }, 6e4),
  };

  proxies[port] = proxy;
}
