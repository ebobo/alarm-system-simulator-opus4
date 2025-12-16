import { useState, useEffect, useRef } from 'react';

interface SaveNameDialogProps {
    isOpen: boolean;
    onSave: (name: string) => void;
    onCancel: () => void;
}

export default function SaveNameDialog({ isOpen, onSave, onCancel }: SaveNameDialogProps) {
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when dialog opens
    useEffect(() => {
        if (isOpen) {
            setName('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Handle keyboard events
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && name.trim()) {
            onSave(name.trim());
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl p-6 w-96 shadow-2xl border border-slate-700">
                <h2 className="text-lg font-semibold text-white mb-4">Save Project</h2>

                <p className="text-sm text-slate-400 mb-4">
                    Enter a name for your project:
                </p>

                <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Project name..."
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg 
                             text-white placeholder-slate-400 
                             focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500
                             transition-all duration-200"
                />

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-300 
                                 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => name.trim() && onSave(name.trim())}
                        disabled={!name.trim()}
                        className="px-4 py-2 text-sm font-medium text-white 
                                 bg-gradient-to-r from-orange-500 to-red-500 
                                 hover:from-orange-600 hover:to-red-600
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/25"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
