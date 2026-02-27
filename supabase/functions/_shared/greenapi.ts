/**
 * Detect the correct Green API host based on idInstance
 * Maps prefixes to specific clústeres (e.g., 77xx -> 7700.api.green-api.com)
 */
export function getGreenApiHost(idInstance: string, providedUrl?: string): string {
    const defaultHost = 'https://7107.api.green-api.com';
    const altHost = 'https://7700.api.green-api.com';

    if (!idInstance) return providedUrl || defaultHost;

    const idStr = String(idInstance);

    // Si ya viene un URL, respetamos si usa el dominio con o sin guion
    if (providedUrl) {
        const isDashless = providedUrl.includes('greenapi.com');
        const domain = isDashless ? 'greenapi.com' : 'green-api.com';

        if (idStr.startsWith('77')) return `https://7700.api.${domain}`;
        if (idStr.startsWith('71')) return `https://7107.api.${domain}`;

        return providedUrl;
    }

    // Default con guion (oficial)
    if (idStr.startsWith('77')) return 'https://7700.api.green-api.com';
    if (idStr.startsWith('71')) return 'https://7107.api.green-api.com';

    return defaultHost;
}
