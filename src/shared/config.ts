export const appConfig = {
  appName: "mesh-shadow-paint",
  storagePrefix: "mesh-shadow-paint",
  description:
    "Peer-to-peer mesh: phones become colored fill lights. One phone is the camera; others show solid hues from different angles.",
  accentHex: "#ff7eb6",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
  repositoryUrl: "https://github.com/baditaflorin/mesh-shadow-paint",
  pagesUrl: "https://baditaflorin.github.io/mesh-shadow-paint/",
  signalingUrl:
    (import.meta.env.VITE_WEBRTC_SIGNALING as string | undefined) ?? "wss://turn.0docker.com/ws",
  turnTokenUrl:
    (import.meta.env.VITE_TURN_TOKEN_URL as string | undefined) ??
    "https://turn.0docker.com/credentials",
  paypalUrl: "https://www.paypal.com/paypalme/florinbadita",
} as const;
