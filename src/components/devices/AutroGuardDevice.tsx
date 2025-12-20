import { getDeviceType } from '../../types/devices';
import type { TerminalDefinition } from '../../types/devices';

interface AutroGuardDeviceProps {
    x: number;                    // Plan X coordinate (center)
    y: number;                    // Plan Y coordinate (center)
    selected?: boolean;
    onTerminalClick?: (terminalId: string) => void;
}

/**
 * SVG component for AutroGuard V-430 detector base
 * Renders a circular device with 4 terminals at top, bottom, left, right
 */
export default function AutroGuardDevice({
    x,
    y,
    selected = false,
    onTerminalClick
}: AutroGuardDeviceProps) {
    const deviceType = getDeviceType('AG-socket');
    if (!deviceType) return null;

    const { width, height, terminals } = deviceType;
    const radius = Math.min(width, height) / 2;
    const terminalRadius = 5;

    return (
        <g transform={`translate(${x}, ${y})`} className="device-group">
            {/* Selection ring (shown when selected) */}
            {selected && (
                <circle
                    r={radius + 6}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    className="selection-ring"
                />
            )}

            {/* Device base - outer circle */}
            <circle
                r={radius}
                fill="#F8FAFC"
                stroke="#1E293B"
                strokeWidth="2"
                className="device-body"
            />

            {/* Inner circle (detector housing) */}
            <circle
                r={radius * 0.65}
                fill="#E2E8F0"
                stroke="#64748B"
                strokeWidth="1.5"
            />

            {/* Center indicator */}
            <circle
                r={radius * 0.25}
                fill="#CBD5E1"
                stroke="#94A3B8"
                strokeWidth="1"
            />

            {/* Center dot */}
            <circle
                r={2}
                fill="#64748B"
            />

            {/* Terminals - 4 connection points at cardinal positions */}
            {terminals.map((terminal: TerminalDefinition) => {
                const termX = terminal.relativeX * width;
                const termY = terminal.relativeY * height;

                return (
                    <g
                        key={terminal.id}
                        transform={`translate(${termX}, ${termY})`}
                        className="terminal-group"
                        style={{ cursor: onTerminalClick ? 'pointer' : 'default' }}
                        onClick={() => onTerminalClick?.(terminal.id)}
                    >
                        {/* Terminal hit area (invisible, larger for easier clicking) */}
                        <circle
                            r={terminalRadius + 4}
                            fill="transparent"
                            className="terminal-hitarea"
                        />

                        {/* Terminal circle */}
                        <circle
                            r={terminalRadius}
                            fill="#FBBF24"
                            stroke="#B45309"
                            strokeWidth="1.5"
                            className="terminal-body"
                        />
                    </g>
                );
            })}
        </g>
    );
}
