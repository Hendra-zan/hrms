export function toValidUuidOrNull(id: unknown): string | null {
    if (!id || typeof id !== 'string') return null;
    const str = id.trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str) ? str : null;
}
