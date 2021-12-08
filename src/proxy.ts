import { ChildProcessWithoutNullStreams } from "child_process";

export const proxies: {
  [port: number]: {
      v2ray: ChildProcessWithoutNullStreams
  };
} = {};
