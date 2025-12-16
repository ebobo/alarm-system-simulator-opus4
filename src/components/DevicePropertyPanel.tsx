import type { PlacedDevice } from '../types/devices';

interface DevicePropertyPanelProps {
    selectedDevice: PlacedDevice | null;
    onUpdateDevice: (device: PlacedDevice) => void;
    onPowerOn?: (device: PlacedDevice) => void;
}

/**
 * Property panel component for displaying and editing device properties
 * Shows at the bottom of the device palette when a device is selected
 */
export default function DevicePropertyPanel({ selectedDevice, onUpdateDevice, onPowerOn }: DevicePropertyPanelProps) {
    if (!selectedDevice) {
        return (
            <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                <p className="text-xs text-slate-500 text-center italic">
                    Select a device to view properties
                </p>
            </div>
        );
    }

    const isLoopDriver = selectedDevice.typeId === 'loop-driver';

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newLabel = e.target.value.slice(0, 20); // Max 20 characters
        onUpdateDevice({ ...selectedDevice, label: newLabel });
    };

    const handleIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateDevice({ ...selectedDevice, ipAddress: e.target.value });
    };

    const handlePowerOn = () => {
        onPowerOn?.(selectedDevice);
    };

    // Format SN as 12-digit hex string (48 bits)
    const formatSN = (sn: number): string => {
        return sn.toString(16).toUpperCase().padStart(12, '0');
    };

    return (
        <div className="border-t border-slate-700 bg-slate-800/50">
            {/* Header */}
            <div className="px-4 py-2 border-b border-slate-700/50 bg-slate-700/30">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Device Properties
                </h3>
            </div>

            {/* Properties Grid */}
            <div className="p-3 space-y-2">
                {isLoopDriver ? (
                    /* Loop Driver Properties */
                    <>
                        {/* Type - Always BSD-1000 */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Type</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded">
                                BSD-1000
                            </span>
                        </div>

                        {/* IP Address - Editable */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">IP</span>
                            <input
                                type="text"
                                value={selectedDevice.ipAddress || ''}
                                onChange={handleIpChange}
                                placeholder="0.0.0.0"
                                className="w-28 text-xs text-slate-200 font-mono bg-slate-700 border border-slate-600 
                                           rounded px-2 py-1 focus:outline-none focus:border-blue-500 
                                           placeholder:text-slate-500"
                            />
                        </div>

                        {/* Power On Button */}
                        <div className="pt-2">
                            <button
                                onClick={handlePowerOn}
                                className="w-full bg-green-600 hover:bg-green-500 text-white text-xs font-semibold 
                                           py-2 px-3 rounded transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Power On
                            </button>
                        </div>
                    </>
                ) : (
                    /* AG Socket Properties */
                    <>
                        {/* Type - Read only */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Type</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded">
                                {selectedDevice.deviceType}
                            </span>
                        </div>

                        {/* SN - Read only */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">SN</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded">
                                {formatSN(selectedDevice.sn)}
                            </span>
                        </div>

                        {/* Id - Read only, assigned when loop powers on */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Id</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded min-w-[60px] text-center">
                                {selectedDevice.deviceId !== null ? selectedDevice.deviceId : '—'}
                            </span>
                        </div>

                        {/* C_Address - Read only, assigned when loop powers on */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">C_Address</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded min-w-[60px] text-center">
                                {selectedDevice.cAddress !== null ? selectedDevice.cAddress : '—'}
                            </span>
                        </div>

                        {/* Label - Editable string, max 20 chars */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Label</span>
                            <input
                                type="text"
                                maxLength={20}
                                value={selectedDevice.label}
                                onChange={handleLabelChange}
                                placeholder="Enter label..."
                                className="w-32 text-xs text-slate-200 bg-slate-700 border border-slate-600 
                                           rounded px-2 py-1 focus:outline-none focus:border-blue-500 
                                           placeholder:text-slate-500"
                            />
                        </div>

                        {/* Character count for label */}
                        <div className="flex justify-end">
                            <span className="text-[10px] text-slate-500">
                                {selectedDevice.label.length}/20 characters
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
