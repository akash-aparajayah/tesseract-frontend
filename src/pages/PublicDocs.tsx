import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import apiDocs, { ApiDocumentation, ServiceWithProviders } from '../services/apiDocs';
import { useToast } from '../hooks/useToast';
import styles from '../styles/PublicDocs.module.css';

const PublicDocs = () => {
    const [services, setServices] = useState<ServiceWithProviders[]>([]);
    const [openService, setOpenService] = useState<string | null>(null);
    const [activeProvider, setActiveProvider] = useState<{ serviceId: string; providerId: string; providerName: string } | null>(null);
    const [activeDoc, setActiveDoc] = useState<ApiDocumentation | null>(null);
    const [loading, setLoading] = useState(true);
    const { showToast, ToastContainer } = useToast();

    // Fetch services and providers
    useEffect(() => {
        const fetchServices = async () => {
            try {
                setLoading(true);
                const response = await apiDocs.getServicesWithProviders();
                setServices(response.data.data);

                // Auto open first service and select first provider
                if (response.data.data.length > 0) {
                    const firstService = response.data.data[0];
                    setOpenService(firstService.id);
                    if (firstService.providers.length > 0) {
                        setActiveProvider({
                            serviceId: firstService.id,
                            providerId: firstService.providers[0].id,
                            providerName: firstService.providers[0].name
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch services:', error);
                showToast('Failed to fetch services', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, [showToast]);

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
                    } else {
                        setActiveDoc(null);
                    }
                } catch (error) {
                    console.error('Failed to fetch documentation:', error);
                    showToast('Failed to fetch documentation', 'error');
                }
            };
            fetchDocs();
        }
    }, [activeProvider, showToast]);

    const toggleService = (serviceId: string) => {
        if (openService === serviceId) {
            setOpenService(null);
        } else {
            setOpenService(serviceId);
            const service = services.find(s => s.id === serviceId);
            if (service && service.providers.length > 0) {
                setActiveProvider({
                    serviceId: service.id,
                    providerId: service.providers[0].id,
                    providerName: service.providers[0].name
                });
            }
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading documentation...</p>
            </div>
        );
    }

    return (
        <>
            <ToastContainer />
            <div className={styles.docsWrapper}>
                {/* Sidebar */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <h3>📚 API Documentation</h3>
                        <p>Services & Providers</p>
                    </div>
                    <div className={styles.sidebarMenu}>
                        {services.map((service) => (
                            <div key={service.id} className={styles.serviceItem}>
                                <div
                                    className={`${styles.serviceHeader} ${openService === service.id ? styles.serviceHeaderOpen : ''}`}
                                    onClick={() => toggleService(service.id)}
                                >
                                    <span className={styles.serviceName}>{service.name}</span>
                                    <span className={styles.serviceIcon}>
                                        {openService === service.id ? '▼' : '▶'}
                                    </span>
                                </div>
                                {openService === service.id && (
                                    <div className={styles.providerList}>
                                        {service.providers.map((provider) => (
                                            <div
                                                key={provider.id}
                                                className={`${styles.providerItem} ${activeProvider?.providerId === provider.id ? styles.providerItemActive : ''}`}
                                                onClick={() => setActiveProvider({
                                                    serviceId: service.id,
                                                    providerId: provider.id,
                                                    providerName: provider.name
                                                })}
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
                <div className={styles.mainContent}>
                    {activeDoc ? (
                        <div className={styles.contentWrapper}>
                            {/* API Header */}
                            <div className={styles.apiHeader}>
                                <h1 className={styles.apiTitle}>{activeDoc.name}</h1>
                                <p className={styles.apiDescription}>{activeDoc.description}</p>
                                <div className={styles.apiEndpoint}>
                                    <span className={`${styles.methodBadge} ${styles[activeDoc.type.toLowerCase()]}`}>
                                        {activeDoc.type}
                                    </span>
                                    <code className={styles.endpointUrl}>{activeDoc.url}</code>
                                </div>
                            </div>

                            {/* Headers Section */}
                            {activeDoc.headers && activeDoc.headers.length > 0 && activeDoc.headers[0].field && (
                                <div className={styles.section}>
                                    <h2 className={styles.sectionTitle}>Headers</h2>
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.docsTable}>
                                            <thead>
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

                            {/* Body Parameters Section */}
                            {activeDoc.body && activeDoc.body.length > 0 && activeDoc.body[0].field && (
                                <div className={styles.section}>
                                    <h2 className={styles.sectionTitle}>Body Parameters</h2>
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.docsTable}>
                                            <thead>
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
                                                        <td className={param.required === 'Required' ? styles.requiredText : styles.optionalText}>
                                                            {param.required === 'Required' ? 'Yes' : 'No'}
                                                        </td>
                                                        <td>{param.details}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Response Codes Section */}
                            {activeDoc.response && activeDoc.response.length > 0 && activeDoc.response[0].code && (
                                <div className={styles.section}>
                                    <h2 className={styles.sectionTitle}>Response Codes</h2>
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.docsTable}>
                                            <thead>
                                                <tr>
                                                    <th>Code</th>
                                                    <th>Meaning</th>
                                                    <th>Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {activeDoc.response.map((resp, idx) => (
                                                    <tr key={idx}>
                                                        <td className={styles.codeCell}>{resp.code}</td>
                                                        <td>{resp.subject}</td>
                                                        <td>{resp.details}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Request Example */}
                            {activeDoc.input && (
                                <div className={styles.section}>
                                    <h2 className={styles.sectionTitle}>Request Example</h2>
                                    <pre className={styles.codeBlock}>
                                        <code>{activeDoc.input}</code>
                                    </pre>
                                </div>
                            )}

                            {/* Response Example */}
                            {activeDoc.output && (
                                <div className={styles.section}>
                                    <h2 className={styles.sectionTitle}>Response Example</h2>
                                    <pre className={styles.codeBlock}>
                                        <code>{activeDoc.output}</code>
                                    </pre>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.emptyContent}>
                            <div className={styles.emptyIcon}>📖</div>
                            <h3>Select a service and provider</h3>
                            <p>Choose from the sidebar to view API documentation</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PublicDocs;