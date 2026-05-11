import { useEffect, useMemo, useState } from "react";
import { createRoomSync } from "../sync/yjsRoom";
import { maybeFetchTurnCredentials } from "../sync/iceConfig";
import { hueForPeer, PALETTE_HUES } from "./palette";

export type Role = "camera" | "lamp";

type Props = {
  roomId: string;
  role: Role;
  peerId: string;
};

type StateMap = { rotationCounter?: number };

export function Shadow({ roomId, role, peerId }: Props) {
  const [armed, setArmed] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lampCount, setLampCount] = useState(0);

  const mesh = useMemo(() => {
    if (!armed) return null;
    const room = createRoomSync(roomId);
    const phones = room.doc.getMap<{ role: Role; ts: number }>("phones");
    const state = room.doc.getMap<StateMap>("state");
    return { room, phones, state };
  }, [armed, roomId]);

  useEffect(() => {
    if (!armed) return;
    void maybeFetchTurnCredentials();
  }, [armed]);

  useEffect(() => {
    return () => {
      mesh?.room.provider?.destroy();
    };
  }, [mesh]);

  // Publish + observe role + rotation
  useEffect(() => {
    if (!mesh) return undefined;
    const publish = () => {
      mesh.phones.set(peerId, { role, ts: Date.now() });
    };
    publish();
    const pub = setInterval(publish, 1500);

    const updateState = () => {
      const s = mesh.state.get("rotation") as StateMap | undefined;
      setRotation(s?.rotationCounter ?? 0);
      const fresh = Date.now() - 8000;
      let lamps = 0;
      mesh.phones.forEach((v) => {
        if (v.role === "lamp" && (v.ts ?? 0) >= fresh) lamps++;
      });
      setLampCount(lamps);
    };
    updateState();
    mesh.state.observe(updateState);
    mesh.phones.observe(updateState);
    return () => {
      clearInterval(pub);
      mesh.state.unobserve(updateState);
      mesh.phones.unobserve(updateState);
    };
  }, [mesh, peerId, role]);

  const reshuffle = () => {
    if (!mesh) return;
    mesh.room.doc.transact(() => {
      const cur = mesh.state.get("rotation") as StateMap | undefined;
      const next = (cur?.rotationCounter ?? 0) + 1;
      mesh.state.set("rotation", { rotationCounter: next });
    });
  };

  if (!armed) {
    return (
      <div className="shadow-arm">
        <h1>mesh-shadow-paint</h1>
        <p>
          One phone is the <strong>camera</strong> (black screen, hold beside your real camera). The
          others are <strong>lamps</strong> — each one glows a different hue from the shared
          palette. Hold the lamps at different angles around your subject and shoot.
        </p>
        <button type="button" className="shadow-arm-button" onClick={() => setArmed(true)}>
          Connect as {role}
        </button>
        <p className="shadow-hint">Switch role in Settings if you change your mind.</p>
      </div>
    );
  }

  if (role === "camera") {
    return (
      <div className="shadow-stage shadow-camera">
        <div className="shadow-hud">
          <span>
            {lampCount} lamp{lampCount === 1 ? "" : "s"} ready
          </span>
        </div>
        <button type="button" className="shadow-reshuffle" onClick={reshuffle}>
          Reshuffle palette
        </button>
        <p className="shadow-camera-hint">
          Use your native camera app. This screen stays black so nothing leaks into the shot.
        </p>
      </div>
    );
  }

  const myHue = hueForPeer(peerId, rotation);
  const bg = `hsl(${myHue}, 95%, 55%)`;

  return (
    <div className="shadow-stage shadow-lamp" style={{ background: bg }}>
      <div className="shadow-hud shadow-hud-lamp">
        <span>hue {myHue}°</span>
        <span aria-hidden="true">·</span>
        <span>
          {lampCount} lamp{lampCount === 1 ? "" : "s"}
        </span>
      </div>
      <button type="button" className="shadow-reshuffle" onClick={reshuffle}>
        Reshuffle palette
      </button>
    </div>
  );
}

export { PALETTE_HUES };
