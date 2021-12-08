import { ChildProcessWithoutNullStreams } from "child_process";
import {
  generateSessionID,
  getResidentialProxyLocation,
} from "./common";
import { startV2ray } from "./v2ray";

export interface Proxy {
  v2ray: ChildProcessWithoutNullStreams;
  state: string;
  realState: string;
  sessionID: string;
  speedTestTimer: NodeJS.Timer;
  timeoutCounter: number;
  speed: number;
  lastSpeedTest: Date;
  ip: string;
  ipChanged: boolean;
}

export const proxies: {
  [port: number]: Proxy;
} = {};

export function stopProxy(port: number) {
  if (proxies[port]) {
    proxies[port].v2ray.kill("SIGINT");

    clearInterval(proxies[port].speedTestTimer);

    delete proxies[port];
  }
}

export async function startProxy(port: number, state: string) {
  const sessionID = generateSessionID();

  const childProcess = startV2ray(port, sessionID);

//   const location = await getResidentialProxyLocation(port);

  //   generateV2rayConfig(port, sessionID);
  //   const childProcess = startV2ray(port);

  //   const proxy: Proxy = {
  //     v2ray: childProcess,
  //     realState,
  //     state,
  //     sessionID,
  //     ip,
  //     ipChanged: false,
  //     timeoutCounter: 0,
  //     speed,
  //     lastSpeedTest: new Date(),
  //     speedTestTimer: setInterval(async () => {
  //       const speed = await getResidentialProxyAverageSpeed(sessionID);
  //       proxy.speed = speed;
  //       proxy.lastSpeedTest = new Date();

  //       if (speed > parseInt(process.env.PROXY_SPEED_THRESHOLD as string)) {
  //         proxy.timeoutCounter++;
  //         console.log(
  //           proxy.timeoutCounter,
  //           `Proxy (${sessionID}) timed out.`
  //         );
  //       }

  //       const {ip} = await getResidentialProxyLocation(sessionID);
  //       if (!proxy.ipChanged) {
  //           proxy.ipChanged = ip != proxy.ip
  //       }
  //     }, 10 * 6e4),
  //   };

  //   proxies[port] = proxy;
}
