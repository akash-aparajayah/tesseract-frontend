import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import apiDocs, { ApiDocumentation, ServiceWithProviders } from '../services/apiDocs';

const ServiceProviderDocs = () => {
    const [services, setServices] = useState<ServiceWithProviders[]>([]);
    const [openService, setOpenService] = useState<string | null>(null);
    const [activeProvider, setActiveProvider] = useState<{ serviceId: string; providerId: string } | null>(null);
    const [activeDoc, setActiveDoc] = useState<ApiDocumentation | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch services and providers
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await apiDocs.getServicesWithProviders();
                setServices(response.data.data);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch services:', error);
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    // Fetch documentation when provider is selected
    useEffect(() => {
        if (activeProvider) {
            const fetchDocs = async () => {
                try {
                    const response = await apiDocs.getDocsByService(activeProvider.serviceId);
                    const providerDocs = response.data.data.find(
                        (item: any) => item.provider?.public_id === activeProvider.providerId
                    );
                    if (providerDocs && providerDocs.apis.length > 0) {
                        setActiveDoc(providerDocs.apis[0]);
                    }
                } catch (error) {
                    console.error('Failed to fetch documentation:', error);
                }
            };
            fetchDocs();
        }
    }, [activeProvider]);

    const toggleService = (serviceId: string) => {
        if (openService === serviceId) {
            setOpenService(null);
        } else {
            setOpenService(serviceId);
            const service = services.find(s => s.id === serviceId);
            if (service && service.providers.length > 0) {
                setActiveProvider({
                    serviceId: service.id,
                    providerId: service.providers[0].id
                });
            }
        }
    };

    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center vh-100">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading documentation...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex" style={{ minHeight: '100vh' }}>
            {/* Sidebar */}
            <div className="bg-dark text-white" style={{ width: '280px', minHeight: '100vh', position: 'fixed', overflowY: 'auto' }}>
                <div className="p-3 border-bottom border-secondary">
                    <h4 className="mb-0">📚 API Documentation</h4>
                    <small className="text-muted">Services & Providers</small>
                </div>
                <div className="p-2">
                    {services.map((service) => (
                        <div key={service.id} className="mb-2">
                            <div
                                className={`d-flex justify-content-between align-items-center p-2 rounded cursor-pointer ${openService === service.id ? 'bg-primary' : 'hover-bg-secondary'
                                    }`}
                                onClick={() => toggleService(service.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <span>{service.name}</span>
                                {openService === service.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </div>
                            {openService === service.id && (
                                <div className="ms-3 mt-1">
                                    {service.providers.map((provider) => (
                                        <div
                                            key={provider.id}
                                            className={`p-2 rounded small cursor-pointer ${activeProvider?.providerId === provider.id ? 'bg-primary bg-opacity-50' : 'hover-bg-secondary'
                                                }`}
                                            onClick={() => setActiveProvider({ serviceId: service.id, providerId: provider.id })}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {provider.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ marginLeft: '280px', flex: 1, padding: '2rem' }}>
                {activeDoc ? (
                    <div className="container-fluid">
                        <div className="card shadow-sm mb-4">
                            <div className="card-body">
                                <h1 className="h2 mb-3">{activeDoc.name}</h1>
                                <p className="text-muted">{activeDoc.description}</p>
                                <div className="alert alert-info">
                                    <strong>{activeDoc.type}</strong>
                                    <code className="ms-2">{activeDoc.url}</code>
                                </div>
                            </div>
                        </div>

                        {activeDoc.headers && activeDoc.headers.length > 0 && (
                            <div className="card shadow-sm mb-4">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Headers</h5>
                                </div>
                                <div className="card-body">
                                    <table className="table table-bordered">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Field</th>
                                                <th>Type</th>
                                                <th>Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeDoc.headers.map((header, idx) => (
                                                <tr key={idx}>
                                                    <td>{header.field}</td>
                                                    <td>{header.type}</td>
                                                    <td>{header.details}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeDoc.body && activeDoc.body.length > 0 && (
                            <div className="card shadow-sm mb-4">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Body Parameters</h5>
                                </div>
                                <div className="card-body">
                                    <table className="table table-bordered">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Field</th>
                                                <th>Type</th>
                                                <th>Required</th>
                                                <th>Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeDoc.body.map((param, idx) => (
                                                <tr key={idx}>
                                                    <td>{param.field}</td>
                                                    <td>{param.type}</td>
                                                    <td>{param.required}</td>
                                                    <td>{param.details}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeDoc.response && activeDoc.response.length > 0 && (
                            <div className="card shadow-sm mb-4">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Response Codes</h5>
                                </div>
                                <div className="card-body">
                                    <table className="table table-bordered">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Code</th>
                                                <th>Meaning</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeDoc.response.map((resp, idx) => (
                                                <tr key={idx}>
                                                    <td>{resp.code}</td>
                                                    <td>{resp.subject}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeDoc.input && (
                            <div className="card shadow-sm mb-4">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Request Example</h5>
                                </div>
                                <div className="card-body">
                                    <div dangerouslySetInnerHTML={{ __html: activeDoc.input }} />
                                </div>
                            </div>
                        )}

                        {activeDoc.output && (
                            <div className="card shadow-sm mb-4">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Response Example</h5>
                                </div>
                                <div className="card-body">
                                    <div dangerouslySetInnerHTML={{ __html: activeDoc.output }} />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center mt-5">
                        <BookOpen size={64} className="text-muted mb-3" />
                        <h3>Select a service and provider</h3>
                        <p className="text-muted">Choose from the sidebar to view API documentation</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceProviderDocs;