import type { Role } from "../shadow/Shadow";

type Props = {
  role: Role;
  onRoleChange: (next: Role) => void;
  peerId: string;
};

export function SettingsExtras({ role, onRoleChange, peerId }: Props) {
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
            Camera (black screen)
          </button>
          <button
            type="button"
            className={role === "lamp" ? "on" : ""}
            onClick={() => onRoleChange("lamp")}
          >
            Lamp (colored)
          </button>
        </div>
      </label>

      <p className="mesh-settings-help">
        Reshuffle the palette from the main screen once you&rsquo;ve connected.
      </p>
      <p className="mesh-settings-help">
        Your peer id: <code>{peerId.slice(0, 8)}</code> (deterministic palette index seed).
      </p>
    </>
  );
}
