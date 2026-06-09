import api from './api'; // Your axios instance

export interface HeaderField {
    field: string;
    type: string;
    details: string;
}

export interface BodyField {
    field: string;
    type: string;
    required: string;
    details: string;
}

export interface ResponseField {
    code: string;
    subject: string;
    details: string;
}

export interface ApiDocumentation {
    id?: string;
    public_id?: string;
    service_type_id: string;
    provider_id: string;
    name: string;
    type: string;
    url: string;
    description: string;
    header: string;
    input: string;
    output: string;
    headers: HeaderField[];
    body: BodyField[];
    response: ResponseField[];
    order: number;
    is_active: boolean;
    service_type?: { name: string; public_id: string };
    provider?: { name: string; public_id: string };
}

export interface ServiceWithProviders {
    id: string;
    name: string;
    slug: string;
    providers: Array<{ id: string; name: string; slug: string }>;
}

const ApiDocsService = {
    // Public endpoints
    getServicesWithProviders: () =>
        api.get<{ data: ServiceWithProviders[] }>('/docs/public/services'),

    getDocsByService: (serviceId: string) =>
        api.get<{ data: any[] }>(`/docs/public/service/${serviceId}`),

    getPublicDocById: (id: string) =>
        api.get<{ data: ApiDocumentation }>(`/docs/public/${id}`),

    // Admin endpoints
    getAll: (params?: { service_type_id?: string; provider_id?: string; search?: string; page?: number; limit?: number }) =>
        api.get<{ data: { records: ApiDocumentation[]; total: number; totalPages: number } }>('/docs', { params }),

    getById: (id: string) =>
        api.get<{ data: ApiDocumentation }>(`/docs/${id}`),

    create: (data: Partial<ApiDocumentation>) =>
        api.post<{ data: ApiDocumentation }>('/docs', data),

    update: (id: string, data: Partial<ApiDocumentation>) =>
        api.put<{ data: ApiDocumentation }>(`/docs/${id}`, data),

    delete: (id: string) =>
        api.delete(`/docs/${id}`)
};

export default ApiDocsService;