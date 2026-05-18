import { createRoomSync } from "../sync/yjsRoom";
import type { Role } from "../shadow/Shadow";

type Props = {
  roomId: string;
  role: Role;
  onRoleChange: (next: Role) => void;
  peerId: string;
};

export function SettingsExtras({ roomId, role, onRoleChange, peerId }: Props) {
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
    <>
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

      <p className="mesh-settings-help">
        Your peer id: <code>{peerId.slice(0, 8)}</code> (deterministic palette index seed).
      </p>
    </>
  );
}
