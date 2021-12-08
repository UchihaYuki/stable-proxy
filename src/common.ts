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
//   return result;
  return "12345687"
}

export async function getResidentialProxyState(sessionPassword: string) {
  const agent = new HttpsProxyAgent(
    `https://${process.env.PROXY_USERNAME}:${sessionPassword}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`
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

  console.log("location", res.body);

  const state = (res.body as any).region as string;
  console.log("state", state)
  return state;
}

export async function getResidentialProxyResponseTime(sessionPassword: string) {
  const agent = new HttpsProxyAgent(
    `https://${process.env.PROXY_USERNAME}:${sessionPassword}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`
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

export async function chooseResidentialProxy(targetState: string) {
  let counter = 0;
  while (true) {
    counter++;

    const sessionID = generateSessionID();
    const sessionPassword = `${process.env.PROXY_PASSWORD}_country-UnitedStates_session-${sessionID}`;

    if (process.env.CHECK_STATE == "true") {
      const state = await getResidentialProxyState(sessionPassword);
      if (state != targetState) {
        console.log(
          counter,
          `The state (${state}) of the residential proxy (${sessionID}) is not ${targetState}.`
        );
        continue;
      } else {
        console.log(
          counter,
          `A residential proxy (${sessionID}) is found for ${targetState}.`
        );
      }
    }

    const speed1 = await getResidentialProxyResponseTime(sessionPassword);
    const speed2 = await getResidentialProxyResponseTime(sessionPassword);
    const speed3 = await getResidentialProxyResponseTime(sessionPassword);
    const avgSpeed = (speed1 + speed2 + speed3) / 3;
    if (avgSpeed > parseInt(process.env.PROXY_SPEED_THRESHOLD as string)) {
      console.log(
        counter,
        `The speed (${avgSpeed}ms) of the residential proxy (${sessionID}) is slower than ${parseInt(
          process.env.PROXY_SPEED_THRESHOLD as string
        )}ms.`
      );
      continue;
    } else {
      console.log(
        counter,
        `A residential proxy (${sessionID}) is found for ${targetState} with average speed ${avgSpeed}ms.`
      );
    }

    return sessionPassword;
  }
}
