/**
 * Utility functions for Green API integration
 */

/**
 * Detect the correct Green API host based on idInstance
 * Maps prefixes to specific clusters (e.g., 77xx -> 7700.api.green-api.com)
 */
export function getGreenApiHost(idInstance: string | number, providedUrl?: string): string {
    const defaultHost = 'https://7107.api.green-api.com';
    const altHost = 'https://7700.api.green-api.com';

    if (!idInstance) return providedUrl || defaultHost;

    const idStr = String(idInstance);

    // Si el ID empieza con 77, forzamos 7700 sin importar lo que venga de la DB
    if (idStr.startsWith('77')) {
        return altHost;
    }

    // Si empieza con 71, forzamos 7107
    if (idStr.startsWith('71')) {
        return defaultHost;
    }

    // Fallback al URL proveído o al default
    return providedUrl || defaultHost;
}
