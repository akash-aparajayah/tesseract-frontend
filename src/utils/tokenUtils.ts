import { ApiToken } from "../types/token";

const TOKEN_PREFIX = "env_";

export function generateToken(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = TOKEN_PREFIX;
    for (let i = 0; i < 40; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function getExpiryDate(days: string, customDays?: string): string {
    const now = new Date();
    let daysNum = 0;

    switch (days) {
        case "7": daysNum = 7; break;
        case "30": daysNum = 30; break;
        case "60": daysNum = 60; break;
        case "90": daysNum = 90; break;
        case "custom": daysNum = parseInt(customDays || "0"); break;
        case "never": return "Never";
    }

    if (daysNum === 0) return "Never";

    const expiry = new Date(now.getTime() + daysNum * 24 * 60 * 60 * 1000);
    return expiry.toISOString().split('T')[0];
}

export function getExpiryDays(days: string, customDays?: string): number | null {
    switch (days) {
        case "7": return 7;
        case "30": return 30;
        case "60": return 60;
        case "90": return 90;
        case "custom": return parseInt(customDays || "0") || null;
        case "never": return null;
    }
    return null;
}

export function formatDate(dateString: string): string {
    if (dateString === "Never") return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Save token with instance
export function saveToken(projectId: string, environmentName: string, instance: string, token: ApiToken): void {
    const key = `token_${projectId}_${environmentName}_${instance}`;
    localStorage.setItem(key, JSON.stringify(token));
}

export function getToken(projectId: string, environmentName: string, instance: string): ApiToken | null {
    const key = `token_${projectId}_${environmentName}_${instance}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
}

// Get all tokens for a project (across all environments and instances)
export function getAllTokens(projectId: string): Record<string, ApiToken> {
    const tokens: Record<string, ApiToken> = {};
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
        const match = key.match(new RegExp(`^token_${projectId}_(.+)_(Sandbox|Live)$`));
        if (match) {
            const envName = match[1];
            const instance = match[2];
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    // Key format: "envName_instance"
                    tokens[`${envName}_${instance}`] = JSON.parse(data);
                } catch { }
            }
        }
    });
    return tokens;
}

export function markTokenRevealed(projectId: string, environmentName: string, instance: string): void {
    const token = getToken(projectId, environmentName, instance);
    if (token) {
        token.revealed = true;
        saveToken(projectId, environmentName, instance, token);
    }
}

export function deleteToken(projectId: string, environmentName: string, instance: string): void {
    localStorage.removeItem(`token_${projectId}_${environmentName}_${instance}`);
}

export function calculateExpiryLabel(expires: string, expiresInDays: number | null): string {
    if (expiresInDays === null) return "Never expires";
    const now = new Date();
    const expiry = new Date(expires);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Expired";
    if (diffDays === 1) return "1 day left";
    return `${diffDays} days left`;
}