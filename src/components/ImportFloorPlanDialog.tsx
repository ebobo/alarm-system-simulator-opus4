import { useState, useRef, useCallback, useEffect } from 'react';
import { importSVG, readFileAsText, type ImportResult } from '../utils/svgImporter';

interface ImportFloorPlanDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (svgContent: string) => void;
}

type InputMode = 'upload' | 'paste' | 'ai';

// Backend API URL for AI conversion
const AI_BACKEND_URL = 'http://localhost:3002';

export default function ImportFloorPlanDialog({ isOpen, onClose, onImport }: ImportFloorPlanDialogProps) {
    const [inputMode, setInputMode] = useState<InputMode>('upload');
    const [dragActive, setDragActive] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [pastedCode, setPastedCode] = useState('');
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiAvailable, setAiAvailable] = useState<boolean | null>(null); // null = checking, true/false = result
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Check if AI backend is available when dialog opens
    useEffect(() => {
        if (isOpen) {
            setAiAvailable(null); // Reset to checking state
            fetch(`${AI_BACKEND_URL}/health`, { method: 'GET' })
                .then(res => {
                    setAiAvailable(res.ok);
                })
                .catch(() => {
                    setAiAvailable(false);
                });
        }
    }, [isOpen]);

    const resetState = useCallback(() => {
        setImportResult(null);
        setFileName('');
        setDragActive(false);
        setIsProcessing(false);
        setPastedCode('');
        setAiError(null);
    }, []);

    const handleClose = useCallback(() => {
        resetState();
        onClose();
    }, [onClose, resetState]);

    const processContent = useCallback((content: string, source: string) => {
        setIsProcessing(true);
        setFileName(source);

        try {
            const result = importSVG(content);
            setImportResult(result);
        } catch {
            setImportResult({
                success: false,
                errors: [{ field: 'content', message: 'Failed to parse SVG content' }]
            });
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const processFile = useCallback(async (file: File) => {
        if (!file.name.toLowerCase().endsWith('.svg')) {
            setImportResult({
                success: false,
                errors: [{ field: 'file', message: 'Please select an SVG file' }]
            });
            return;
        }

        setIsProcessing(true);
        setFileName(file.name);

        try {
            const content = await readFileAsText(file);
            const result = importSVG(content);
            setImportResult(result);
        } catch {
            setImportResult({
                success: false,
                errors: [{ field: 'file', message: 'Failed to read file' }]
            });
        } finally {
            setIsProcessing(false);
        }
    }, []);

    // AI Image conversion
    const processImageWithAI = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setAiError('Please select an image file (PNG, JPG, etc.)');
            return;
        }

        setIsProcessing(true);
        setFileName(file.name);
        setAiError(null);
        setImportResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${AI_BACKEND_URL}/api/convert-image`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success && data.svg) {
                // Validate the SVG from AI
                const result = importSVG(data.svg);
                setImportResult(result);
                if (result.success) {
                    setFileName(`AI Generated (${data.roomCount} rooms)`);
                }
            } else {
                setAiError(data.error || 'Failed to convert image');
                if (data.validationErrors) {
                    setAiError(`${data.error}: ${data.validationErrors.join(', ')}`);
                }
            }
        } catch (err) {
            setAiError(err instanceof Error ? err.message : 'Failed to connect to AI service');
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            if (inputMode === 'ai') {
                processImageWithAI(e.dataTransfer.files[0]);
            } else {
                processFile(e.dataTransfer.files[0]);
            }
        }
    }, [processFile, processImageWithAI, inputMode]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    }, [processFile]);

    const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processImageWithAI(e.target.files[0]);
        }
    }, [processImageWithAI]);

    const handlePasteValidate = useCallback(() => {
        if (!pastedCode.trim()) {
            setImportResult({
                success: false,
                errors: [{ field: 'content', message: 'Please paste SVG code' }]
            });
            return;
        }
        processContent(pastedCode, 'Pasted SVG');
    }, [pastedCode, processContent]);

    const handleImport = useCallback(() => {
        if (importResult?.success && importResult.svgContent) {
            onImport(importResult.svgContent);
            handleClose();
        }
    }, [importResult, onImport, handleClose]);

    const handleModeChange = useCallback((mode: InputMode) => {
        setInputMode(mode);
        setImportResult(null);
        setFileName('');
        setPastedCode('');
        setAiError(null);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Dialog */}
            <div className="relative bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 border border-slate-700">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Import Floor Plan</h2>
                            <p className="text-xs text-slate-400">Upload SVG, paste code, or use AI</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => handleModeChange('upload')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
                                ${inputMode === 'upload'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-transparent'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            SVG
                        </button>
                        <button
                            onClick={() => handleModeChange('paste')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
                                ${inputMode === 'paste'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-transparent'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Paste
                        </button>
                        <div className="relative flex-1 group">
                            <button
                                onClick={() => aiAvailable && handleModeChange('ai')}
                                disabled={!aiAvailable}
                                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
                                    ${!aiAvailable
                                        ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed border border-transparent'
                                        : inputMode === 'ai'
                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-transparent'
                                    }`}
                            >
                                {aiAvailable === null ? (
                                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                )}
                                AI Image
                            </button>
                            {aiAvailable === false && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-xs text-slate-300 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    AI service unavailable (port 3002)
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload SVG Mode */}
                    {inputMode === 'upload' && (
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                                ${dragActive
                                    ? 'border-blue-400 bg-blue-500/10'
                                    : importResult?.success
                                        ? 'border-emerald-500 bg-emerald-500/10'
                                        : importResult && !importResult.success
                                            ? 'border-red-500 bg-red-500/10'
                                            : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".svg"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {isProcessing ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-slate-300">Processing...</p>
                                </div>
                            ) : importResult?.success ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-emerald-400 font-medium">{fileName}</p>
                                        <p className="text-slate-400 text-sm mt-1">
                                            {importResult.rooms?.length} rooms detected
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">
                                            {dragActive ? 'Drop SVG file here' : 'Drag & drop SVG file'}
                                        </p>
                                        <p className="text-slate-400 text-sm mt-1">
                                            or click to browse
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Paste Mode */}
                    {inputMode === 'paste' && (
                        <div className="space-y-3">
                            <textarea
                                value={pastedCode}
                                onChange={(e) => {
                                    setPastedCode(e.target.value);
                                    setImportResult(null);
                                }}
                                placeholder="Paste your SVG code here..."
                                className={`w-full h-40 px-4 py-3 bg-slate-700/50 border rounded-xl text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 transition-all font-mono
                                    ${importResult?.success
                                        ? 'border-emerald-500 focus:ring-emerald-500/50'
                                        : importResult && !importResult.success
                                            ? 'border-red-500 focus:ring-red-500/50'
                                            : 'border-slate-600 focus:ring-blue-500/50 focus:border-blue-500'
                                    }`}
                            />
                            <button
                                onClick={handlePasteValidate}
                                disabled={!pastedCode.trim() || isProcessing}
                                className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
                                    ${pastedCode.trim()
                                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                        : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                {importResult?.success ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {importResult.rooms?.length} rooms detected
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Validate SVG
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* AI Image Mode */}
                    {inputMode === 'ai' && (
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => imageInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                                ${dragActive
                                    ? 'border-purple-400 bg-purple-500/10'
                                    : importResult?.success
                                        ? 'border-emerald-500 bg-emerald-500/10'
                                        : aiError
                                            ? 'border-red-500 bg-red-500/10'
                                            : 'border-slate-600 hover:border-purple-500/50 hover:bg-purple-500/5'
                                }`}
                        >
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />

                            {isProcessing ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-slate-300">AI is analyzing your floor plan...</p>
                                    <p className="text-slate-500 text-xs">This may take 10-30 seconds</p>
                                </div>
                            ) : importResult?.success ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-emerald-400 font-medium">{fileName}</p>
                                        <p className="text-slate-400 text-sm mt-1">
                                            {importResult.rooms?.length} rooms detected
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">
                                            {dragActive ? 'Drop image here' : 'Upload floor plan image'}
                                        </p>
                                        <p className="text-slate-400 text-sm mt-1">
                                            PNG, JPG - AI will convert to SVG
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* AI Error */}
                    {aiError && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-red-400 font-medium text-sm">AI Conversion Error</span>
                            </div>
                            <p className="text-red-300 text-sm">{aiError}</p>
                        </div>
                    )}

                    {/* Validation Errors */}
                    {importResult && !importResult.success && importResult.errors.length > 0 && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-red-400 font-medium text-sm">Validation Errors</span>
                            </div>
                            <ul className="space-y-1">
                                {importResult.errors.map((error, idx) => (
                                    <li key={idx} className="text-red-300 text-sm">
                                        {error.roomId && <span className="text-red-400">[{error.roomId}]</span>} {error.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Room Preview */}
                    {importResult?.success && importResult.rooms && importResult.rooms.length > 0 && (
                        <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                            <p className="text-slate-300 text-sm font-medium mb-2">Detected Rooms:</p>
                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                {importResult.rooms.map((room) => (
                                    <div key={room.id} className="flex items-center gap-2 text-xs">
                                        <div
                                            className="w-3 h-3 rounded"
                                            style={{
                                                backgroundColor: {
                                                    office: '#E8F4FD',
                                                    meeting: '#FFF3E0',
                                                    toilet: '#E8F5E9',
                                                    entrance: '#F5F5F5',
                                                    public: '#F5F5F5',
                                                    server: '#FCE4EC',
                                                    storage: '#EDE7F6',
                                                    bedroom: '#E1BEE7',
                                                    living_room: '#FFE0B2',
                                                    kitchen: '#C8E6C9',
                                                    dining: '#FFCDD2',
                                                    utility: '#CFD8DC',
                                                    hallway: '#F5F5F5',
                                                }[room.type] || '#ccc'
                                            }}
                                        />
                                        <span className="text-slate-300 truncate">{room.label}</span>
                                        <span className="text-slate-500">({room.type})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Help text */}
                    <p className="mt-4 text-xs text-slate-500 text-center">
                        {inputMode === 'ai'
                            ? 'AI conversion requires the fire-alarm-ai backend running on port 3002'
                            : 'SVG must contain rect elements with data-room-* attributes'
                        }
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-700 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!importResult?.success}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all
                            ${importResult?.success
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg'
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        Import Floor Plan
                    </button>
                </div>
            </div>
        </div>
    );
}
