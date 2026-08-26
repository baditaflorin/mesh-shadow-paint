import { useEffect, useState } from "react";
import { MeshShell } from "@baditaflorin/mesh-common";
import { Shadow, type Role } from "./features/shadow/Shadow";
import { SettingsExtras } from "./features/settings/SettingsExtras";
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

  useEffect(() => {
    localStorage.setItem(STORAGE.room, roomId);
  }, [roomId]);
  useEffect(() => {
    localStorage.setItem(STORAGE.role, role);
  }, [role]);

  return (
    <MeshShell
      config={appConfig}
      roomId={roomId}
      onRoomChange={setRoomId}
      settingsExtras={<SettingsExtras role={role} onRoleChange={setRole} peerId={peerId} />}
    >
      <Shadow roomId={roomId} role={role} peerId={peerId} onRoleChange={setRole} />
    </MeshShell>
  );
}
