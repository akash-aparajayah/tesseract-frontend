import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import apiDocs, { ApiDocumentation } from '../services/apiDocs';
import { useToast } from '../hooks/useToast';
import styles from '../styles/ApiDocsManagement.module.css';
import { getAllServices } from '../services/projectApi';
import { X, Filter } from "lucide-react";

const ApiDocsManagement = () => {
    const [records, setRecords] = useState<ApiDocumentation[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [filterService, setFilterService] = useState('');
    const [filterProvider, setFilterProvider] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [showFilterSidebar, setShowFilterSidebar] = useState(false);
    const [services, setServices] = useState<any[]>([]);
    const [providers, setProviders] = useState<any[]>([]);
    const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const { showToast, ToastContainer } = useToast();

    const hasActiveFilters =
        !!filterService ||
        !!filterProvider ||
        !!filterStatus ||
        !!filterType;


    // Fetch services and providers for filter dropdowns
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                // Get services from projectApi
                const servicesData = await getAllServices();
                setServices(servicesData.data || servicesData || []);

                // Get providers from apiDocs (using existing method)
                const providersRes = await apiDocs.getServicesWithProviders();
                if (providersRes.data?.data) {
                    // Extract all unique providers from services
                    const allProviders: any[] = [];
                    providersRes.data.data.forEach((service: any) => {
                        if (service.providers) {
                            service.providers.forEach((provider: any) => {
                                // Check if provider already exists in array
                                const exists = allProviders.some(
                                    (p) => (p.public_id || p.id) === (provider.public_id || provider.id)
                                );
                                if (!exists) {
                                    allProviders.push(provider);
                                }
                            });
                        }
                    });
                    setProviders(allProviders);
                }
            } catch (error) {
                console.error('Failed to fetch filter data:', error);
            }
        };
        fetchFilterData();
    }, []);

    useEffect(() => {
        fetchRecords();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdownId) {
                const dropdownElement = dropdownRefs.current[openDropdownId];
                if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
                    setOpenDropdownId(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdownId]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchRecords();
        }, 500);

        return () => clearTimeout(timeout);
    }, [
        search,
        filterService,
        filterProvider,
        filterStatus,
        filterType
    ]);

    const buildParams = (
        searchValue = search,
        serviceValue = filterService,
        providerValue = filterProvider,
        statusValue = filterStatus,
        typeValue = filterType
    ) => {
        const params: any = {};

        if (searchValue) params.search = searchValue;
        if (serviceValue) params.service_type_id = serviceValue;
        if (providerValue) params.provider_id = providerValue;
        if (statusValue)
            params.is_active = statusValue === "active";
        if (typeValue)
            params.type = typeValue;

        return params;
    };

    const fetchRecords = async () => {
        try {
            setLoading(true);

            const response = await apiDocs.getAll(
                buildParams()
            );

            setRecords(response.data.data.records || []);
        } catch (error) {
            showToast('Failed to fetch records', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this documentation?')) {
            try {
                await apiDocs.delete(id);
                showToast('Documentation deleted successfully', 'success');
                fetchRecords();
            } catch (error) {
                showToast('Failed to delete', 'error');
            }
        }
    };

    const toggleDropdown = (publicId: string) => {
        setOpenDropdownId(openDropdownId === publicId ? null : publicId);
    };

    return (
        <>
            <ToastContainer />
            <div className={styles.container}>

                <div className={styles.mainCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.topActions}>

                            {/* Search */}
                            <div className={styles.searchWrapper}>
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    placeholder="Search API, Service, Provider..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />

                                {search.trim() !== "" && (
                                    <button
                                        type="button"
                                        className={styles.searchClearBtn}
                                        onClick={() => setSearch("")}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            <div className={styles.rightActions}>

                                <button
                                    className={styles.filterButton}
                                    onClick={() => setShowFilterSidebar(true)}
                                >
                                    <Filter size={16} />
                                    Filters
                                </button>

                                <NavLink to="/dashboard/api-docs/add">
                                    <button className={styles.addButton}>
                                        <i className="ri-add-line"></i>
                                        Add Documentation
                                    </button>
                                </NavLink>

                            </div>
                        </div>
                    </div>

                    {showFilterSidebar && (
                        <>

                            <div className={styles.filterSidebar}>

                                <div className={styles.sidebarHeader}>
                                    <h5>Filters</h5>

                                    <button
                                        className={styles.closeSidebarBtn}
                                        onClick={() => setShowFilterSidebar(false)}
                                    >
                                        <i className="ri-close-line"></i>
                                    </button>
                                </div>

                                <div className={styles.sidebarBody}>

                                    <label>Service</label>
                                    <select
                                        className={styles.filterSelect}
                                        value={filterService}
                                        onChange={(e) => setFilterService(e.target.value)}
                                    >
                                        <option value="">All Services</option>
                                        {services.map((s: any) => (
                                            <option
                                                key={s.public_id}
                                                value={s.public_id}
                                            >
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>

                                    <label>Provider</label>
                                    <select
                                        className={styles.filterSelect}
                                        value={filterProvider}
                                        onChange={(e) => setFilterProvider(e.target.value)}
                                    >
                                        <option value="">All Providers</option>
                                        {providers.map((p: any) => (
                                            <option
                                                key={p.public_id || p.id}
                                                value={p.public_id || p.id}
                                            >
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>

                                    <label>Type</label>
                                    <select
                                        className={styles.filterSelect}
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                    >
                                        <option value="">All Types</option>
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                        <option value="PUT">PUT</option>
                                        <option value="DELETE">DELETE</option>
                                    </select>

                                    <label>Status</label>
                                    <select
                                        className={styles.filterSelect}
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>

                                </div>

                                <div className={styles.sidebarFooter}>
                                    <button
                                        className={styles.clearFiltersBtn}
                                        disabled={!hasActiveFilters}
                                        onClick={() => {
                                            setFilterService('');
                                            setFilterProvider('');
                                            setFilterStatus('');
                                            setFilterType('');
                                        }}
                                    >
                                        Clear Filters
                                    </button>

                                    <button
                                        className={styles.cancelBtn}
                                        onClick={() => setShowFilterSidebar(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>

                            </div>
                        </>
                    )}

                    <div className={styles.cardBody}>
                        <div className="table-responsive">
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Service</th>
                                        <th>Provider</th>
                                        <th>API Name</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                                                <div className={styles.spinner}></div>
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : records.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                                                No records found
                                            </td>
                                        </tr>
                                    ) : (
                                        records.map((row, i) => (
                                            <tr key={row.public_id}>
                                                <td>{(i + 1)}</td>
                                                <td>{row.service_type?.name || '-'}</td>
                                                <td>{row.provider?.name || 'General'}</td>
                                                <td>{row.name}</td>
                                                <td>
                                                    <span className={styles.typeBadge}>{row.type}</span>
                                                </td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${row.is_active ? styles.statusActive : styles.statusInactive}`}>
                                                        {row.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div
                                                        className={styles.actionDropdown}
                                                        ref={(el) => {
                                                            if (row.public_id) {
                                                                dropdownRefs.current[row.public_id] = el;
                                                            }
                                                        }}
                                                    >
                                                        <button
                                                            className={styles.actionButton}
                                                            onClick={() => row.public_id && toggleDropdown(row.public_id)}
                                                        >
                                                            <span style={{ fontSize: '20px' }}>⋮</span>
                                                        </button>
                                                        {openDropdownId === row.public_id && (
                                                            <div className={styles.dropdownMenu}>
                                                                <NavLink
                                                                    className={styles.dropdownItem}
                                                                    to={`/dashboard/api-docs/edit/${row.public_id}`}
                                                                    onClick={() => setOpenDropdownId(null)}
                                                                >
                                                                    <i className="ri-pencil-fill align-bottom me-2"></i> Edit
                                                                </NavLink>
                                                                <button
                                                                    className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                                                    onClick={() => {
                                                                        setOpenDropdownId(null);
                                                                        handleDelete(row.public_id!);
                                                                    }}
                                                                >
                                                                    <i className="ri-delete-bin-fill align-bottom me-2"></i> Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ApiDocsManagement;