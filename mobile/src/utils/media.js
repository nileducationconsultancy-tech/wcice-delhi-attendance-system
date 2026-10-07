import { API_BASE_URL } from '../constants/config';

/**
 * Resolves full media URL for Supabase, remote host, or local backend paths
 * @param {string} pathOrUrl 
 * @returns {string|null}
 */
export const resolveMediaUrl = (pathOrUrl) => {
    if (!pathOrUrl || typeof pathOrUrl !== 'string') return null;
    const trimmed = pathOrUrl.trim();
    if (!trimmed) return null;

    if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('data:') ||
        trimmed.startsWith('file:') ||
        trimmed.startsWith('blob:')
    ) {
        return trimmed;
    }

    const base = (API_BASE_URL || 'http://192.168.1.11:5000').replace(/\/$/, '');
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${base}${cleanPath}`;
};

export default resolveMediaUrl;
