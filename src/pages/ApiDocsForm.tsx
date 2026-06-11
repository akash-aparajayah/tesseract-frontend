import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import apiDocs, { ApiDocumentation } from '../services/apiDocs';
import { useToast } from '../hooks/useToast';
import { getAllServices, getProvidersByServiceId } from '../services/projectApi';
import styles from '../styles/ApiDocsForm.module.css';

interface ServiceType {
    public_id: string;
    name: string;
    slug: string;
}

interface ProviderType {
    public_id: string;
    name: string;
    slug: string;
}

const ApiDocsForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast, ToastContainer } = useToast();

    // ----------- API BASE URL -----------
    const API_BASE_URL = "https://ibv-api.salesplanner.org/api/";

    const [record, setRecord] = useState<Partial<ApiDocumentation>>({
        name: "",
        type: "GET",
        url: "",
        description: "",
        header: "",
        input: "",
        output: "",
        headers: [{ field: '', type: 'String', details: '' }],
        body: [{ field: '', type: 'String', required: 'Optional', details: '' }],
        response: [{ code: '', subject: '', details: '' }],
        is_active: true
    });

    const [services, setServices] = useState<ServiceType[]>([]);
    const [providers, setProviders] = useState<ProviderType[]>([]);
    const [loading, setLoading] = useState(false);


    // Fetch services
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await getAllServices();
                setServices(response.data || response);
            } catch (error) {
                console.error('Failed to fetch services:', error);
                showToast('Failed to fetch services', 'error');
            }
        };
        fetchServices();
    }, [showToast]);

    // Fetch providers when service changes
    // Fetch providers when service changes
    useEffect(() => {
        const serviceId = record.service_type_id;
        if (serviceId) {
            const fetchProviders = async () => {
                try {
                    const response = await getProvidersByServiceId(serviceId);
                    const allProviders = response.data || response;

                    // Fetch existing records to filter out used providers
                    const recordsResponse = await apiDocs.getAll({});
                    const existingRecords = recordsResponse.data.data.records;

                    // Filter out providers that already have documentation for this service
                    const usedProviderIds = existingRecords
                        .filter((record: any) => {
                            // When editing, exclude current record
                            if (id && record.public_id === id) return false;
                            return record.service_type?.public_id === serviceId || record.service_type_id === serviceId;
                        })
                        .map((record: any) => record.provider?.public_id || record.provider_id)
                        .filter(Boolean); // Remove undefined/null values

                    const filteredProviders = allProviders.filter(
                        (provider: any) => !usedProviderIds.includes(provider.public_id)
                    );

                    setProviders(filteredProviders);
                } catch (error) {
                    console.error('Failed to fetch providers:', error);
                    showToast('Failed to fetch providers', 'error');
                }
            };
            fetchProviders();
        } else {
            setProviders([]);
        }
    }, [record.service_type_id, showToast, id]);

    // Fetch record if editing
    useEffect(() => {
        if (id) {
            const fetchRecord = async () => {
                try {
                    setLoading(true);
                    const response = await apiDocs.getById(id);
                    const data = response.data.data;
                    setRecord(data);
                } catch (error) {
                    showToast('Failed to fetch record', 'error');
                } finally {
                    setLoading(false);
                }
            };
            fetchRecord();
        }
    }, [id, showToast]);

    const handleInputChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;

        if (name === "url") {
            let updatedValue = value;

            if (!updatedValue.startsWith(API_BASE_URL)) {
                updatedValue =
                    API_BASE_URL +
                    updatedValue.replace(API_BASE_URL, "");
            }

            setRecord({
                ...record,
                url: updatedValue,
            });

            return;
        }

        setRecord({
            ...record,
            [name]: value,
        });
    };

    const handleArrayChange = (
        type: 'headers' | 'body' | 'response',
        idx: number,
        field: string,
        value: string
    ) => {
        const items = [...(record[type] || [])] as any[];
        items[idx][field] = value;
        setRecord({ ...record, [type]: items });
    };

    const handleAddRow = (type: 'headers' | 'body' | 'response') => {
        let newRow: any;
        if (type === 'headers') {
            newRow = { field: '', type: 'String', details: '' };
        } else if (type === 'body') {
            newRow = { field: '', type: 'String', required: 'Optional', details: '' };
        } else {
            newRow = { code: '', subject: '', details: '' };
        }
        setRecord({ ...record, [type]: [...(record[type] || []), newRow] });
    };

    const handleRemoveRow = (type: 'headers' | 'body' | 'response', idx: number) => {
        const items = [...(record[type] || [])];
        items.splice(idx, 1);
        setRecord({ ...record, [type]: items });
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const data = { ...record };

            if (id) {
                await apiDocs.update(id, data);
                showToast('Documentation updated successfully', 'success');
            } else {
                await apiDocs.create(data);
                showToast('Documentation created successfully', 'success');
            }
            navigate('/dashboard/api-docs');
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to save', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && id) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <ToastContainer />
            <div className={styles.container}>
                <div className={styles.headerCard}>
                    <div className={styles.headerContent}>
                        <h4 className={styles.pageTitle}>{id ? 'Edit' : 'Add'} API Documentation</h4>
                        <nav aria-label="breadcrumb">
                            <ol className={styles.breadcrumb}>
                                <li className={styles.breadcrumbItem}>
                                    <NavLink className={styles.breadcrumbLink} to="/dashboard">Dashboard</NavLink>
                                </li>
                                <li className={styles.breadcrumbItem}>
                                    <NavLink className={styles.breadcrumbLink} to="/dashboard/api-docs">API Docs</NavLink>
                                </li>
                                <li className={styles.breadcrumbItem}>/</li>
                                <li className={styles.breadcrumbActive}>{id ? 'Edit' : 'Add'}</li>
                            </ol>
                        </nav>
                    </div>
                </div>

                <div className={styles.mainCard}>
                    <div className={styles.cardBody}>
                        <form onSubmit={onSubmit}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        Service <span className={styles.required}>*</span>
                                    </label>
                                    <select
                                        className={styles.formSelect}
                                        name="service_type_id"
                                        value={record.service_type_id || ''}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Service</option>
                                        {services.map(s => (
                                            <option key={s.public_id} value={s.public_id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Provider</label>
                                    <select
                                        className={styles.formSelect}
                                        name="provider_id"
                                        value={record.provider_id || ''}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select Provider (Optional)</option>
                                        {providers.map(p => (
                                            <option key={p.public_id} value={p.public_id}>{p.name}</option>
                                        ))}
                                        {record.service_type_id && providers.length === 0 && (
                                            <option value="" disabled>All providers for this service have documentation</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        API Name <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        name="url"
                                        value={record.url || API_BASE_URL}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        Type <span className={styles.required}>*</span>
                                    </label>
                                    <select className={styles.formSelect} name="type" value={record.type} onChange={handleInputChange}>
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                        <option value="PUT">PUT</option>
                                        <option value="DELETE">DELETE</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>
                                    URL <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    name="url"
                                    value={record.url || ''}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Description</label>
                                <textarea
                                    className={styles.formTextarea}
                                    name="description"
                                    value={record.description || ''}
                                    onChange={handleInputChange}
                                    rows={3}
                                />
                            </div>

                            {/* Headers Section */}
                            <h5 className={styles.sectionTitle}>Headers</h5>
                            <div className={styles.tableWrapper}>
                                <table className={styles.dataTable}>
                                    <thead>
                                        <tr>
                                            <th>Field</th>
                                            <th>Type</th>
                                            <th>Details</th>
                                            <th style={{ width: '80px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(record.headers || []).map((row, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className={styles.tableInput}
                                                        value={row.field}
                                                        onChange={(e) => handleArrayChange('headers', idx, 'field', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        className={styles.tableSelect}
                                                        value={row.type}
                                                        onChange={(e) => handleArrayChange('headers', idx, 'type', e.target.value)}
                                                    >
                                                        <option value="String">String</option>
                                                        <option value="Number">Number</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className={styles.tableInput}
                                                        value={row.details}
                                                        onChange={(e) => handleArrayChange('headers', idx, 'details', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                                                        onClick={() => handleRemoveRow('headers', idx)}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`}
                                onClick={() => handleAddRow('headers')}
                            >
                                Add Header
                            </button>

                            {/* Body Parameters Section */}
                            <h5 className={styles.sectionTitle}>Body Parameters</h5>
                            <div className={styles.tableWrapper}>
                                <table className={styles.dataTable}>
                                    <thead>
                                        <tr>
                                            <th>Field</th>
                                            <th>Type</th>
                                            <th>Required</th>
                                            <th>Details</th>
                                            <th style={{ width: '80px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(record.body || []).map((row, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className={styles.tableInput}
                                                        value={row.field}
                                                        onChange={(e) => handleArrayChange('body', idx, 'field', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        className={styles.tableSelect}
                                                        value={row.type}
                                                        onChange={(e) => handleArrayChange('body', idx, 'type', e.target.value)}
                                                    >
                                                        <option value="String">String</option>
                                                        <option value="Number">Number</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <select
                                                        className={styles.tableSelect}
                                                        value={row.required}
                                                        onChange={(e) => handleArrayChange('body', idx, 'required', e.target.value)}
                                                    >
                                                        <option value="Required">Yes</option>
                                                        <option value="Optional">No</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className={styles.tableInput}
                                                        value={row.details}
                                                        onChange={(e) => handleArrayChange('body', idx, 'details', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                                                        onClick={() => handleRemoveRow('body', idx)}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`}
                                onClick={() => handleAddRow('body')}
                            >
                                Add Body Param
                            </button>

                            {/* Response Section */}
                            <h5 className={styles.sectionTitle}>Response Codes</h5>
                            <div className={styles.tableWrapper}>
                                <table className={styles.dataTable}>
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Meaning</th>
                                            <th style={{ width: '80px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(record.response || []).map((row, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className={styles.tableInput}
                                                        value={row.code}
                                                        onChange={(e) => handleArrayChange('response', idx, 'code', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className={styles.tableInput}
                                                        value={row.subject}
                                                        onChange={(e) => handleArrayChange('response', idx, 'subject', e.target.value)}
                                                    />
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                                                        onClick={() => handleRemoveRow('response', idx)}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`}
                                onClick={() => handleAddRow('response')}
                            >
                                Add Response
                            </button>

                            {/* Plain Textareas for Documentation */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Header Documentation</label>
                                <textarea
                                    className={styles.formTextarea}
                                    rows={5}
                                    value={record.header || ''}
                                    onChange={(e) => setRecord({ ...record, header: e.target.value })}
                                    placeholder="Enter header documentation..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Request Example</label>
                                <textarea
                                    className={styles.formTextarea}
                                    rows={5}
                                    value={record.input || ''}
                                    onChange={(e) => setRecord({ ...record, input: e.target.value })}
                                    placeholder="Enter request example..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Response Example</label>
                                <textarea
                                    className={styles.formTextarea}
                                    rows={5}
                                    value={record.output || ''}
                                    onChange={(e) => setRecord({ ...record, output: e.target.value })}
                                    placeholder="Enter response example..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Status</label>
                                <select
                                    className={styles.formSelect}
                                    value={record.is_active ? 'true' : 'false'}
                                    onChange={(e) => setRecord({ ...record, is_active: e.target.value === 'true' })}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>

                            <div className={styles.buttonGroup}>
                                <button
                                    type="submit"
                                    className={`${styles.btn} ${styles.btnPrimary}`}
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.btn} ${styles.btnSecondary}`}
                                    onClick={() => navigate('/dashboard/api-docs')}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ApiDocsForm;