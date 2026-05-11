import { useEffect, useState } from "react";
import {
  loadSignalingUrl,
  loadTurnTokenUrl,
  resetIceServers,
  saveSignalingUrl,
  saveTurnTokenUrl,
} from "../sync/iceConfig";
import { appConfig } from "../../shared/config";
import { createRoomSync } from "../sync/yjsRoom";
import type { Role } from "../shadow/Shadow";

type Props = {
  open: boolean;
  onClose: () => void;
  roomId: string;
  onRoomChange: (next: string) => void;
  role: Role;
  onRoleChange: (next: Role) => void;
  peerId: string;
};

export function SettingsDrawer({
  open,
  onClose,
  roomId,
  onRoomChange,
  role,
  onRoleChange,
  peerId,
}: Props) {
  const [signaling, setSignaling] = useState(loadSignalingUrl());
  const [tokenUrl, setTokenUrl] = useState(loadTurnTokenUrl());

  useEffect(() => {
    if (open) {
      setSignaling(loadSignalingUrl());
      setTokenUrl(loadTurnTokenUrl());
    }
  }, [open]);

  if (!open) return null;

  const reshuffleFromSettings = () => {
    // Open a quick connection, bump counter, leave it for the main app to keep alive.
    const room = createRoomSync(roomId);
    const state = room.doc.getMap<{ rotationCounter?: number }>("state");
    const cur = state.get("rotation");
    const next = (cur?.rotationCounter ?? 0) + 1;
    room.doc.transact(() => {
      state.set("rotation", { rotationCounter: next });
    });
    // Don't destroy — the page also has a live provider; this one just rides along.
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-drawer" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>Settings</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <label>
          <span>Room ID</span>
          <input value={roomId} onChange={(e) => onRoomChange(e.target.value)} />
        </label>

        <label>
          <span>Role</span>
          <div className="settings-toggle">
            <button
              type="button"
              className={role === "camera" ? "on" : ""}
              onClick={() => onRoleChange("camera")}
            >
              Camera
            </button>
            <button
              type="button"
              className={role === "lamp" ? "on" : ""}
              onClick={() => onRoleChange("lamp")}
            >
              Lamp
            </button>
          </div>
        </label>

        <button type="button" className="settings-reshuffle" onClick={reshuffleFromSettings}>
          Reshuffle palette
        </button>

        <p className="settings-help">
          Your peer id: <code>{peerId.slice(0, 8)}</code> (deterministic palette index seed).
        </p>

        <hr />

        <h3>Self-hosted infra (advanced)</h3>
        <p className="settings-help">
          Override the default signaling and TURN endpoints. Leave blank to use the built-in
          defaults (<code>{appConfig.signalingUrl}</code> and <code>{appConfig.turnTokenUrl}</code>
          ).
        </p>

        <label>
          <span>Signaling URL</span>
          <input
            value={signaling}
            onChange={(e) => setSignaling(e.target.value)}
            placeholder={appConfig.signalingUrl}
          />
        </label>

        <label>
          <span>TURN credentials URL</span>
          <input
            value={tokenUrl}
            onChange={(e) => setTokenUrl(e.target.value)}
            placeholder={appConfig.turnTokenUrl}
          />
        </label>

        <div className="settings-actions">
          <button
            type="button"
            onClick={() => {
              saveSignalingUrl(signaling);
              saveTurnTokenUrl(tokenUrl);
              onClose();
              location.reload();
            }}
          >
            Save and reload
          </button>
          <button
            type="button"
            onClick={() => {
              saveSignalingUrl("");
              saveTurnTokenUrl("");
              resetIceServers();
              onClose();
              location.reload();
            }}
          >
            Reset to defaults
          </button>
        </div>

        <hr />

        <footer className="settings-footer">
          <a href={appConfig.repositoryUrl} target="_blank" rel="noreferrer">
            source on github
          </a>
          <span>
            v{appConfig.version} · {appConfig.commit}
          </span>
        </footer>
      </div>
    </div>
  );
}
