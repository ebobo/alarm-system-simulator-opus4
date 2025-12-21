// FloatingContainer - Reusable draggable floating window component
// Used for detachable property panels and other floating UI elements

import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface FloatingContainerProps {
    position: { x: number; y: number };
    onPositionChange: (pos: { x: number; y: number }) => void;
    onDock?: () => void;
    title: string;
    children: ReactNode;
    minWidth?: number;
    minHeight?: number;
}

export default function FloatingContainer({
    position,
    onPositionChange,
    onDock,
    title,
    children,
    minWidth = 320,
    minHeight = 200
}: FloatingContainerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Handle drag start
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Only start drag from header area
        if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
            e.preventDefault();
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    }, [position.x, position.y]);

    // Handle drag move
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            // Calculate new position
            let newX = e.clientX - dragOffset.x;
            let newY = e.clientY - dragOffset.y;

            // Constrain to viewport
            const maxX = window.innerWidth - minWidth;
            const maxY = window.innerHeight - minHeight;
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            onPositionChange({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, onPositionChange, minWidth, minHeight]);

    // Render as portal to escape parent container constraints
    return createPortal(
        <div
            ref={containerRef}
            className="fixed z-50 bg-slate-800 rounded-lg shadow-2xl border border-slate-600 overflow-hidden"
            style={{
                left: position.x,
                top: position.y,
                minWidth,
                minHeight,
                cursor: isDragging ? 'grabbing' : 'default'
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Header / Drag Handle */}
            <div
                data-drag-handle
                className="flex items-center justify-between px-3 py-2 bg-slate-700 border-b border-slate-600 cursor-grab active:cursor-grabbing select-none"
            >
                <span className="text-sm font-medium text-white">{title}</span>
                <div className="flex items-center gap-1">
                    {/* Dock button */}
                    {onDock && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDock();
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-600 transition-colors"
                            title="Dock to sidebar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                {children}
            </div>
        </div>,
        document.body
    );
}
