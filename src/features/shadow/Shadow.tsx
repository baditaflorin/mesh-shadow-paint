import { useEffect, useState, type CSSProperties } from "react";
import { MeshButton, MeshPresence, MeshStatusPill, MeshSurface } from "@baditaflorin/mesh-common";
import type * as Y from "yjs";
import { createRoomSync, type RoomSync } from "../sync/yjsRoom";
import { maybeFetchTurnCredentials } from "../sync/iceConfig";
import { hueForPeer, lightToneForHue, PALETTE_HUES } from "./palette";

export type Role = "camera" | "lamp";

type Props = {
  roomId: string;
  role: Role;
  peerId: string;
  onRoleChange: (next: Role) => void;
};

type StateMap = { rotationCounter?: number };

type ShadowMesh = {
  room: RoomSync;
  phones: Y.Map<{ role: Role; ts: number }>;
  state: Y.Map<StateMap>;
};

type RoleOptionProps = {
  active: boolean;
  role: Role;
  onSelect: (role: Role) => void;
};

function roleCopy(role: Role) {
  return role === "camera"
    ? {
        title: "Camera station",
        detail: "Keep this display dark beside your real camera.",
        action: "Arm camera station",
      }
    : {
        title: "Light panel",
        detail: "Turn this display into one precise, shared fill light.",
        action: "Arm light panel",
      };
}

function RoleOption({ active, role, onSelect }: RoleOptionProps) {
  const copy = roleCopy(role);
  return (
    <button
      type="button"
      className={`shadow-role-option${active ? " is-active" : ""}`}
      aria-pressed={active}
      onClick={() => onSelect(role)}
    >
      <span className="shadow-role-option-label">{copy.title}</span>
      <span className="shadow-role-option-detail">{copy.detail}</span>
    </button>
  );
}

function roomLabel(roomId: string): string {
  const normalized = roomId.trim();
  if (!normalized || normalized === "default") return "Shared studio";
  return `Room ${normalized.slice(0, 18)}`;
}

