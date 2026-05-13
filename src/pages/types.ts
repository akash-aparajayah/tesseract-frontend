export type Provider = {
    id: number;
    name: string;
    fields: Record<string, string>;
};

export interface ProviderField {
    name: string;
    label: string;
    type: string;
    required?: boolean;
    icon?: string;
    image_url?: string;
}