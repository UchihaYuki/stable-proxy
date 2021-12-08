import process from "process";
import got from "got";
import { HttpsProxyAgent } from "https-proxy-agent";

export function generateSessionID() {
  const availableChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  let result = "";
  for (var i = 0; i < 8; ++i) {
    var index = Math.floor(Math.random() * availableChars.length);
    result += availableChars[index];
  }
  return result;
}

export function getSessionPassword(sessionID: string) {
  return `${process.env.PROXY_PASSWORD}_country-UnitedStates_session-${sessionID}`;
}

export async function getResidentialProxyState(sessionID: string) {
  const agent = new HttpsProxyAgent(
    `https://${process.env.PROXY_USERNAME}:${getSessionPassword(sessionID)}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`
  );
  const res = await got("https://ipapi.co/json/", {
    agent: {
      https: agent,
    },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
    },
    responseType: "json",
    timeout: 5e3,
  });

  // console.log("location", res.body);

  const state = (res.body as any).region as string;
  console.log("state", state);
  return state;
}

export async function getResidentialProxyAverageSpeed(sessionID: string) {
  await getResidentialProxySpeed(sessionID);
  const speed1 = await getResidentialProxySpeed(sessionID);
  const speed2 = await getResidentialProxySpeed(sessionID);
  const speed3 = await getResidentialProxySpeed(sessionID);
  return (speed1 + speed2 + speed3) / 3;
}

async function getResidentialProxySpeed(sessionID: string) {
  const agent = new HttpsProxyAgent(
    `https://${process.env.PROXY_USERNAME}:${getSessionPassword(sessionID)}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`
  );
  const res = await got("https://www.google.com", {
    agent: {
      https: agent,
    },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
    },
    timeout: 5e3,
  });

  const responseTime = res.timings.phases.total as number;
  console.log("response time", responseTime);
  return responseTime;
}

export async function chooseResidentialProxy(state: string) {
  let counter = 0;
  while (true) {
    counter++;

    const sessionID = generateSessionID();

    let speed: number;
    let realState: string;
    try {
      realState = await getResidentialProxyState(sessionID);
      if (process.env.CHECK_STATE == "true") {
        if (realState != state) {
          console.log(
            counter,
            `The state (${realState}) of the residential proxy (${sessionID}) is not ${state}.`
          );
          continue;
        } else {
          console.log(
            counter,
            `A residential proxy (${sessionID}) is found for ${state}.`
          );
        }
      }

      speed = await getResidentialProxyAverageSpeed(sessionID);
      if (speed > parseInt(process.env.PROXY_SPEED_THRESHOLD as string)) {
        console.log(
          counter,
          `The speed (${speed}ms) of the residential proxy (${sessionID}) is slower than ${parseInt(
            process.env.PROXY_SPEED_THRESHOLD as string
          )}ms.`
        );
        continue;
      } else {
        console.log(
          counter,
          `A residential proxy (${sessionID}) is found for ${state} with average speed ${speed}ms.`
        );
      }
    } catch (error) {
      console.error(error);
      continue;
    }

    return {
      sessionID,
      speed,
      realState
    };
  }
}
