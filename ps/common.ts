import process from "process";
import got from "got";
import { HttpsProxyAgent } from "hpagent";
import { startClash } from "./clash";

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
  return `${process.env.PS_PROXY_PASSWORD}_country-UnitedStates_session-${sessionID}`;
}

export function getAgent(port: number) {
  return {
    https: new HttpsProxyAgent({ proxy: `http://localhost:${port}` }),
  };
}

export function getUserAgent() {
  return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36";
}
