import process from "process";
import got from "got";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";

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

export async function getResidentialProxyLocation(port: number) {
  const agent = new HttpProxyAgent(
    `http://localhost:${port}`
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
  console.log(`${port} - state: ${state}`);
  const ip = (res.body as any).ip as string;
  console.log(`${port} - ip: ${ip}`);
  return {
    state,
    ip
  };
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

  const speed = res.timings.phases.total as number;
  console.log(`session (${sessionID}) - speed: ${speed}ms`);
  return speed;
}

// export async function chooseResidentialProxy(state: string) {
//   let counter = 0;
//   while (true) {
//     counter++;

//     const sessionID = generateSessionID();

//     let speed: number;
//     let realState: string;
//     let ip: string;
//     try {
//       const r = await getResidentialProxyLocation(sessionID);
//       realState = r.state;
//       ip = r.ip;
//       if (process.env.CHECK_STATE == "true") {
//         if (realState != state) {
//           console.log(
//             `session (${sessionID}) - ${counter}: The state (${realState}) of the residential proxy is not ${state}.`
//           );
//           continue;
//         } else {
//           console.log(
//             `session (${sessionID}) - ${counter}: A residential proxy is found for ${state}.`
//           );
//         }
//       }

//       speed = await getResidentialProxyAverageSpeed(sessionID);
//       if (speed > parseInt(process.env.PROXY_SPEED_THRESHOLD as string)) {
//         console.log(
//           `session (${sessionID}) - ${counter}: The speed (${speed}ms) of the residential proxy is slower than ${parseInt(
//             process.env.PROXY_SPEED_THRESHOLD as string
//           )}ms.`
//         );
//         continue;
//       } else {
//         console.log(
//           `session (${sessionID}) - ${counter}: A residential proxy is found for ${state} with speed ${speed}ms.`
//         );
//       }
//     } catch (error) {
//       console.error(error);
//       continue;
//     }

//     return {
//       sessionID,
//       speed,
//       realState,
//       ip
//     };
//   }
// }
