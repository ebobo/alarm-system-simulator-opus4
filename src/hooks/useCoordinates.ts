import { useCallback } from 'react';
import type { ViewportTransform } from '../types/devices';

/**
 * Hook providing coordinate conversion utilities between screen and floor plan coordinates.
 * 
 * The floor plan is transformed by: translate(positionX, positionY) scale(scale)
 * This means:
 *   screenPos = planPos * scale + position
 *   planPos = (screenPos - position) / scale
 */
export function useCoordinates() {
    /**
     * Convert screen coordinates to floor plan coordinates.
     * Used when dropping a device to determine where it should be placed in plan space.
     * 
     * @param screenX - X position in screen/viewport pixels
     * @param screenY - Y position in screen/viewport pixels
     * @param transform - Current viewport transform (scale, positionX/Y)
     * @param containerRect - Bounding rect of the container element
     * @returns Plan coordinates {x, y}
     */
    const screenToFloorPlan = useCallback((
        screenX: number,
        screenY: number,
        transform: ViewportTransform,
        containerRect: DOMRect
    ): { x: number; y: number } => {
        // Subtract container position to get coordinates relative to container
        const relativeX = screenX - containerRect.left;
        const relativeY = screenY - containerRect.top;

        // Reverse the transform: (screenPos - translate) / scale = planPos
        const x = (relativeX - transform.positionX) / transform.scale;
        const y = (relativeY - transform.positionY) / transform.scale;

        return { x, y };
    }, []);

    /**
     * Convert floor plan coordinates to screen coordinates.
     * Used when rendering devices to position them correctly relative to container.
     * Note: This is usually not needed since devices are rendered inside the 
     * TransformComponent which handles the transformation automatically.
     * 
     * @param planX - X position in plan coordinates
     * @param planY - Y position in plan coordinates
     * @param transform - Current viewport transform
     * @returns Screen coordinates {x, y} relative to container
     */
    const floorPlanToScreen = useCallback((
        planX: number,
        planY: number,
        transform: ViewportTransform
    ): { x: number; y: number } => {
        // Apply transform: planPos * scale + translate = screenPos
        const x = planX * transform.scale + transform.positionX;
        const y = planY * transform.scale + transform.positionY;

        return { x, y };
    }, []);

    return {
        screenToFloorPlan,
        floorPlanToScreen,
    };
}
