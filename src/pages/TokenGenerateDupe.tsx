import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, Key, Calendar, Clock, Globe, Check, Copy, Trash2, RefreshCw, Search, Plus, Rocket, Wrench, Filter, X, SortAsc } from "lucide-react";
import { generateToken, getExpiryDate, getExpiryDays, saveToken, getAllTokens, deleteToken, formatDate, calculateExpiryLabel } from "../utils/tokenUtils";
import { ApiToken } from "../types/token";
import "../styles/ProjectCreation.css";
import "../styles/TokenGenerate.css";
import noDataIllustration from '../assets/illustration/No-data.svg';

export default function TokenGenerate() {

    const location = useLocation();
    const { project } = location.state || {};
    const navigate = useNavigate();
    const [environments, setEnvironments] = useState<string[]>([]);
    const [allTokens, setAllTokens] = useState<Record<string, ApiToken>>({});
    const [searchTerm, setSearchTerm] = useState("");

    // Token form state
    const [tokenName, setTokenName] = useState("");
    const [expiration, setExpiration] = useState("30");
    const [customDays, setCustomDays] = useState("");
    const [customDate, setCustomDate] = useState("");
    const [selectedEnv, setSelectedEnv] = useState("");
    const [currentToken, setCurrentToken] = useState<ApiToken | null>(null);
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Form modal
    const [showFormModal, setShowFormModal] = useState(false);

    // Generated token reveal modal
    const [generatedToken, setGeneratedToken] = useState<ApiToken | null>(null);
    const [copied, setCopied] = useState(false);

    // Confirm modals
    const [showRegenModal, setShowRegenModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaveAction, setLeaveAction] = useState<(() => void) | null>(null);
    const [leaveModalType, setLeaveModalType] = useState<
        "form" | "token" | null
    >(null);
    const [instanceFilter, setInstanceFilter] = useState<string>("all");
    const [activeTab, setActiveTab] = useState<string>("all");
    const [tokenInstance, setTokenInstance] = useState("");
    const [expiryFilter, setExpiryFilter] = useState<string>("all"); // all, active, expired, expiring-soon
    const [sortBy, setSortBy] = useState<string>("name"); // name, created, expires
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    // Add this when any modal opens
    useEffect(() => {
        if (showFormModal || generatedToken || showRegenModal || showDeleteModal || showLeaveModal || showFilterPanel) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showFormModal, generatedToken, showRegenModal, showDeleteModal, showLeaveModal, showFilterPanel]);

    useEffect(() => {
        const presetEnvs = ['Local', 'Dev', 'Staging', 'Live'];
        const allKeys = Object.keys(localStorage);
        const envSet = new Set<string>();
        allKeys.forEach(key => {
            const match = key.match(/^env_(.+)_(sms|email|whatsapp)_providers$/);
            if (match) envSet.add(match[1]);
        });
        presetEnvs.forEach(env => {
            if (localStorage.getItem(`env_${env}_sms_providers`) ||
                localStorage.getItem(`env_${env}_email_providers`) ||
                localStorage.getItem(`env_${env}_whatsapp_providers`)) {
                envSet.add(env);
            }
        });
        setEnvironments(Array.from(envSet));

        if (project) {
            const tokens = getAllTokens(project.id);
            setAllTokens(tokens);
        }
    }, [project]);
    // Add this function to check token expiry status
    const getTokenExpiryStatus = (token: ApiToken | undefined) => {
        if (!token) return null;
        const now = new Date();
        const expiryDate = new Date(token.expires);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) return 'expired';
        if (daysUntilExpiry <= 7) return 'expiring-soon';
        return 'active';
    };

    const sortTokens = (tokens: [string, ApiToken | undefined][]) => {
        return [...tokens].sort(([envA, tokenA], [envB, tokenB]) => {
            if (sortBy === 'name') {
                return envA.localeCompare(envB);
            } else if (sortBy === 'created' && tokenA && tokenB) {
                return new Date(tokenB.created).getTime() - new Date(tokenA.created).getTime();
            } else if (sortBy === 'expires' && tokenA && tokenB) {
                return new Date(tokenA.expires).getTime() - new Date(tokenB.expires).getTime();
            }
            return 0;
        });
    };

    // Update the filteredEnvs logic to include all filters
    const getFilteredAndSortedTokens = () => {
        // First filter environments
        let filtered = environments.filter(env => {
            if (!searchTerm.trim()) return true;
            const query = searchTerm.toLowerCase();
            const token = allTokens[env];

            if (env.toLowerCase().includes(query)) return true;
            if (token?.name?.toLowerCase().includes(query)) return true;
            if (token?.instance?.toLowerCase().includes(query)) return true;

            return false;
        });

        // Then apply tab filter
        if (activeTab !== 'all') {
            filtered = filtered.filter(env => {
                const token = allTokens[env];
                if (!token) return false;
                return token.instance === activeTab;
            });
        }

        // Apply expiry filter
        if (expiryFilter !== 'all') {
            filtered = filtered.filter(env => {
                const token = allTokens[env];
                if (!token && expiryFilter === 'no-token') return true;
                const status = getTokenExpiryStatus(token);
                return status === expiryFilter;
            });
        }

        // Sort the results
        const tokenEntries = filtered.map(env => [env, allTokens[env]] as [string, ApiToken | undefined]);
        return sortTokens(tokenEntries);
    };

    const filteredTokens = useMemo(() => getFilteredAndSortedTokens(), [environments, allTokens, searchTerm, activeTab, expiryFilter, sortBy]);

    // Update tab counts to reflect current search
    const getTabCounts = () => {
        const allFiltered = environments.filter(env => {
            if (!searchTerm.trim()) return true;
            const query = searchTerm.toLowerCase();
            const token = allTokens[env];
            return env.toLowerCase().includes(query) ||
                token?.name?.toLowerCase().includes(query);
        });

        return {
            all: allFiltered.length,
            live: Object.values(allTokens).filter(t => {
                const env = allFiltered.find(e => e === t.environmentName);
                return env && t.instance === 'Live';
            }).length,
            sandbox: Object.values(allTokens).filter(t => {
                const env = allFiltered.find(e => e === t.environmentName);
                return env && t.instance === 'Sandbox';
            }).length
        };
    };

    const tabCounts = useMemo(() => getTabCounts(), [environments, allTokens, searchTerm]);

    // Add sorting function

    const expirationOptions = [
        { value: "7", label: "7 Days" },
        { value: "30", label: "30 Days" },
        { value: "60", label: "60 Days" },
        { value: "90", label: "90 Days" },
        { value: "custom", label: "Custom" },
        { value: "never", label: "Never" },
    ];

    const getDatePreview = (days: string) => {
        if (days === "never") return "—";
        if (days === "custom") return customDate ? formatDate(customDate) : "Pick a date";
        return getExpiryDate(days);
    };

    const openGenerateForm = (env: string) => {
        setSelectedEnv(env);
        setTokenName("");
        setExpiration("30");
        setCustomDays("");
        setCustomDate("");
        setIsRegenerating(false);
        setCurrentToken(null);
        setTokenInstance(instanceFilter === 'all' ? '' : instanceFilter);
        setShowFormModal(true);
    };

    const openRegenerateForm = (env: string) => {
        const token = allTokens[env];
        setSelectedEnv(env);
        setCurrentToken(token || null);
        setTokenName("");
        setExpiration("30");
        setCustomDays("");
        setCustomDate("");
        setIsRegenerating(true);
        setTokenInstance(token?.instance || "");
        setShowFormModal(true);
    };

    const handleGenerate = () => {
        if (!tokenName.trim() || !selectedEnv || !project || !tokenInstance) return;

        const token: ApiToken = {
            id: Date.now().toString(),
            name: tokenName.trim(),
            token: generateToken(),
            projectId: project.id,
            environmentName: selectedEnv,
            instance: tokenInstance,
            created: new Date().toISOString().split('T')[0],
            expires: getExpiryDate(expiration, customDays),
            expiresInDays: getExpiryDays(expiration, customDays),
            revealed: false,
        };

        saveToken(project.id, selectedEnv, token);
        setAllTokens(prev => ({ ...prev, [selectedEnv]: token }));
        setGeneratedToken(token);
        setShowFormModal(false);

        window.dispatchEvent(new CustomEvent('tokenUpdated', {
            detail: { ...token, environmentName: selectedEnv }
        }));
    };

    const handleDelete = () => {
        if (!project || !selectedEnv) return;
        deleteToken(project.id, selectedEnv);
        setAllTokens(prev => {
            const updated = { ...prev };
            delete updated[selectedEnv];
            return updated;
        });
        setShowDeleteModal(false);
        setSelectedEnv("");
        window.dispatchEvent(new CustomEvent('tokenUpdated', { detail: null }));
    };

    const handleCopy = () => {
        if (generatedToken) {
            navigator.clipboard.writeText(generatedToken.token);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const handleLeaveConfirmation = (
        action: () => void,
        type: "form" | "token"
    ) => {

        // FORM MODAL GO BACK
        if (type === "form") {
            action();
            setLeaveAction(() => () => {
                setShowFormModal(false);
                setShowLeaveModal(false);
            });
        }

        // TOKEN REVEAL MODAL
        if (type === "token") {
            setLeaveAction(() => () => {
                action();
                setGeneratedToken(null);
                setCopied(false);
                setShowLeaveModal(false);
            });
        }

        setLeaveModalType(type);
        setShowLeaveModal(true);
    };

    const confirmLeave = () => {
        if (leaveAction) {
            leaveAction();
        }

        setShowLeaveModal(false);
        setLeaveAction(null);
    };

    if (!project) return <div className="loading">Loading...</div>;

    return (
        <div className="create-project-container">
            <div className="token-top-header">
                <div className="token-top-left">
                    <h1 className="page-main-title">API Tokens</h1>

                    <p
                        className="token-project-name clickable-project-name"
                        onClick={() => {
                            navigate(`/dashboard/project/${project?.id}/view`, {
                                state: { project }
                            });
                        }}
                    >
                        Project: <strong>{project?.name}</strong>
                    </p>
                </div>

                {/* Breadcrumb */}
                <div className="token-breadcrumb">
                    <span
                        className="breadcrumb-link"
                        onClick={() => navigate("/dashboard")}
                        role="button"
                        tabIndex={0}
                    >
                        Dashboard
                    </span>

                    <span className="breadcrumb-separator">›</span>

                    <span
                        className="breadcrumb-link"
                        onClick={() => {
                            navigate(`/dashboard/project/${project?.id}/view`, {
                                state: { project }
                            });
                        }}
                        role="button"
                        tabIndex={0}
                    >
                        Project View
                    </span>

                    <span className="breadcrumb-separator">›</span>

                    <span className="active">
                        Token Generation
                    </span>
                </div>
            </div>

            <div className="full-page-bg">
                <div className="form-card">
                    <div className="form-header">
                        <p>Manage API tokens for your environments</p>
                        <div className="header-underline"></div>
                    </div>

                    {/* Search + Filter Row */}
                    {environments.length > 0 && (
                        <div className="token-search-filter-row">
                            <div className="token-search-bar">
                                <div className="search-input-group">
                                    <Search size={16} className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search environments, tokens..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="token-search-input"
                                    />
                                    {(searchTerm || instanceFilter !== 'all' || expiryFilter !== 'all') && (
                                        <button
                                            className="token-clear-btn"
                                            onClick={() => {
                                                setSearchTerm("");
                                                setInstanceFilter("all");
                                                setExpiryFilter("all");
                                                setActiveTab("all");
                                            }}
                                            title="Clear all filters"
                                            style={(searchTerm || instanceFilter !== 'all' || expiryFilter !== 'all') ? { background: '#dc2626', borderColor: '#dc2626' } : {}}
                                        >
                                            <X size={14} />
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Filter Button */}
                            <button
                                className="token-filter-btn"
                                onClick={() => setShowFilterPanel(true)}
                            >
                                <Filter size={16} />
                                Filters
                                {(instanceFilter !== 'all' || expiryFilter !== 'all') && (
                                    <span className="filter-active-indicator" />
                                )}
                            </button>
                        </div>
                    )}

                    {/* Instance Tabs */}
                    {environments.length > 0 && (
                        <div className="pc-instance-tabs">
                            <button
                                className={`pc-instance-tab ${activeTab === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveTab('all')}
                                style={activeTab === 'all' ? { background: '#6366f1', color: 'white', fontWeight: 600, boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)' } : {}}
                            >
                                <Globe size={14} />
                                All
                                <span className="pc-instance-tab-count" style={activeTab === 'all' ? { background: 'rgba(255,255,255,0.25)', color: 'white' } : {}}>
                                    {tabCounts.all}
                                </span>
                            </button>
                            <button
                                className={`pc-instance-tab ${activeTab === 'Live' ? 'active live' : ''}`}
                                onClick={() => setActiveTab('Live')}
                            >
                                <Rocket size={14} />
                                Live
                                <span className="pc-instance-tab-count">
                                    {tabCounts.live}
                                </span>
                            </button>
                            <button
                                className={`pc-instance-tab ${activeTab === 'Sandbox' ? 'active sandbox' : ''}`}
                                onClick={() => setActiveTab('Sandbox')}
                            >
                                <Wrench size={14} />
                                Sandbox
                                <span className="pc-instance-tab-count">
                                    {tabCounts.sandbox}
                                </span>
                            </button>
                        </div>
                    )}

                    {/* Environment Cards */}
                    {environments.length === 0 ? (
                        <div className="no-env-warning">
                            <AlertTriangle size={14} />
                            <span>No environments configured. Create an environment first.</span>
                        </div>
                    ) : (
                        <div className="token-cards-grid">
                            {filteredTokens.length === 0 ? (
                                <div className="token-empty-illustration">
                                    <img src={noDataIllustration} alt="No data" className="empty-illustration-img" />
                                    <h4>
                                        {searchTerm.trim() || expiryFilter !== 'all'
                                            ? 'No results match your filters'
                                            : activeTab === 'all'
                                                ? 'No environments yet'
                                                : `No ${activeTab} tokens yet`}
                                    </h4>
                                    <p>
                                        {searchTerm.trim() || expiryFilter !== 'all'
                                            ? 'Try adjusting your search or filters'
                                            : activeTab === 'all'
                                                ? 'Create an environment first to get started'
                                                : `Generate a ${activeTab} token or switch tabs`}
                                    </p>
                                </div>
                            ) : (
                                filteredTokens.map(([env, token]) => {
                                    const expiryStatus = getTokenExpiryStatus(token);
                                    return (
                                        <div key={env} className="token-env-card-full">
                                            <div className="token-card-header">
                                                <Globe size={18} />
                                                <span className="token-card-env-name">{env}</span>
                                                {token && (
                                                    <>
                                                        <span className={`token-card-badge ${expiryStatus === 'expired' ? 'expired' : expiryStatus === 'expiring-soon' ? 'warning' : ''}`}>
                                                            {expiryStatus === 'expired' ? 'Expired' : expiryStatus === 'expiring-soon' ? 'Expiring Soon' : 'Active'}
                                                        </span>
                                                        {token.instance && (
                                                            <span className={`token-instance-badge ${token.instance === 'Live' ? 'live' : 'sandbox'}`}>
                                                                {token.instance === 'Live' ? <Rocket size={12} /> : <Wrench size={12} />}
                                                                {token.instance}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {token ? (
                                                <>
                                                    <div className="token-card-content-row">
                                                        <div className="token-card-body">
                                                            <div className="token-card-info">
                                                                <div className="token-card-row">
                                                                    <Key size={14} />
                                                                    <span>{token.name}</span>
                                                                </div>
                                                                <div className="token-card-row">
                                                                    <Calendar size={14} />
                                                                    <span>Created {formatDate(token.created)}</span>
                                                                </div>
                                                                <div className="token-card-row token-expiry-row">
                                                                    <div className="token-expiry-left">
                                                                        <Clock size={14} />
                                                                        <span className={`${expiryStatus === 'expiring-soon' ? 'expiring-soon' : ''} ${expiryStatus === 'expired' ? 'expired-text' : ''}`}>
                                                                            {calculateExpiryLabel(token.expires, token.expiresInDays)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="token-expiry-spacer"></div>
                                                                    <div className="token-card-actions-side">
                                                                        <button className="token-action-btn delete" onClick={() => { setSelectedEnv(env); setCurrentToken(token); setShowDeleteModal(true); }}>
                                                                            <Trash2 size={14} /> Delete
                                                                        </button>
                                                                        <button className="token-action-btn regenerate" onClick={() => { setSelectedEnv(env); setCurrentToken(token); setShowRegenModal(true); }}>
                                                                            <RefreshCw size={14} /> Regenerate
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="token-card-empty">
                                                    <span className="no-token-text">No token generated</span>
                                                    <button className="token-action-btn generate-inline" onClick={() => openGenerateForm(env)}>
                                                        <Plus size={14} /> Generate Token
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}


                </div>
            </div>

            {/* Generate/Regenerate Form Modal */}
            {showFormModal && (
                <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
                    <div className="modal-container token-form-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{isRegenerating ? 'Regenerate Token' : 'Generate Token'}</h3>
                        </div>
                        <div className="modal-body">
                            <div className="modal-token-info">
                                <div><Globe size={14} /> Environment: <strong>{selectedEnv}</strong></div>
                                {isRegenerating && currentToken && (
                                    <div className="regenerating-info">
                                        Regenerating will revoke: <strong>{currentToken.name}</strong>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Select Instance *</label>
                                <select
                                    value={tokenInstance}
                                    onChange={(e) => setTokenInstance(e.target.value)}
                                    className="token-input"
                                >
                                    <option value="">-- Choose instance --</option>
                                    <option value="Sandbox">Sandbox</option>
                                    <option value="Live">Live</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Token Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Production API Key"
                                    value={tokenName}
                                    onChange={(e) => setTokenName(e.target.value)}
                                    className="token-input"
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>Expiration</label>
                                <div className="expiration-options">
                                    {expirationOptions.map((opt) => (
                                        <div
                                            key={opt.value}
                                            className={`expiration-option ${expiration === opt.value ? 'active' : ''}`}
                                            onClick={() => setExpiration(opt.value)}
                                        >
                                            <div className="expiration-label">{opt.label}</div>
                                            <div className="expiration-date">{getDatePreview(opt.value)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {expiration === "custom" && (
                                <div className="form-group">
                                    <label>Select Expiry Date</label>
                                    <div className="token-date-wrapper" onClick={() => {
                                        const input = document.querySelector('.token-date-input') as HTMLInputElement;
                                        if (input) input.showPicker();
                                    }}>
                                        <input
                                            type="date"
                                            value={customDate}
                                            onChange={(e) => {
                                                const selectedDate = e.target.value;
                                                setCustomDate(selectedDate);
                                                const now = new Date();
                                                const expiry = new Date(selectedDate);
                                                const diffTime = expiry.getTime() - now.getTime();
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                setCustomDays(String(diffDays > 0 ? diffDays : 1));
                                            }}
                                            className="token-input token-date-input"
                                            min={new Date().toISOString().split('T')[0]}
                                            placeholder="Select a date"
                                        />
                                        <Calendar className="token-date-icon" size={16} />
                                    </div>
                                </div>
                            )}

                            <div className="token-warning">
                                <AlertTriangle size={16} />
                                <span>The token will only be shown once after creation.</span>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() =>
                                    handleLeaveConfirmation(
                                        () => { },
                                        "form"
                                    )
                                }
                            >
                                Go Back
                            </button>
                            <button
                                className="btn-submit"
                                onClick={handleGenerate}
                                disabled={!tokenName.trim() || !tokenInstance || (expiration === "custom" && !customDays)}
                            >
                                <Key size={16} /> {isRegenerating ? 'Regenerate Token' : 'Generate Token'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Generated Token Reveal Modal */}
            {generatedToken && (
                <div className="modal-overlay" onClick={() => { }}>
                    <div className="modal-container token-reveal-modal" onClick={e => e.stopPropagation()}>
                        <div className="reveal-success">
                            <Check size={20} /> Token Generated!
                        </div>

                        <div className="reveal-warning-box">
                            <AlertTriangle size={18} />
                            <div>
                                <strong>SAVE THIS TOKEN NOW</strong>
                                <p>This token will NOT be shown again.</p>
                            </div>
                        </div>

                        <div className="reveal-token-box">
                            <div className="reveal-token-row">
                                <div className="reveal-token-value">{generatedToken.token}</div>
                                <button className={`btn-copy-inline ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                                    {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                                </button>
                            </div>
                            <div className="reveal-token-meta">
                                <div><Globe size={14} /> {generatedToken.environmentName}</div>
                                <div><Calendar size={14} /> {generatedToken.name} · {formatDate(generatedToken.created)}</div>
                                <div><Clock size={14} /> Expires: {formatDate(generatedToken.expires)}</div>
                            </div>
                        </div>

                        <button
                            className="btn-submit"
                            onClick={() =>
                                handleLeaveConfirmation(
                                    () => { },
                                    "token"
                                )
                            }
                        >
                            <Check size={16} /> I’ve Saved the Token, Go Back
                        </button>

                    </div>
                </div>
            )}

            {/* Regenerate Confirmation Modal */}
            {showRegenModal && (
                <div className="modal-overlay" onClick={() => setShowRegenModal(false)}>
                    <div className="modal-container" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <RefreshCw size={22} color="#6366f1" />
                            <h3>Regenerate Token?</h3>
                        </div>
                        <div className="modal-body">
                            <div className="modal-token-info">
                                <div><Globe size={14} /> Environment: <strong>{selectedEnv}</strong></div>
                                {currentToken && (
                                    <>
                                        <div><Key size={14} /> Token: <strong>{currentToken.name}</strong></div>
                                        <div><Calendar size={14} /> Created: {formatDate(currentToken.created)}</div>
                                    </>
                                )}
                            </div>
                            <p className="warning-text">Regenerating will revoke the old token.</p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowRegenModal(false)}>Cancel</button>
                            <button className="btn-submit" onClick={() => {
                                setShowRegenModal(false);
                                openRegenerateForm(selectedEnv);
                            }}>Continue</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Confirmation Modal */}
            {showLeaveModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowLeaveModal(false)}
                >
                    <div
                        className="modal-container"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <AlertTriangle
                                size={22}
                                color={leaveModalType === "form" ? "#ef4444" : "#f59e0b"}
                            />

                            <h3>
                                {leaveModalType === "form"
                                    ? "Discard Token Form?"
                                    : "Leave Token Page?"}
                            </h3>
                        </div>

                        <div className="modal-body">
                            {leaveModalType === "form" ? (
                                <>
                                    <p>
                                        Are you sure you want to go back?
                                    </p>

                                    <p className="warning-text">
                                        The token form you are currently filling out will
                                        be discarded and your unsaved changes will be lost.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p>
                                        Have you copied and saved this token?
                                    </p>

                                    <p className="warning-text">
                                        This token will not be shown again after leaving
                                        this page.
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowLeaveModal(false)}
                            >
                                Stay Here
                            </button>

                            <button
                                className="btn-submit"
                                onClick={confirmLeave}
                                style={{
                                    background:
                                        leaveModalType === "form"
                                            ? "#ef4444"
                                            : undefined
                                }}
                            >
                                {leaveModalType === "form"
                                    ? "Discard & Go Back"
                                    : "Yes, Leave Page"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-container" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <Trash2 size={22} color="#ef4444" />
                            <h3>Delete Token?</h3>
                        </div>
                        <div className="modal-body">
                            <div className="modal-token-info">
                                <div><Globe size={14} /> Environment: <strong>{selectedEnv}</strong></div>
                                {currentToken && (
                                    <>
                                        <div><Key size={14} /> Token: <strong>{currentToken.name}</strong></div>
                                        <div><Calendar size={14} /> Created: {formatDate(currentToken.created)}</div>
                                    </>
                                )}
                            </div>
                            <p className="warning-text">This will permanently revoke API access.</p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="btn-submit" onClick={handleDelete} style={{ background: '#ef4444' }}>Delete Token</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Panel Overlay */}
            {showFilterPanel && (
                <div className="filter-panel-overlay" onClick={() => setShowFilterPanel(false)}>
                    <div className="filter-panel" onClick={e => e.stopPropagation()}>
                        <div className="filter-panel-header">
                            <h3>Filters</h3>
                            <button
                                className="filter-panel-close"
                                onClick={() => setShowFilterPanel(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="filter-panel-body">
                            {/* Search inside panel */}
                            <div className="filter-panel-section">
                                <label className="filter-panel-label">
                                    <Search size={16} />
                                    Search
                                </label>
                                <div className="filter-panel-search">
                                    <Search size={16} className="filter-panel-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search environments, tokens..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="filter-panel-search-input"
                                    />
                                    {searchTerm && (
                                        <button
                                            className="filter-panel-search-clear"
                                            onClick={() => setSearchTerm("")}
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* Instance Filter */}
                            <div className="filter-panel-section">
                                <label className="filter-panel-label">
                                    <Globe size={16} />
                                    Instance
                                </label>
                                <select
                                    className="filter-panel-select"
                                    value={instanceFilter}
                                    onChange={(e) => setInstanceFilter(e.target.value)}
                                >
                                    <option value="all">All Instances</option>
                                    <option value="Live">Live</option>
                                    <option value="Sandbox">Sandbox</option>
                                </select>
                            </div>

                            {/* Expiry Status Filter */}
                            <div className="filter-panel-section">
                                <label className="filter-panel-label">
                                    <Clock size={16} />
                                    Status
                                </label>
                                <select
                                    className="filter-panel-select"
                                    value={expiryFilter}
                                    onChange={(e) => setExpiryFilter(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="expiring-soon">Expiring Soon</option>
                                    <option value="expired">Expired</option>
                                    <option value="no-token">No Token</option>
                                </select>
                            </div>

                            {/* Sort By */}
                            <div className="filter-panel-section">
                                <label className="filter-panel-label">
                                    <SortAsc size={16} />
                                    Sort By
                                </label>
                                <select
                                    className="filter-panel-select"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="name">Name</option>
                                    <option value="created">Created Date</option>
                                    <option value="expires">Expiry Date</option>
                                </select>
                            </div>

                            {/* Active Filters Summary */}
                            {(searchTerm || instanceFilter !== 'all' || expiryFilter !== 'all') && (
                                <div className="filter-panel-section">
                                    <label className="filter-panel-label">Active Filters</label>
                                    <div className="active-filters-list">
                                        {searchTerm && (
                                            <span className="active-filter-tag">
                                                Search: "{searchTerm}"
                                                <button onClick={() => setSearchTerm("")}>
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        )}
                                        {instanceFilter !== 'all' && (
                                            <span className="active-filter-tag">
                                                Instance: {instanceFilter}
                                                <button onClick={() => setInstanceFilter("all")}>
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        )}
                                        {expiryFilter !== 'all' && (
                                            <span className="active-filter-tag">
                                                Status: {expiryFilter.replace('-', ' ')}
                                                <button onClick={() => setExpiryFilter("all")}>
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="filter-panel-footer">
                            <button
                                className="filter-panel-clear-btn"
                                onClick={() => {
                                    setSearchTerm("");
                                    setInstanceFilter("all");
                                    setExpiryFilter("all");
                                    setSortBy("name");
                                    setActiveTab("all");
                                }}
                                style={(searchTerm || instanceFilter !== 'all' || expiryFilter !== 'all') ? { background: '#dc2626', borderColor: '#dc2626', color: 'white' } : {}}
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}