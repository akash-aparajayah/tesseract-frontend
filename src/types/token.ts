export interface ApiToken {
    id: string;
    name: string;
    token: string;
    projectId: string;
    environmentName: string; // ADDED
    created: string;
    expires: string;
    expiresInDays: number | null;
    revealed: boolean;
}

export interface TokenFormData {
    name: string;
    expiration: string;
    customDays: string;
}