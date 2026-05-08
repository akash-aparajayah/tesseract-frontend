import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import "../styles/EnvironmentManagement.css";
import { createPortal } from 'react-dom';
interface EnvironmentProvider {
    id: string;
    name: string;
    serviceCounts: {
        sms: number;
        email: number;
        whatsapp: number;
    };
    lastModified: string;
}

// Custom Select Dropdown Component
function CustomSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const options = [
        { value: "Local", label: "Local", icon: "" },
        { value: "Dev", label: "Dev", icon: "" },
        { value: "Staging", label: "Staging", icon: "" },
        { value: "Live", label: "Live", icon: "" },
        { value: "__custom__", label: "Add Custom", icon: "+" },
    ];

    // Get position for portal dropdown
    const getMenuStyle = (): React.CSSProperties => {
        if (!triggerRef.current) return {};
        const rect = triggerRef.current.getBoundingClientRect();
        return {
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
        };
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
                menuRef.current && !menuRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handler);
        }
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const selected = options.find(o => o.value === value);
    const displayText = selected ? `${selected.icon} ${selected.label}` : "🌍 Select environment";

    return (
        <div className="custom-select">
            <div
                ref={triggerRef}
                className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selected ? 'selected-text' : 'placeholder-text'}>{displayText}</span>
                <svg className={`arrow ${isOpen ? 'up' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="#6366F1">
                    <path d="M7 10l5 5 5-5z" />
                </svg>
            </div>

            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    className="custom-select-menu"
                    style={getMenuStyle()}
                >
                    {options.map(option => (
                        <div
                            key={option.value}
                            className={`custom-select-item ${option.value === value ? 'selected' : ''} ${option.value === '__custom__' ? 'add-custom' : ''}`}
                            onClick={() => { onChange(option.value); setIsOpen(false); }}
                        >
                            <span className="item-icon">{option.icon}</span>
                            <span className="item-label">{option.label}</span>
                            {option.value === value && <span className="check">✓</span>}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
}

export default function EnvironmentManagement() {
    const navigate = useNavigate();
    const location = useLocation();
    const { project } = location.state || {};
    const { showToast, ToastContainer } = useToast();

    const [menuOpen, setMenuOpen] = useState<string | null>(null);
    const [selectedEnvironment, setSelectedEnvironment] = useState<string>("");
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customEnvName, setCustomEnvName] = useState("");
    const [configuredEnvironments, setConfiguredEnvironments] = useState<EnvironmentProvider[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);

    // Clone modal states
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [cloneSource, setCloneSource] = useState<string>("");
    const [cloneTarget, setCloneTarget] = useState<string>("");
    const [cloneCustomMode, setCloneCustomMode] = useState(false);
    const [cloneCustomName, setCloneCustomName] = useState("");

    useEffect(() => {
        if (!project) {
            setTimeout(() => navigate("/dashboard/project"), 2000);
            return;
        }
        loadConfiguredEnvironments();

        const handleProviderUpdate = () => loadConfiguredEnvironments();
        window.addEventListener('providerCountsUpdated', handleProviderUpdate);
        window.addEventListener('storage', handleProviderUpdate);

        return () => {
            window.removeEventListener('providerCountsUpdated', handleProviderUpdate);
            window.removeEventListener('storage', handleProviderUpdate);
        };
    }, [project]);

    useEffect(() => {
        const handleClickOutside = () => setMenuOpen(null);
        if (menuOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [menuOpen]);

    const loadConfiguredEnvironments = () => {
        const envNames = ['Local', 'Dev', 'Staging', 'Live'];
        const allKeys = Object.keys(localStorage);
        const customEnvs = new Set<string>();

        allKeys.forEach(key => {
            const match = key.match(/^env_(.+)_(sms|email|whatsapp)_providers$/);
            if (match && !envNames.includes(match[1])) {
                customEnvs.add(match[1]);
            }
        });

        const allEnvs = [...envNames, ...customEnvs];
        const environments: EnvironmentProvider[] = [];

        allEnvs.forEach(envName => {
            const smsKey = `env_${envName}_sms_providers`;
            const emailKey = `env_${envName}_email_providers`;
            const whatsappKey = `env_${envName}_whatsapp_providers`;

            const smsData = JSON.parse(localStorage.getItem(smsKey) || '{"providers":[]}');
            const emailData = JSON.parse(localStorage.getItem(emailKey) || '{"providers":[]}');
            const whatsappData = JSON.parse(localStorage.getItem(whatsappKey) || '{"providers":[]}');

            const serviceCounts = {
                sms: smsData.providers?.length || 0,
                email: emailData.providers?.length || 0,
                whatsapp: whatsappData.providers?.length || 0
            };

            const totalProviders = serviceCounts.sms + serviceCounts.email + serviceCounts.whatsapp;

            if (totalProviders > 0) {
                const timestamps = [
                    smsData.timestamp,
                    emailData.timestamp,
                    whatsappData.timestamp
                ].filter(Boolean);

                environments.push({
                    id: envName,
                    name: envName,
                    serviceCounts,
                    lastModified: timestamps.length ? new Date(Math.max(...timestamps)).toLocaleDateString() : 'N/A'
                });
            }
        });

        environments.sort((a, b) => {
            const aTime = a.lastModified !== 'N/A' ? new Date(a.lastModified).getTime() : 0;
            const bTime = b.lastModified !== 'N/A' ? new Date(b.lastModified).getTime() : 0;
            return bTime - aTime;
        });

        setConfiguredEnvironments(environments);
    };

    const getAvailableTargetEnvs = () => {
        const presetEnvs = ['Local', 'Dev', 'Staging', 'Live'];
        const configuredNames = configuredEnvironments.map(e => e.name);
        return presetEnvs.filter(env => !configuredNames.includes(env));
    };

    const openCloneModal = (envName: string) => {
        setCloneSource(envName);
        setCloneTarget("");
        setCloneCustomMode(false);
        setCloneCustomName("");
        setShowCloneModal(true);
        setMenuOpen(null);
    };

    const executeClone = () => {
        let targetName = cloneTarget;

        if (cloneCustomMode && cloneCustomName.trim()) {
            targetName = cloneCustomName.trim();
        }

        if (!targetName) {
            showToast("Please select or enter a target environment", "error");
            return;
        }

        const smsKey = `env_${targetName}_sms_providers`;
        const emailKey = `env_${targetName}_email_providers`;
        const whatsappKey = `env_${targetName}_whatsapp_providers`;

        const smsData = JSON.parse(localStorage.getItem(smsKey) || '{"providers":[]}');
        const emailData = JSON.parse(localStorage.getItem(emailKey) || '{"providers":[]}');
        const whatsappData = JSON.parse(localStorage.getItem(whatsappKey) || '{"providers":[]}');

        const totalExisting = (smsData.providers?.length || 0) +
            (emailData.providers?.length || 0) +
            (whatsappData.providers?.length || 0);

        if (totalExisting > 0) {
            showToast("Target environment already has providers!", "error");
            return;
        }

        const services = ['sms', 'email', 'whatsapp'];

        services.forEach(service => {
            const sourceKey = `env_${cloneSource}_${service}_providers`;
            const sourceData = localStorage.getItem(sourceKey);
            if (sourceData) {
                const parsed = JSON.parse(sourceData);
                const destKey = `env_${targetName}_${service}_providers`;
                localStorage.setItem(destKey, JSON.stringify({
                    ...parsed,
                    timestamp: Date.now()
                }));
            }
        });

        loadConfiguredEnvironments();
        showToast(`Environment cloned to "${targetName}" successfully!`, "success");
        setShowCloneModal(false);
    };

    const addEnvironment = () => {
        let envName = selectedEnvironment;

        if (isCustomMode && customEnvName.trim()) {
            envName = customEnvName.trim();
        }

        if (envName) {
            navigate(`/dashboard/provider-config/${envName}`, {
                state: { project, environmentName: envName }
            });
        }
    };

    const handleCustomSelectChange = (value: string) => {
        if (value === "__custom__") {
            setIsCustomMode(true);
            setSelectedEnvironment("");
        } else {
            setIsCustomMode(false);
            setSelectedEnvironment(value);
        }
    };

    const handleCloneTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === "__custom__") {
            setCloneCustomMode(true);
            setCloneTarget("");
        } else {
            setCloneCustomMode(false);
            setCloneTarget(value);
        }
    };

    const handleEnvCardClick = (env: EnvironmentProvider, service?: string) => {
        navigate(`/dashboard/provider-config/${env.name}`, {
            state: {
                project,
                environmentName: env.name,
                activeService: service || null
            }
        });
    };

    const getEnvIcon = (name: string) => {
        const icons: Record<string, string> = {
            'Local': '🏠',
            'Dev': '💻',
            'Staging': '🚀',
            'Live': '🌍'
        };
        return icons[name] || '🔧';
    };

    if (!project) {
        return (
            <div className="loading">
                <p>Loading...</p>
            </div>
        );
    }

    const hasConfiguredEnvs = configuredEnvironments.length > 0;
    const availableTargets = getAvailableTargetEnvs();

    return (
        <div className={hasConfiguredEnvs ? "env-grid-container" : "env-container-simple"}>
            <ToastContainer />
            {hasConfiguredEnvs ? (
                <>
                    <div className="env-grid-header">
                        <h2>{project?.name} - Environments</h2>
                        <p>{configuredEnvironments.length} environment(s) configured</p>
                    </div>

                    <div className="env-grid">
                        {configuredEnvironments.map((env) => (
                            <div key={env.id} className="env-grid-card" onClick={() => handleEnvCardClick(env)}>
                                <div className="env-card-header">
                                    <span className="env-card-icon">{getEnvIcon(env.name)}</span>
                                    <span className="env-card-name">{env.name}</span>

                                    <div className="env-card-menu" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="menu-dots-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMenuOpen(menuOpen === env.id ? null : env.id);
                                            }}
                                        >
                                            ⋮
                                        </button>
                                        {menuOpen === env.id && (
                                            <div className="menu-dropdown">
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    openCloneModal(env.name);
                                                }}>
                                                    📋 Clone Environment
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="env-service-badges">
                                    {env.serviceCounts.sms > 0 && (
                                        <span
                                            className="service-badge sms"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEnvCardClick(env, 'SMS');
                                            }}
                                        >
                                            💬 SMS ({env.serviceCounts.sms})
                                        </span>
                                    )}
                                    {env.serviceCounts.email > 0 && (
                                        <span
                                            className="service-badge email"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEnvCardClick(env, 'EMAIL');
                                            }}
                                        >
                                            ✉️ Email ({env.serviceCounts.email})
                                        </span>
                                    )}
                                    {env.serviceCounts.whatsapp > 0 && (
                                        <span
                                            className="service-badge whatsapp"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEnvCardClick(env, 'WHATSAPP');
                                            }}
                                        >
                                            💚 WhatsApp ({env.serviceCounts.whatsapp})
                                        </span>
                                    )}
                                </div>

                                <div className="env-card-footer">
                                    <span className="env-modified">Modified: {env.lastModified}</span>
                                    <span className="env-arrow">→</span>
                                </div>
                            </div>
                        ))}

                        {!showAddForm ? (
                            <div className="env-grid-card add-new-card" onClick={() => setShowAddForm(true)}>
                                <div className="add-card-content">
                                    <span className="add-icon">+</span>
                                    <span className="add-text">Add Environment</span>
                                </div>
                            </div>
                        ) : (
                            <div className="env-grid-card add-form-card" onClick={(e) => e.stopPropagation()}>
                                <div className="env-card-simple-small">
                                    <div className="env-icon-small">🌍</div>
                                    <h3>Add Environment</h3>

                                    <div className="env-controls-small">
                                        <select
                                            className="env-dropdown"
                                            value={isCustomMode ? "__custom__" : selectedEnvironment}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === "__custom__") {
                                                    setIsCustomMode(true);
                                                    setSelectedEnvironment("");
                                                } else {
                                                    setIsCustomMode(false);
                                                    setSelectedEnvironment(value);
                                                }
                                            }}
                                        >
                                            <option value="">-- Select --</option>
                                            <option value="Local">Local</option>
                                            <option value="Dev">Dev</option>
                                            <option value="Staging">Staging</option>
                                            <option value="Live">Live</option>
                                            <option value="__custom__">+ Custom</option>
                                        </select>

                                        {isCustomMode && (
                                            <input
                                                type="text"
                                                placeholder="Enter name"
                                                value={customEnvName}
                                                onChange={(e) => setCustomEnvName(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && addEnvironment()}
                                                className="custom-input-small"
                                                autoFocus
                                            />
                                        )}

                                        {((selectedEnvironment && !isCustomMode) || (isCustomMode && customEnvName.trim())) && (
                                            <button className="add-btn-small" onClick={addEnvironment}>
                                                Continue →
                                            </button>
                                        )}

                                        <button className="cancel-add-btn-small" onClick={() => {
                                            setShowAddForm(false);
                                            setIsCustomMode(false);
                                            setSelectedEnvironment("");
                                            setCustomEnvName("");
                                        }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                // Split Screen Layout for First-Time View
                <>
                    {/* Left Panel - SVG Illustration */}
                    <div className="env-illustration-panel">
                        <div className="illustration-wrapper">
                            <svg
                                className="illustration-svg"
                                viewBox="0 0 450 420"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {/* Background Circle Decorations */}
                                <circle cx="80" cy="80" r="60" fill="rgba(99,102,241,0.08)" />
                                <circle cx="370" cy="350" r="80" fill="rgba(99,102,241,0.06)" />
                                <circle cx="400" cy="60" r="30" fill="rgba(129,140,248,0.1)" />

                                {/* Laptop/Desktop */}
                                <g transform="translate(50, 160)">
                                    <rect x="55" y="140" width="60" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
                                    <rect x="70" y="148" width="30" height="6" rx="3" fill="rgba(255,255,255,0.2)" />
                                    <rect x="10" y="10" width="150" height="110" rx="10" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
                                    <rect x="18" y="18" width="134" height="94" rx="6" fill="#1e1b4b" />
                                    <rect x="25" y="25" width="40" height="6" rx="3" fill="rgba(99,102,241,0.6)" />
                                    <rect x="25" y="38" width="80" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
                                    <rect x="25" y="55" width="55" height="35" rx="4" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
                                    <rect x="90" y="55" width="55" height="35" rx="4" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
                                    <rect x="30" y="78" width="6" height="8" rx="2" fill="rgba(99,102,241,0.6)" />
                                    <rect x="40" y="72" width="6" height="14" rx="2" fill="rgba(99,102,241,0.7)" />
                                    <rect x="50" y="75" width="6" height="11" rx="2" fill="rgba(99,102,241,0.5)" />
                                    <rect x="60" y="68" width="6" height="18" rx="2" fill="rgba(99,102,241,0.8)" />
                                    <polyline points="95,80 108,72 120,76 132,65" stroke="rgba(16,185,129,0.6)" strokeWidth="2" fill="none" />
                                    <circle cx="95" cy="80" r="2" fill="#10B981" />
                                    <circle cx="108" cy="72" r="2" fill="#10B981" />
                                    <circle cx="120" cy="76" r="2" fill="#10B981" />
                                    <circle cx="132" cy="65" r="2" fill="#10B981" />
                                    <rect x="15" y="120" width="140" height="18" rx="4" fill="rgba(255,255,255,0.2)" />
                                    <rect x="20" y="124" width="8" height="4" rx="1" fill="rgba(255,255,255,0.3)" />
                                    <rect x="30" y="124" width="8" height="4" rx="1" fill="rgba(255,255,255,0.3)" />
                                    <rect x="40" y="124" width="8" height="4" rx="1" fill="rgba(255,255,255,0.3)" />
                                    <rect x="50" y="124" width="8" height="4" rx="1" fill="rgba(255,255,255,0.3)" />
                                    <rect x="60" y="124" width="8" height="4" rx="1" fill="rgba(255,255,255,0.3)" />
                                    <rect x="70" y="124" width="8" height="4" rx="1" fill="rgba(255,255,255,0.3)" />
                                    <rect x="80" y="124" width="8" height="4" rx="1" fill="rgba(255,255,255,0.3)" />
                                    <rect x="100" y="124" width="40" height="4" rx="1" fill="rgba(255,255,255,0.3)" />
                                </g>

                                {/* Developer/Person */}
                                <g transform="translate(260, 160)">
                                    <rect x="30" y="55" width="80" height="60" rx="10" fill="rgba(99,102,241,0.3)" />
                                    <circle cx="70" cy="35" r="28" fill="rgba(255,255,255,0.2)" />
                                    <path d="M42 30 Q42 5 70 5 Q98 5 98 30" fill="rgba(255,255,255,0.15)" />
                                    <rect x="50" y="28" width="16" height="12" rx="3" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                                    <rect x="74" y="28" width="16" height="12" rx="3" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                                    <line x1="66" y1="34" x2="74" y2="34" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                                    <path d="M58 45 Q70 52 82 45" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                    <rect x="10" y="65" width="20" height="8" rx="4" fill="rgba(99,102,241,0.25)" />
                                    <rect x="110" y="55" width="20" height="8" rx="4" fill="rgba(99,102,241,0.25)" />
                                    <circle cx="15" cy="73" r="4" fill="rgba(255,255,255,0.3)" />
                                    <circle cx="125" cy="55" r="4" fill="rgba(255,255,255,0.3)" />
                                </g>

                                {/* Floating Environment Cards */}
                                <g>
                                    <g>
                                        <animateTransform attributeName="transform" type="translate" values="0,0;0,-10;0,0" dur="3s" repeatCount="indefinite" />
                                        <rect x="60" y="30" width="90" height="40" rx="8" fill="rgba(16,185,129,0.2)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
                                        <text x="80" y="48" fill="white" fontSize="10" fontWeight="600">🏠 Local</text>
                                        <text x="80" y="60" fill="rgba(255,255,255,0.6)" fontSize="8">3 services</text>
                                    </g>
                                </g>

                                <g>
                                    <g>
                                        <animateTransform attributeName="transform" type="translate" values="0,0;0,-8;0,0" dur="3.5s" repeatCount="indefinite" />
                                        <rect x="300" y="20" width="90" height="40" rx="8" fill="rgba(99,102,241,0.2)" stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
                                        <text x="320" y="38" fill="white" fontSize="10" fontWeight="600">💻 Dev</text>
                                        <text x="320" y="50" fill="rgba(255,255,255,0.6)" fontSize="8">5 services</text>
                                    </g>
                                </g>

                                <g>
                                    <g>
                                        <animateTransform attributeName="transform" type="translate" values="0,0;0,-12;0,0" dur="4s" repeatCount="indefinite" />
                                        <rect x="170" y="10" width="100" height="40" rx="8" fill="rgba(245,158,11,0.2)" stroke="rgba(245,158,11,0.3)" strokeWidth="1" />
                                        <text x="190" y="28" fill="white" fontSize="10" fontWeight="600">🚀 Staging</text>
                                        <text x="190" y="40" fill="rgba(255,255,255,0.6)" fontSize="8">4 services</text>
                                    </g>
                                </g>

                                {/* Cloud/Server Icon */}
                                <g transform="translate(300, 290)">
                                    <rect x="0" y="0" width="120" height="80" rx="12" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                                    <rect x="15" y="12" width="40" height="20" rx="4" fill="rgba(99,102,241,0.3)" />
                                    <rect x="65" y="12" width="40" height="20" rx="4" fill="rgba(99,102,241,0.3)" />
                                    <rect x="15" y="38" width="40" height="20" rx="4" fill="rgba(129,140,248,0.25)" />
                                    <rect x="65" y="38" width="40" height="20" rx="4" fill="rgba(129,140,248,0.25)" />
                                    <circle cx="25" cy="22" r="2.5" fill="#10B981">
                                        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
                                    </circle>
                                    <circle cx="75" cy="22" r="2.5" fill="#10B981">
                                        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                                    </circle>
                                    <circle cx="25" cy="48" r="2.5" fill="#F59E0B">
                                        <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
                                    </circle>
                                    <circle cx="75" cy="48" r="2.5" fill="#F59E0B">
                                        <animate attributeName="opacity" values="1;0.3;1" dur="2.2s" repeatCount="indefinite" />
                                    </circle>
                                    <text x="60" y="72" fill="rgba(255,255,255,0.5)" fontSize="9" textAnchor="middle" fontWeight="500">CLOUD SERVER</text>
                                </g>

                                {/* Connection Lines */}
                                <line x1="200" y1="200" x2="260" y2="160" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4,4" />
                                <line x1="310" y1="200" x2="300" y2="290" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4,4" />
                                <line x1="200" y1="200" x2="105" y2="70" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4,4" />

                                {/* Gear/Config Icon */}
                                <g transform="translate(350, 120)" opacity="0.4">
                                    <animateTransform attributeName="transform" type="rotate" values="350,120,0;350,120,360" dur="20s" repeatCount="indefinite" additive="sum" />
                                    <circle cx="0" cy="0" r="12" fill="none" stroke="white" strokeWidth="2" />
                                    <circle cx="0" cy="0" r="6" fill="none" stroke="white" strokeWidth="1.5" />
                                    <line x1="0" y1="-12" x2="0" y2="-16" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                    <line x1="0" y1="12" x2="0" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                    <line x1="-12" y1="0" x2="-16" y2="0" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                    <line x1="12" y1="0" x2="16" y2="0" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                </g>

                                <g opacity="0.3">
                                    <text x="30" y="110" fill="white" fontSize="14">+</text>
                                    <text x="400" y="95" fill="white" fontSize="12">+</text>
                                    <text x="380" y="380" fill="white" fontSize="10">+</text>
                                </g>
                            </svg>
                        </div>
                    </div>

                    {/* Right Panel - Form with Custom Dropdown */}
                    <div className="env-form-panel">
                        <div className="env-card-simple">
                            <span className="env-icon">☁️</span>
                            <h2>{project?.name}</h2>
                            <p>Select or create an environment to configure SMS, Email & WhatsApp providers</p>

                            <div className="env-controls">
                                <CustomSelect
                                    value={isCustomMode ? "__custom__" : selectedEnvironment}
                                    onChange={handleCustomSelectChange}
                                />

                                {isCustomMode && (
                                    <input
                                        type="text"
                                        placeholder="Enter environment name"
                                        value={customEnvName}
                                        onChange={(e) => setCustomEnvName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addEnvironment()}
                                        className="custom-input"
                                        autoFocus
                                    />
                                )}

                                {((selectedEnvironment && !isCustomMode) || (isCustomMode && customEnvName.trim())) && (
                                    <button className="add-btn" onClick={addEnvironment}>
                                        Continue →
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Clone Modal */}
            {showCloneModal && (
                <div className="modal-overlay" onClick={() => setShowCloneModal(false)}>
                    <div className="modal-container clone-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📋 Clone Environment</h3>
                            <button className="close-btn" onClick={() => setShowCloneModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="clone-source-info">
                                <label>Source Environment</label>
                                <div className="clone-source-name">🌍 {cloneSource}</div>
                            </div>

                            <div className="form-group">
                                <label>Select Target Environment</label>
                                <select
                                    className="provider-select"
                                    value={cloneCustomMode ? "__custom__" : cloneTarget}
                                    onChange={handleCloneTargetChange}
                                >
                                    <option value="">-- Select target --</option>
                                    {availableTargets.map(env => (
                                        <option key={env} value={env}>{env}</option>
                                    ))}
                                    <option value="__custom__">+ Custom Environment</option>
                                </select>
                            </div>

                            {cloneCustomMode && (
                                <div className="form-group">
                                    <label>Custom Environment Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter environment name"
                                        value={cloneCustomName}
                                        onChange={(e) => setCloneCustomName(e.target.value)}
                                        className="custom-input-small"
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowCloneModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-create"
                                onClick={executeClone}
                                disabled={!cloneTarget && !cloneCustomName.trim()}
                            >
                                Clone Environment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}