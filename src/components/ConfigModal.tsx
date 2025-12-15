import { useState } from 'react';
import type { RoomConfig } from '../utils/floorPlanGenerator';

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (config: RoomConfig) => void;
    initialConfig: RoomConfig;
}

export default function ConfigModal({ isOpen, onClose, onApply, initialConfig }: ConfigModalProps) {
    const [config, setConfig] = useState<RoomConfig>(initialConfig);

    if (!isOpen) return null;

    const handleApply = () => {
        onApply(config);
        onClose();
    };

    const updateConfig = (key: keyof RoomConfig, value: number) => {
        setConfig(prev => ({ ...prev, [key]: Math.max(0, Math.min(10, value)) }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Configure Floor Plan</h2>
                    <p className="text-sm text-slate-400 mt-1">Set the number of rooms to generate</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Offices */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Offices</label>
                            <span className="text-xs text-gray-500">1.0x size</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => updateConfig('offices', config.offices - 1)}
                                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-xl font-bold text-gray-600"
                            >
                                −
                            </button>
                            <div className="flex-1 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-lg font-semibold text-gray-800">
                                {config.offices}
                            </div>
                            <button
                                onClick={() => updateConfig('offices', config.offices + 1)}
                                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-xl font-bold text-gray-600"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Meeting Rooms */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Meeting Rooms</label>
                            <span className="text-xs text-gray-500">3.0x size (large)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => updateConfig('meetingRooms', config.meetingRooms - 1)}
                                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-xl font-bold text-gray-600"
                            >
                                −
                            </button>
                            <div className="flex-1 h-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-lg font-semibold text-gray-800">
                                {config.meetingRooms}
                            </div>
                            <button
                                onClick={() => updateConfig('meetingRooms', config.meetingRooms + 1)}
                                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-xl font-bold text-gray-600"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Toilets */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Toilets</label>
                            <span className="text-xs text-gray-500">0.4x size (small, min 100px)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => updateConfig('toilets', config.toilets - 1)}
                                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-xl font-bold text-gray-600"
                            >
                                −
                            </button>
                            <div className="flex-1 h-10 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center text-lg font-semibold text-gray-800">
                                {config.toilets}
                            </div>
                            <button
                                onClick={() => updateConfig('toilets', config.toilets + 1)}
                                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-xl font-bold text-gray-600"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <p className="text-xs text-blue-700">
                            <strong>Tip:</strong> The generator will distribute rooms across the four perimeter strips around the central public area. Server and Storage rooms may be auto-added to fill gaps.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/25 transition-all"
                    >
                        Generate Plan
                    </button>
                </div>
            </div>
        </div>
    );
}
