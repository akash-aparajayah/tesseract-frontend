import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, Key, Calendar, Clock, Globe, Check, Copy, Trash2, RefreshCw, Search, Plus, Rocket, Wrench, X } from "lucide-react";
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
    const [leaveModalType, setLeaveModalType] = useState<"form" | "token" | null>(null);
    const [tokenmode, setTokenmode] = useState("");
    useEffect(() => {
        if (showFormModal || generatedToken || showRegenModal || showDeleteModal || showLeaveModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showFormModal, generatedToken, showRegenModal, showDeleteModal, showLeaveModal]);

    useEffect(() => {
        if (!project?.id) return;
        const allKeys = Object.keys(localStorage);
        const envSet = new Set<string>();
        allKeys.forEach(key => {
            const match = key.match(new RegExp(`^env_${project.id}_(.+)_(sms|email|whatsapp)_providers$`));
            if (match) envSet.add(match[1]);
        });
        setEnvironments(Array.from(envSet));

        if (project) {
            const tokens = getAllTokens(project.id);
            setAllTokens(tokens);
        }
    }, [project]);



    // Simple filter by search only
    const filteredEnvs = environments.filter(env => {
        if (!searchTerm.trim()) return true;
        const query = searchTerm.toLowerCase();
        const sandboxToken = allTokens[`${env}_Sandbox`];
        const liveToken = allTokens[`${env}_Live`];

        if (env.toLowerCase().includes(query)) return true;
        if (sandboxToken?.name?.toLowerCase().includes(query)) return true;
        if (liveToken?.name?.toLowerCase().includes(query)) return true;
        return false;
    });

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

    const openRegenerateForm = (env: string, mode: string) => {
        console.log('openRegenerateForm - env:', env, 'mode:', mode);
        const token = allTokens[`${env}_${mode}`];
        console.log('token:', token);
        setSelectedEnv(env);
        setCurrentToken(token || null);
        setTokenName("");
        setExpiration("30");
        setCustomDays("");
        setCustomDate("");
        setIsRegenerating(true);
        setTokenmode(mode);
        setShowFormModal(true);
    };

    const handleGenerate = () => {
        if (!tokenName.trim() || !selectedEnv || !project || !tokenmode) return;

        const token: ApiToken = {
            id: Date.now().toString(),
            name: tokenName.trim(),
            token: generateToken(),
            projectId: project.id,
            environmentName: selectedEnv,
            mode: tokenmode,
            created: new Date().toISOString().split('T')[0],
            expires: getExpiryDate(expiration, customDays),
            expiresInDays: getExpiryDays(expiration, customDays),
            revealed: false,
        };

        saveToken(project.id, selectedEnv, tokenmode, token);
        setAllTokens(prev => ({ ...prev, [`${selectedEnv}_${tokenmode}`]: token }));
        setGeneratedToken(token);
        setShowFormModal(false);

        window.dispatchEvent(new CustomEvent('tokenUpdated', {
            detail: { ...token, environmentName: selectedEnv }
        }));
    };

    const handleDelete = () => {
        if (!project || !selectedEnv || !currentToken?.mode) return;
        deleteToken(project.id, selectedEnv, currentToken.mode);
        setAllTokens(prev => {
            const updated = { ...prev };
            delete updated[`${selectedEnv}_${currentToken.mode}`];
            return updated;
        });
        setShowDeleteModal(false);
        setSelectedEnv("");
        setCurrentToken(null);
        window.dispatchEvent(new CustomEvent('tokenUpdated', { detail: null }));
    };

    const handleCopy = () => {
        if (generatedToken) {
            navigator.clipboard.writeText(generatedToken.token);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const handleLeaveConfirmation = (action: () => void, type: "form" | "token") => {
        if (type === "form") {
            action();
            setLeaveAction(() => () => {
                setShowFormModal(false);
                setShowLeaveModal(false);
            });
        }

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

                <div className="token-breadcrumb">
                    <span className="breadcrumb-link" onClick={() => navigate("/dashboard")} role="button" tabIndex={0}>
                        Dashboard
                    </span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-link" onClick={() => {
                        navigate(`/dashboard/project/${project?.id}/view`, { state: { project } });
                    }} role="button" tabIndex={0}>
                        Project View
                    </span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="active">Token Generation</span>
                </div>
            </div>

            <div className="full-page-bg">
                <div className="form-card">
                    <div className="form-header">
                        <p>Manage API tokens for your environments</p>
                        <div className="header-underline"></div>
                    </div>

                    {/* Search Bar */}
                    {environments.length > 0 && (
                        <div className="token-search-filter-row">
                            <div className="token-search-bar">
                                <div className="search-input-group">
                                    <Search size={16} className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search environments..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="token-search-input"
                                    />
                                    {searchTerm && (
                                        <button
                                            className="token-clear-btn"
                                            onClick={() => setSearchTerm("")}
                                            title="Clear search"
                                        >
                                            <X size={14} />
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>
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
                            {filteredEnvs.length === 0 ? (
                                <div className="token-empty-illustration">
                                    <img src={noDataIllustration} alt="No data" className="empty-illustration-img" />
                                    <h4>{searchTerm.trim() ? 'No results found' : 'No environments yet'}</h4>
                                    <p>{searchTerm.trim() ? 'Try adjusting your search' : 'Create an environment first to get started'}</p>
                                </div>
                            ) : (
                                filteredEnvs.map(env => {
                                    const sandboxToken = allTokens[`${env}_Sandbox`];
                                    const liveToken = allTokens[`${env}_Live`];

                                    return (
                                        <div key={env} className="token-env-card-full">
                                            <div className="token-card-header">
                                                <Globe size={18} />
                                                <span className="token-card-env-name">{env}</span>
                                            </div>

                                            <div className="token-mode-buttons-row">
                                                {/* Sandbox Button */}
                                                <div className="token-mode-card">
                                                    {sandboxToken ? (
                                                        <div className="mode-configured">

                                                            <div className="mode-configured-header">

                                                                <div className="mode-header-left">
                                                                    <Wrench size={16} />
                                                                    <span>Sandbox</span>
                                                                </div>

                                                                <div className="mode-header-right">

                                                                    <span className="status-badge active">
                                                                        Active
                                                                    </span>

                                                                    {sandboxToken.expiresInDays && sandboxToken.expiresInDays <= 7 && (
                                                                        <span className="status-badge expiring">
                                                                            Expiring Soon
                                                                        </span>
                                                                    )}

                                                                </div>

                                                            </div>

                                                            <div className="mode-token-info">

                                                                <div className="mode-token-row">
                                                                    <Key size={12} />
                                                                    <span>{sandboxToken.name}</span>
                                                                </div>

                                                                <div className="mode-token-row">
                                                                    <Calendar size={12} />
                                                                    <span>
                                                                        Created {formatDate(sandboxToken.created)}
                                                                    </span>
                                                                </div>

                                                                <div className="mode-token-row token-expiry-row">

                                                                    <div className="expiry-left">
                                                                        <Clock size={12} />

                                                                        <span
                                                                            className={
                                                                                sandboxToken.expiresInDays &&
                                                                                    sandboxToken.expiresInDays <= 7
                                                                                    ? 'expiring-soon'
                                                                                    : ''
                                                                            }
                                                                        >
                                                                            {calculateExpiryLabel(
                                                                                sandboxToken.expires,
                                                                                sandboxToken.expiresInDays
                                                                            )}
                                                                        </span>
                                                                    </div>

                                                                    <div className="mode-token-actions">

                                                                        <button
                                                                            className="token-action-btn regenerate"
                                                                            onClick={() => {
                                                                                setSelectedEnv(env);
                                                                                setCurrentToken(sandboxToken);
                                                                                setShowRegenModal(true);
                                                                            }}
                                                                        >
                                                                            <RefreshCw size={12} />
                                                                            Regenerate
                                                                        </button>

                                                                        <button
                                                                            className="token-action-btn delete"
                                                                            onClick={() => {
                                                                                setSelectedEnv(env);
                                                                                setCurrentToken(sandboxToken);
                                                                                setShowDeleteModal(true);
                                                                            }}
                                                                        >
                                                                            <Trash2 size={12} />
                                                                            Delete
                                                                        </button>

                                                                    </div>

                                                                </div>

                                                            </div>

                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="mode-generate-btn sandbox"
                                                            onClick={() => {
                                                                setSelectedEnv(env);
                                                                setTokenmode('Sandbox');
                                                                setTokenName("");
                                                                setExpiration("30");
                                                                setCustomDays("");
                                                                setCustomDate("");
                                                                setIsRegenerating(false);
                                                                setCurrentToken(null);
                                                                setShowFormModal(true);
                                                            }}
                                                        >
                                                            <Wrench size={18} />
                                                            <span>Generate Sandbox Token</span>
                                                            <Plus size={16} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Live Button */}
                                                <div className="token-mode-card">
                                                    {liveToken ? (
                                                        <div className="mode-configured">

                                                            <div className="mode-configured-header">

                                                                <div className="mode-header-left">
                                                                    <Globe size={16} />
                                                                    <span>Live</span>
                                                                </div>

                                                                <div className="mode-header-right">

                                                                    <span className="status-badge active">
                                                                        Active
                                                                    </span>

                                                                    {liveToken.expiresInDays && liveToken.expiresInDays <= 7 && (
                                                                        <span className="status-badge expiring">
                                                                            Expiring Soon
                                                                        </span>
                                                                    )}

                                                                </div>

                                                            </div>

                                                            <div className="mode-token-info">

                                                                <div className="mode-token-row">
                                                                    <Key size={12} />
                                                                    <span>{liveToken.name}</span>
                                                                </div>

                                                                <div className="mode-token-row">
                                                                    <Calendar size={12} />
                                                                    <span>
                                                                        Created {formatDate(liveToken.created)}
                                                                    </span>
                                                                </div>

                                                                <div className="mode-token-row token-expiry-row">

                                                                    <div className="expiry-left">
                                                                        <Clock size={12} />

                                                                        <span
                                                                            className={
                                                                                liveToken.expiresInDays &&
                                                                                    liveToken.expiresInDays <= 7
                                                                                    ? 'expiring-soon'
                                                                                    : ''
                                                                            }
                                                                        >
                                                                            {calculateExpiryLabel(
                                                                                liveToken.expires,
                                                                                liveToken.expiresInDays
                                                                            )}
                                                                        </span>
                                                                    </div>

                                                                    <div className="mode-token-actions">

                                                                        <button
                                                                            className="token-action-btn regenerate"
                                                                            onClick={() => {
                                                                                setSelectedEnv(env);
                                                                                setCurrentToken(liveToken);
                                                                                setShowRegenModal(true);
                                                                            }}
                                                                        >
                                                                            <RefreshCw size={12} />
                                                                            Regenerate
                                                                        </button>

                                                                        <button
                                                                            className="token-action-btn delete"
                                                                            onClick={() => {
                                                                                setSelectedEnv(env);
                                                                                setCurrentToken(liveToken);
                                                                                setShowDeleteModal(true);
                                                                            }}
                                                                        >
                                                                            <Trash2 size={12} />
                                                                            Delete
                                                                        </button>

                                                                    </div>

                                                                </div>

                                                            </div>

                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="mode-generate-btn live"
                                                            onClick={() => {
                                                                setSelectedEnv(env);
                                                                setTokenmode('Live');
                                                                setTokenName("");
                                                                setExpiration("30");
                                                                setCustomDays("");
                                                                setCustomDate("");
                                                                setIsRegenerating(false);
                                                                setCurrentToken(null);
                                                                setShowFormModal(true);
                                                            }}
                                                        >
                                                            <Rocket size={18} />
                                                            <span>Generate Live Token</span>
                                                            <Plus size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
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
                                <div>
                                    {tokenmode === 'Sandbox' ? <Wrench size={14} /> : <Rocket size={14} />}
                                    Mode: <strong>{tokenmode}</strong>
                                </div>
                                {isRegenerating && currentToken && (
                                    <div className="regenerating-info">
                                        Regenerating will revoke: <strong>{currentToken.name}</strong>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Note</label>
                                <input
                                    type="text"
                                    placeholder="What’s this token for?"
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
                            <button className="btn-cancel" onClick={() => handleLeaveConfirmation(() => { }, "form")}>
                                Go Back
                            </button>
                            <button
                                className="btn-submit"
                                onClick={handleGenerate}
                                disabled={!tokenName.trim() || !tokenmode || (expiration === "custom" && !customDays)}
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
                                <div>
                                    {generatedToken.mode === 'Sandbox'
                                        ? <Wrench size={14} />
                                        : <Rocket size={14} />
                                    }

                                    {generatedToken.mode}
                                </div>
                                <div><Calendar size={14} /> {generatedToken.name} · {formatDate(generatedToken.created)}</div>
                                <div><Clock size={14} /> Expires: {formatDate(generatedToken.expires)}</div>
                            </div>
                        </div>
                        <button className="btn-submit" onClick={() => handleLeaveConfirmation(() => { }, "token")}>
                            <Check size={16} /> I've Saved the Token, Go Back
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
                                openRegenerateForm(selectedEnv, currentToken?.mode || '');
                            }}>Continue</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Confirmation Modal */}
            {showLeaveModal && (
                <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <AlertTriangle size={22} color={leaveModalType === "form" ? "#ef4444" : "#f59e0b"} />
                            <h3>{leaveModalType === "form" ? "Discard Token Form?" : "Leave Token Page?"}</h3>
                        </div>
                        <div className="modal-body">
                            {leaveModalType === "form" ? (
                                <>
                                    <p>Are you sure you want to go back?</p>
                                    <p className="warning-text">The token form you are currently filling out will be discarded and your unsaved changes will be lost.</p>
                                </>
                            ) : (
                                <>
                                    <p>Have you copied and saved this token?</p>
                                    <p className="warning-text">This token will not be shown again after leaving this page.</p>
                                </>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowLeaveModal(false)}>Stay Here</button>
                            <button className="btn-submit" onClick={confirmLeave} style={{ background: leaveModalType === "form" ? "#ef4444" : undefined }}>
                                {leaveModalType === "form" ? "Discard & Go Back" : "Yes, Leave Page"}
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
                                <div>
                                    {tokenmode === 'Sandbox' ? <Wrench size={14} /> : <Rocket size={14} />}
                                    Mode: <strong>{tokenmode}</strong>
                                </div>
                                {isRegenerating && currentToken && (
                                    <div className="regenerating-info">
                                        Regenerating will revoke: <strong>{currentToken.name}</strong>
                                    </div>
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
        </div>
    );
}