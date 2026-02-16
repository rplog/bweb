import { onRequest as __api_ping_ts_onRequest } from "C:\\Users\\X\\Projects\\bweb\\functions\\api\\ping.ts"

export const routes = [
    {
      routePath: "/api/ping",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_ping_ts_onRequest],
    },
  ]