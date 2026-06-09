import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import apiDocs, { ApiDocumentation } from '../services/apiDocs';
import { useToast } from '../hooks/useToast';
import styles from '../styles/ApiDocsManagement.module.css';

const ApiDocsManagement = () => {
    const [records, setRecords] = useState<ApiDocumentation[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const { showToast, ToastContainer } = useToast();

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

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const response = await apiDocs.getAll({ search });
            setRecords(response.data.data.records);
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

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            fetchRecords();
        }
    };

    const toggleDropdown = (publicId: string) => {
        setOpenDropdownId(openDropdownId === publicId ? null : publicId);
    };

    return (
        <>
            <ToastContainer />
            <div className={styles.container}>
                <div className={styles.headerCard}>
                    <div className={styles.headerContent}>
                        <h4 className={styles.pageTitle}>API Documentation Management</h4>
                        <nav>
                            <ol className={styles.breadcrumb}>
                                <li className={styles.breadcrumbItem}>
                                    <NavLink className={styles.breadcrumbLink} to="/dashboard">Dashboard</NavLink>
                                </li>
                                <li className={styles.breadcrumbItem}>/</li>
                                <li className={styles.breadcrumbActive}>API Docs Management</li>
                            </ol>
                        </nav>
                    </div>
                </div>

                <div className={styles.mainCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.searchWrapper}>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search by name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={handleSearch}
                            />
                        </div>
                        <div>
                            <NavLink to="/dashboard/api-docs/add">
                                <button className={styles.addButton}>
                                    <i className="ri-add-line align-bottom me-1"></i> Add Documentation
                                </button>
                            </NavLink>
                        </div>
                    </div>

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