function pluralize(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

export function Shadow({ roomId, role, peerId, onRoleChange }: Props) {
  const [armed, setArmed] = useState(false);
  const [mesh, setMesh] = useState<ShadowMesh | null>(null);
  const [rotation, setRotation] = useState(0);
  const [lampCount, setLampCount] = useState(0);

  // Room creation is gesture-gated and teardown destroys both the provider and
  // document. Keeping this effect side-effectful (rather than useMemo) makes
  // React Strict Mode and a room change leave no abandoned P2P provider behind.
  useEffect(() => {
    if (!armed) {
      setMesh(null);
      return undefined;
    }

    const room = createRoomSync(roomId);
    const next: ShadowMesh = {
      room,
      phones: room.doc.getMap<{ role: Role; ts: number }>("phones"),
      state: room.doc.getMap<StateMap>("state"),
    };
    setMesh(next);
    return () => {
      next.room.provider?.destroy();
      next.room.doc.destroy();
    };
  }, [armed, roomId]);

  useEffect(() => {
    if (!armed) {
      setLampCount(0);
      setRotation(0);
      return;
    }
    void maybeFetchTurnCredentials();
  }, [armed]);

  // Publish this device and observe the actual CRDT data used for the shared
  // palette. The count is deliberately derived from fresh role heartbeats,
  // never guessed from browser tabs or signaling connection events.
  useEffect(() => {
    if (!mesh) return undefined;
    const publish = () => {
      mesh.phones.set(peerId, { role, ts: Date.now() });
    };
    const updateState = () => {
      const state = mesh.state.get("rotation") as StateMap | undefined;
      setRotation(state?.rotationCounter ?? 0);

      const freshAfter = Date.now() - 8_000;
      let lamps = 0;
      mesh.phones.forEach((value) => {
        if (value.role === "lamp" && (value.ts ?? 0) >= freshAfter) lamps += 1;
      });
      setLampCount(lamps);
    };

    publish();
    updateState();
    const heartbeat = window.setInterval(publish, 1_500);
    mesh.state.observe(updateState);
    mesh.phones.observe(updateState);
    return () => {
      window.clearInterval(heartbeat);
      mesh.state.unobserve(updateState);
      mesh.phones.unobserve(updateState);
    };
  }, [mesh, peerId, role]);

  const reshuffle = () => {
    if (!mesh) return;
    mesh.room.doc.transact(() => {
      const current = mesh.state.get("rotation") as StateMap | undefined;
      mesh.state.set("rotation", { rotationCounter: (current?.rotationCounter ?? 0) + 1 });
    });
  };

  if (!armed) {
    const selected = roleCopy(role);
    return (
      <main className="shadow-paint-page shadow-paint-landing">
        <section className="shadow-entry-shell" aria-labelledby="shadow-paint-title">
          <div className="shadow-entry-intro">
            <p className="shadow-eyebrow">Shared lighting studio</p>
            <h1 id="shadow-paint-title">Shape the shadow. Keep the scene.</h1>
            <p className="shadow-entry-lede">
              Coordinate the phones around a subject, then use each assigned panel to build
              deliberate color and depth.
            </p>
            <div className="shadow-entry-signals" aria-label="Studio qualities">
              <MeshStatusPill tone="info" dot>
                Browser-local room
              </MeshStatusPill>
              <span>One dark camera, many lights</span>
            </div>
          </div>

          <MeshSurface
            as="section"
            tone="raised"
            padding="lg"
            className="shadow-entry-control"
            aria-labelledby="shadow-role-heading"
          >
            <div className="shadow-entry-control-heading">
              <div>
                <p className="shadow-eyebrow">This device</p>
                <h2 id="shadow-role-heading">Choose its job.</h2>
              </div>
              <MeshStatusPill tone="neutral">{roomLabel(roomId)}</MeshStatusPill>
            </div>
            <div className="shadow-role-options" role="group" aria-label="Device role">
              <RoleOption active={role === "camera"} role="camera" onSelect={onRoleChange} />
              <RoleOption active={role === "lamp"} role="lamp" onSelect={onRoleChange} />
            </div>
            <MeshButton
              className="shadow-arm-action"
              size="lg"
              fullWidth
              onClick={() => setArmed(true)}
            >
              {selected.action}
            </MeshButton>
            <p className="shadow-entry-helper" role="status">
              {role === "camera"
                ? "Use the native camera after arming; this station stays low-light."
                : "Your light receives a deterministic hue from the shared palette."}
            </p>
          </MeshSurface>

          <aside className="shadow-light-guide" aria-label="How the studio is arranged">
            <div className="shadow-guide-frame" aria-hidden="true">
              <span className="shadow-guide-light shadow-guide-light-a" />
              <span className="shadow-guide-light shadow-guide-light-b" />
              <span className="shadow-guide-subject" />
              <span className="shadow-guide-camera" />
            </div>
            <div>
              <p className="shadow-eyebrow">Light map</p>
              <h2>Place panels around the edge of the frame.</h2>
              <p>
                Every light gets a different angle and a shared color. Rotate the room palette when
                the composition needs a new pass.
              </p>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  const connected = lampCount > 0;
  const presenceState = connected ? "connected" : "connecting";
  const lightCountLabel = `${lampCount} ${pluralize(lampCount, "lighting panel", "lighting panels")} in room`;
  const commonFooter = (
    <footer className="shadow-stage-footer">
      <MeshPresence
        count={lampCount}
        label="lighting panels in room"
        state={presenceState}
        announce="polite"
      />
      <div className="shadow-stage-actions">
        <MeshButton variant="secondary" onClick={reshuffle} disabled={!mesh}>
          Rotate lighting palette
        </MeshButton>
        <MeshButton variant="quiet" onClick={() => setArmed(false)}>
          Leave studio
        </MeshButton>
      </div>
    </footer>
  );

  if (role === "camera") {
    return (
      <main className="shadow-paint-page shadow-paint-live">
        <MeshSurface
          as="section"
          tone="raised"
          padding="lg"
          className="shadow-stage-card shadow-camera-stage"
          aria-labelledby="camera-station-title"
        >
          <header className="shadow-stage-topline">
            <div>
              <p className="shadow-eyebrow">{roomLabel(roomId)}</p>
              <h1 id="camera-station-title">Camera station</h1>
            </div>
            <MeshStatusPill tone={connected ? "success" : "warning"} dot announce="polite">
              {connected ? lightCountLabel : "Waiting for a light panel"}
            </MeshStatusPill>
          </header>
          <div className="shadow-camera-core">
            <div className="shadow-camera-aperture" aria-hidden="true">
              <span />
              <span />
            </div>
            <div>
              <p className="shadow-camera-kicker">Keep this panel dark</p>
              <h2>Frame with your native camera.</h2>
              <p>
                This station never opens a camera or records media. It only sees which light panels
                are armed in the same room.
              </p>
            </div>
          </div>
          {commonFooter}
        </MeshSurface>
      </main>
    );
  }

  const hue = hueForPeer(peerId, rotation);
  const tone = lightToneForHue(hue);
  const lightStyle = { "--shadow-hue": String(hue) } as CSSProperties;

  return (
    <main className="shadow-paint-page shadow-paint-live">
      <MeshSurface
        as="section"
        tone="raised"
        padding="lg"
        className="shadow-stage-card shadow-light-stage"
        style={lightStyle}
        aria-labelledby="light-panel-title"
      >
        <header className="shadow-stage-topline shadow-light-topline">
          <div>
            <p className="shadow-eyebrow">{roomLabel(roomId)}</p>
            <h1 id="light-panel-title">Light panel</h1>
          </div>
          <MeshStatusPill tone="live" dot announce="polite">
            {mesh ? "Panel armed" : "Preparing panel"}
          </MeshStatusPill>
        </header>
        <div className="shadow-light-core">
          <div className="shadow-light-readout">
            <span>Assigned color</span>
            <strong>{tone.name}</strong>
            <small>{String(tone.hue).padStart(3, "0")}°</small>
          </div>
          <div className="shadow-light-direction">
            <span>{tone.direction}</span>
            <p>Aim this display at the shadow edge, then step back from the subject.</p>
          </div>
        </div>
        {commonFooter}
      </MeshSurface>
    </main>
  );
}

export { PALETTE_HUES };
