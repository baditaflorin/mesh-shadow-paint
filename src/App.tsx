import { useEffect, useState } from "react";
import { Shadow, type Role } from "./features/shadow/Shadow";
import { SettingsDrawer } from "./features/settings/SettingsDrawer";
import { appConfig } from "./shared/config";

const STORAGE = {
  room: `${appConfig.storagePrefix}:room`,
  role: `${appConfig.storagePrefix}:role`,
  peerId: `${appConfig.storagePrefix}:peerId`,
};

function readString(key: string, fallback: string): string {
  return localStorage.getItem(key) ?? fallback;
}
function readRole(key: string, fallback: Role): Role {
  const raw = localStorage.getItem(key);
  if (raw === "camera" || raw === "lamp") return raw;
  return fallback;
}
function ensurePeerId(): string {
  const existing = localStorage.getItem(STORAGE.peerId);
  if (existing) return existing;
  const fresh = crypto.randomUUID();
  localStorage.setItem(STORAGE.peerId, fresh);
  return fresh;
}

export function App() {
  const [roomId, setRoomId] = useState(() => readString(STORAGE.room, "default"));
  const [role, setRole] = useState<Role>(() => readRole(STORAGE.role, "lamp"));
  const [peerId] = useState<string>(() => ensurePeerId());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE.room, roomId);
  }, [roomId]);
  useEffect(() => {
    localStorage.setItem(STORAGE.role, role);
  }, [role]);

  return (
    <div className="app-root">
      <Shadow roomId={roomId} role={role} peerId={peerId} />

      <button
        type="button"
        className="settings-fab"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
      >
        ⚙
      </button>

      <div className="self-ref">
        <a href={appConfig.repositoryUrl} target="_blank" rel="noreferrer">
          source
        </a>
        <span aria-hidden="true">·</span>
        <a href={appConfig.paypalUrl} target="_blank" rel="noreferrer">
          tip ♥
        </a>
        <span aria-hidden="true">·</span>
        <span>
          v{appConfig.version} · {appConfig.commit}
        </span>
      </div>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        roomId={roomId}
        onRoomChange={setRoomId}
        role={role}
        onRoleChange={setRole}
        peerId={peerId}
      />
    </div>
  );
}
