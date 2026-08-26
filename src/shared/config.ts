import { createMeshConfig } from "@baditaflorin/mesh-common";

export const appConfig = createMeshConfig({
  appName: "mesh-shadow-paint",
  displayName: "Shadow Paint",
  visualProfile: "studio",
  shellLayout: "inset",
  description:
    "A browser-local lighting studio that turns nearby phones into coordinated fill panels for deliberate shadows.",
  accentHex: "#d8ba75",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
  signalingUrl:
    (import.meta.env.VITE_WEBRTC_SIGNALING as string | undefined) ?? "wss://turn.0docker.com/ws",
  turnTokenUrl:
    (import.meta.env.VITE_TURN_TOKEN_URL as string | undefined) ??
    "https://turn.0docker.com/credentials",
});
