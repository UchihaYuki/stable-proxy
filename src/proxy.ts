import { ChildProcessWithoutNullStreams } from "child_process";
import got, { RequestError } from "got";
import { startClash } from "./clash";
import { generateSessionID, getAgent, getUserAgent } from "./common";

export interface Proxy {
  childProcess: ChildProcessWithoutNullStreams;
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
    proxies[port].childProcess.kill("SIGINT");

    clearInterval(proxies[port].speedTestTimer);

    delete proxies[port];
  }
}

export async function startProxy(port: number, state: string) {
  if (proxies[port]) return;

  const { childProcess, realState, sessionID, speed, ip } =
    await chooseResidentialProxy(port, state);

  const proxy: Proxy = {
    childProcess,
    realState,
    state,
    sessionID,
    ip,
    ipChanged: false,
    timeoutCounter: 0,
    speed,
    lastSpeedTest: new Date(),
    speedTestTimer: setInterval(async () => {
      try {
        const speed = await getResidentialProxyAverageSpeed(port);
        proxy.speed = speed;
        proxy.lastSpeedTest = new Date();

        if (speed > parseInt(process.env.PROXY_SPEED_THRESHOLD as string)) {
          proxy.timeoutCounter++;
          console.log(
            port,
            `The proxy has timed out ${proxy.timeoutCounter} times.`
          );
        }

        const { ip } = await getResidentialProxyLocation(port);
        if (!proxy.ipChanged) {
          proxy.ipChanged = ip != proxy.ip;
        }
      } catch (error) {
        console.log(port, (error as RequestError).code, (error as RequestError).message);
      }
    }, 10 * 6e4),
  };

  proxies[port] = proxy;
}

async function getResidentialProxyLocation(port: number) {
  const res = await got("https://ipapi.co/json/", {
    agent: getAgent(port),
    headers: {
      "User-Agent": getUserAgent(),
    },
    responseType: "json",
    timeout: 5e3,
  });

  // console.log(port, "location", res.body);

  const state = (res.body as any).region as string;
  console.log(port, `state: ${state}`);
  const ip = (res.body as any).ip as string;
  console.log(port, `ip: ${ip}`);
  return {
    state,
    ip,
  };
}

async function getResidentialProxyAverageSpeed(port: number) {
  await getResidentialProxySpeed(port);
  const speed1 = await getResidentialProxySpeed(port);
  const speed2 = await getResidentialProxySpeed(port);
  const speed3 = await getResidentialProxySpeed(port);
  return (speed1 + speed2 + speed3) / 3;
}

async function getResidentialProxySpeed(port: number) {
  const res = await got("https://www.google.com", {
    agent: getAgent(port),
    headers: {
      "User-Agent": getUserAgent(),
    },
    timeout: 5e3,
  });

  const speed = res.timings.phases.total as number;
  console.log(port, `speed: ${speed}ms`);
  return speed;
}

async function chooseResidentialProxy(port: number, state: string) {
  let counter = 0;
  while (true) {
    counter++;

    const sessionID = generateSessionID();

    const childProcess = startClash(port, sessionID);

    let realState: string;
    let ip: string;
    let speed: number;
    try {
      const location = await getResidentialProxyLocation(port);
      realState = location.state;
      ip = location.ip;

      if (process.env.CHECK_STATE == "true" && realState != state) {
        console.log(
          port,
          `${counter}: The state (${realState}) of the residential proxy is not ${state}.`
        );
        childProcess.kill("SIGINT");
        continue;
      }

      console.log(
        port,
        `${counter}: A residential proxy is found for ${state}.`
      );

      speed = await getResidentialProxyAverageSpeed(port);
      if (speed > parseInt(process.env.PROXY_SPEED_THRESHOLD as string)) {
        console.log(
          port,
          `${counter}: The speed (${speed}ms) of the residential proxy is slower than ${parseInt(
            process.env.PROXY_SPEED_THRESHOLD as string
          )}ms.`
        );
        childProcess.kill("SIGINT");
        continue;
      }

      console.log(
        `${port} - ${counter}: A residential proxy is found for ${state} with speed ${speed}ms.`
      );
    } catch (error) {
        console.log(port, (error as RequestError).code, (error as RequestError).message);
      childProcess.kill("SIGINT");
      continue;
    }

    return {
      sessionID,
      speed,
      realState,
      ip,
      childProcess,
    };
  }
}
