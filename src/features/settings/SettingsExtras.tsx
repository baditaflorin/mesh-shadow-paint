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
        <span>Device role</span>
        <div className="settings-toggle">
          <button
            type="button"
            className={role === "camera" ? "on" : ""}
            onClick={() => onRoleChange("camera")}
            aria-pressed={role === "camera"}
          >
            Camera station
          </button>
          <button
            type="button"
            className={role === "lamp" ? "on" : ""}
            onClick={() => onRoleChange("lamp")}
            aria-pressed={role === "lamp"}
          >
            Light panel
          </button>
        </div>
      </label>

      <p className="mesh-settings-help">
        A camera station keeps its panel dark. A light panel takes one synchronized hue.
      </p>
      <p className="mesh-settings-help">
        Rotate the shared palette from the studio once your devices are armed.
      </p>
      <p className="mesh-settings-help">
        This device: <code>{peerId.slice(0, 8)}</code>
      </p>
    </>
  );
}
