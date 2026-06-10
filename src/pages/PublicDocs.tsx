import { useState, useEffect } from 'react';
import apiDocs, { ApiDocumentation, ServiceWithProviders } from '../services/apiDocs';
import { useToast } from '../hooks/useToast';
import styles from '../styles/PublicDocs.module.css';

const PublicDocs = () => {
    const [services, setServices] = useState<ServiceWithProviders[]>([]);
    const [openService, setOpenService] = useState<string | null>(null);
    const [activeProvider, setActiveProvider] = useState<{ serviceId: string; providerId: string; providerName: string } | null>(null);
    const [activeDoc, setActiveDoc] = useState<ApiDocumentation | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState('');
    const { showToast, ToastContainer } = useToast();

    // Fetch services and providers
    useEffect(() => {
        const fetchServices = async () => {
            try {
                setLoading(true);
                const response = await apiDocs.getServicesWithProviders();
                setServices(response.data.data);

                // Check if there's a saved provider in localStorage
                const savedProvider = localStorage.getItem('activeProvider');
                const savedService = localStorage.getItem('activeService');

                if (savedProvider && savedService) {
                    // Restore saved state
                    setOpenService(savedService);
                    const service = response.data.data.find((s: any) => s.id === savedService);
                    if (service) {
                        const provider = service.providers.find((p: any) => p.id === savedProvider);
                        if (provider) {
                            setActiveProvider({
                                serviceId: savedService,
                                providerId: savedProvider,
                                providerName: provider.name
                            });
                            return;
                        }
                    }
                }

                // Default: Auto open first service and select first provider
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
            localStorage.setItem('activeService', serviceId);
            const service = services.find(s => s.id === serviceId);
            if (service && service.providers.length > 0) {
                setActiveProvider({
                    serviceId: service.id,
                    providerId: service.providers[0].id,
                    providerName: service.providers[0].name
                });
                localStorage.setItem('activeProvider', service.providers[0].id);
            }
        }
    };

    const handleCopy = async (url: string, type: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(type);
            setTimeout(() => setCopied(''), 2000);
        } catch (err) {
            console.error("Copy failed", err);
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
                {/* Left Menu Sidebar */}
                <div className={styles.leftMenu}>
                    <div className={styles.contentLogo}>
                        <div className={styles.logo1}>
                            <h2>API Docs</h2>
                        </div>
                    </div>
                    <div className={styles.contentMenu}>
                        <div className={styles.contentInfos}>
                            <div className={styles.info}>API Documentation</div>
                            <div className={styles.info}><b>Version:</b> 1.0.0</div>
                            <div className={styles.info}><b>Last Updated:</b> 05th May, 2026</div>
                        </div>
                        <div>
                            <label className={styles.legendLabel}>
                                <i className="fas fa-folder"></i> API Endpoints
                            </label>
                            <ul className={styles.apiList}>
                                {services.map((service) => (
                                    <li key={service.id} className={styles.serviceGroup}>
                                        <div
                                            className={`${styles.serviceParent} ${openService === service.id ? styles.serviceParentActive : ''}`}
                                            onClick={() => toggleService(service.id)}
                                        >
                                            <span>{service.name}</span>
                                            <i className={`fas fa-chevron-${openService === service.id ? 'down' : 'right'}`}></i>
                                        </div>
                                        {openService === service.id && (
                                            <ul className={styles.providerSubList}>
                                                {service.providers.map((provider) => (
                                                    <li
                                                        key={provider.id}
                                                        className={`${styles.providerItem} ${activeProvider?.providerId === provider.id ? styles.providerItemActive : ''}`}
                                                        onClick={() => {
                                                            setActiveProvider({
                                                                serviceId: service.id,
                                                                providerId: provider.id,
                                                                providerName: provider.name
                                                            });
                                                            localStorage.setItem('activeService', service.id);
                                                            localStorage.setItem('activeProvider', provider.id);
                                                        }}
                                                    >
                                                        <span>{provider.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Content Page */}
                <div className={styles.contentPage}>
                    <div className={styles.content}>
                        {activeDoc ? (
                            <>
                                {/* API Header Section */}
                                <div className={styles.contentSection} id="content-get-started">
                                    <h1>{activeDoc.name}</h1>
                                    <p>{activeDoc.description}</p>
                                </div>

                                {/* API Details Section */}
                                <div className={styles.contentSection} id="content-get-characters">
                                    <h2>get characters</h2>
                                    <p>
                                        To get characters you need to make a call to the following url :<br />
                                        <button type="button" className={styles.methodBtn}>
                                            {activeDoc.type}
                                        </button>
                                        <code className={styles.highlighted}>
                                            {copied === 'Sandbox' ? "Copied! ✅" : activeDoc.url}
                                        </code>
                                        <i
                                            className={`fas fa-copy ${styles.copyIcon}`}
                                            onClick={() => handleCopy(activeDoc.url, 'Sandbox')}
                                        ></i>
                                    </p>
                                    <br />

                                    {/* Headers Section */}
                                    {activeDoc.headers && activeDoc.headers.length > 0 && activeDoc.headers[0].field && (
                                        <div>
                                            <h4>HEADERS</h4>
                                            <table className={styles.apiTable}>
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
                                            <br />
                                        </div>
                                    )}

                                    {/* Body Parameters Section */}
                                    {activeDoc.body && activeDoc.body.length > 0 && activeDoc.body[0].field && (
                                        <div>
                                            <h4>BODY PARAMETERS</h4>
                                            <table className={styles.apiTable}>
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
                                                            <td className={styles.textCenter}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={param.required === 'Required'}
                                                                    readOnly
                                                                />
                                                            </td>
                                                            <td>{param.details}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Response Section */}
                                <div className={styles.contentSection} id="content-errors">
                                    <h2>Response</h2>
                                    <p>
                                        The BridgeKey API uses the following response codes:
                                    </p>
                                    <table className={styles.apiTable}>
                                        <thead>
                                            <tr>
                                                <th>Code</th>
                                                <th>Meaning</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeDoc.response && activeDoc.response.length > 0 && activeDoc.response.map((resp, idx) => (
                                                <tr key={idx}>
                                                    <td><strong>{resp.code}</strong></td>
                                                    <td>{resp.subject}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className={styles.emptyContent}>
                                <div className={styles.emptyIcon}>📖</div>
                                <h3>Select a service and provider</h3>
                                <p>Choose from the sidebar to view API documentation</p>
                            </div>
                        )}
                    </div>

                    {/* Right Code Column */}
                    <div className={styles.contentCode}>
                        {activeDoc && (
                            <>
                                {/* Request Body Section */}
                                {activeDoc.input && (
                                    <div className={styles.codeSection}>
                                        <h3 className={styles.codeHeading}>Request</h3>
                                        <h4 className={styles.codeSubHeading}>Body</h4>
                                        <pre className={styles.codeBlock}>
                                            <code>{activeDoc.input}</code>
                                        </pre>
                                    </div>
                                )}

                                {/* Response Section */}
                                {activeDoc.output && (
                                    <div className={styles.codeSection}>
                                        <h3 className={styles.codeHeading}>Response</h3>
                                        <pre className={styles.codeBlock}>
                                            <code>{activeDoc.output}</code>
                                        </pre>
                                    </div>
                                )}

                                {/* Response Codes Section in Right Column */}
                                {/* {activeDoc.response && activeDoc.response.length > 0 && (
                                    <div className={styles.codeSection}>
                                        <h3 className={styles.codeHeading}>Response Codes</h3>
                                        {activeDoc.response.map((resp, idx) => (
                                            <div key={idx} className={styles.responseItem}>
                                                <h4 className={styles.codeSubHeading}>{resp.code} Response :</h4>
                                                <pre className={styles.codeBlock}>
                                                    <code>{resp.details}</code>
                                                </pre>
                                            </div>
                                        ))}
                                    </div>
                                )} */}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default PublicDocs;