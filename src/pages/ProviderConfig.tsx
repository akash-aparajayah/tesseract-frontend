import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/EnvironmentManagement.css";
import {
    Copy, Plus, Globe, Lock, Monitor, Server,
    Pencil, Trash2, X, Check, Home, Rocket, Wrench, AlertTriangle,
    MessageSquare, Mail, MessageCircle, Plug,
    Search
} from 'lucide-react';

const PROVIDER_FIELDS_MAP: Record<string, { name: string; label: string; type: string; required?: boolean }[]> = {
    MSG91: [
        { name: "apiKey", label: "API Key", type: "password", required: true },
        { name: "endpoint", label: "Endpoint URL", type: "text", required: false },
        { name: "senderId", label: "Sender ID", type: "text", required: true },
        { name: "templateId", label: "Template ID (DLT)", type: "text", required: true },
    ],
    Twilio: [
        { name: "accountSid", label: "Account SID", type: "text", required: true },
        { name: "authToken", label: "Auth Token", type: "password", required: true },
        { name: "phoneNumber", label: "Phone Number", type: "text", required: true },
    ],
    Gupshup: [
        { name: "apiKey", label: "API Key", type: "password", required: true },
        { name: "senderId", label: "Sender ID", type: "text", required: true },
    ],
    Vonage: [
        { name: "apiKey", label: "API Key", type: "password", required: true },
        { name: "apiSecret", label: "API Secret", type: "password", required: true },
        { name: "senderId", label: "Sender ID", type: "text", required: false },
    ],
    SendGrid: [
        { name: "apiKey", label: "API Key", type: "password", required: true },
        { name: "fromEmail", label: "From Email", type: "email", required: true },
        { name: "fromName", label: "From Name", type: "text", required: false },
    ],
    AWS_SES: [
        { name: "accessKeyId", label: "Access Key ID", type: "text", required: true },
        { name: "secretAccessKey", label: "Secret Access Key", type: "password", required: true },
        { name: "region", label: "Region", type: "text", required: true },
        { name: "fromEmail", label: "From Email", type: "email", required: true },
    ],
    Mailgun: [
        { name: "apiKey", label: "API Key", type: "password", required: true },
        { name: "domain", label: "Domain", type: "text", required: true },
        { name: "fromEmail", label: "From Email", type: "email", required: true },
    ],
    SMTP: [
        { name: "host", label: "SMTP Host", type: "text", required: true },
        { name: "port", label: "Port", type: "number", required: true },
        { name: "username", label: "Username", type: "text", required: true },
        { name: "password", label: "Password", type: "password", required: true },
        { name: "fromEmail", label: "From Email", type: "email", required: true },
    ],
    WhatsApp_Twilio: [
        { name: "accountSid", label: "Account SID", type: "text", required: true },
        { name: "authToken", label: "Auth Token", type: "password", required: true },
        { name: "phoneNumber", label: "WhatsApp Number", type: "text", required: true },
    ],
    Meta_Cloud: [
        { name: "phoneNumberId", label: "Phone Number ID", type: "text", required: true },
        { name: "accessToken", label: "Access Token", type: "password", required: true },
        { name: "businessAccountId", label: "Business Account ID", type: "text", required: true },
    ],
};

const SERVICE_TYPES = ["SMS", "EMAIL", "WHATSAPP"];
const SERVICE_COLORS: Record<string, string> = {
    SMS: "#10b981",
    EMAIL: "#6366f1",
    WHATSAPP: "#25D366"
};
const SERVICE_ICONS: Record<string, React.ReactNode> = {
    SMS: <MessageSquare size={18} />,
    EMAIL: <Mail size={18} />,
    WHATSAPP: <MessageCircle size={18} />
};

const PROVIDERS_BY_SERVICE: Record<string, string[]> = {
    SMS: ["MSG91", "Twilio", "Gupshup", "Vonage", "Kaleyra", "Textlocal", "TrueDialog"],
    EMAIL: ["SendGrid", "AWS_SES", "Mailgun", "SMTP", "Postmark"],
    WHATSAPP: ["WhatsApp_Twilio", "WhatsApp_Gupshup", "Meta_Cloud", "WhatsApp_Kaleyra", "WhatsApp_Vonage"]
};

interface Provider {
    id: number;
    name: string;
    fields: Record<string, string>;
}

interface EnvironmentInfo {
    name: string;
    icon: React.ReactNode;
    hasProviders: boolean;
    providerCount: number;
}

export default function ProviderConfig() {
    const navigate = useNavigate();
    const location = useLocation();
    const { project, environmentName, activeService: initialService } = location.state || {};
    const { showToast, ToastContainer } = useToast();

    const [openEnvMenu, setOpenEnvMenu] = useState<string | null>(null);
    const [environments, setEnvironments] = useState<EnvironmentInfo[]>([]);
    const [selectedEnv, setSelectedEnv] = useState<string>(environmentName || "");
    const [activeService, setActiveService] = useState<string>(initialService || "SMS");
    const [providers, setProviders] = useState<Provider[]>([]);
    const [expandedProviders, setExpandedProviders] = useState<Record<number, boolean>>({});
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
    const [serviceProviderCounts, setServiceProviderCounts] = useState<Record<string, number>>({ SMS: 0, EMAIL: 0, WHATSAPP: 0 });

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState("");
    const [providerFields, setProviderFields] = useState<Record<string, string>>({});
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
    const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
    const [saving, setSaving] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState<{ id: number; name: string } | null>(null);
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [cloneTarget, setCloneTarget] = useState("");
    const [cloneCustomMode, setCloneCustomMode] = useState(false);
    const [cloneCustomName, setCloneCustomName] = useState("");
    const [showAddEnvModal, setShowAddEnvModal] = useState(false);
    const [newEnvName, setNewEnvName] = useState("");
    const [isCustomEnv, setIsCustomEnv] = useState(false);
    const [customEnvInput, setCustomEnvInput] = useState("");
    const [showEditEnvModal, setShowEditEnvModal] = useState(false);
    const [editingEnvName, setEditingEnvName] = useState("");
    const [editEnvName, setEditEnvName] = useState("");
    const [showDeleteEnvModal, setShowDeleteEnvModal] = useState(false);
    const [deletingEnvName, setDeletingEnvName] = useState("");
    const [blockedDeleteCounts, setBlockedDeleteCounts] = useState({ sms: 0, email: 0, whatsapp: 0 });
    const [searchProvider] = useState("");
    const [globalSearch, setGlobalSearch] = useState("");

    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [searchFilter, setSearchFilter] =
        useState("ALL");

    useEffect(() => {

        const state = location.state;

        if (!state?.action) return;

        // ENVIRONMENT ACTIONS

        if (state.action === "ADD_ENVIRONMENT") {

            setShowAddEnvModal(true);

        }

        if (
            state.action === "EDIT_ENVIRONMENT"
        ) {

            setEditingEnvName(
                state.environmentName
            );

            setEditEnvName(
                state.environmentName
            );

            setShowEditEnvModal(true);

        }

        if (
            state.action === "CLONE_ENVIRONMENT"
        ) {

            setCloneTarget(
                state.environmentName
            );

            setShowCloneModal(true);

        }

        if (
            state.action === "DELETE_ENVIRONMENT"
        ) {

            setDeletingEnvName(
                state.environmentName
            );

            setShowDeleteEnvModal(true);

        }

        // PROVIDER ACTIONS

        if (state.action === "ADD_PROVIDER") {

            if (state.environmentName) {
                setSelectedEnv(
                    state.environmentName
                );
            }

            if (state.service) {
                setActiveService(
                    state.service
                );
            }

            setEditingProvider(null);

            setSelectedProvider("");

            setProviderFields({});

            setShowAddModal(true);

        }

        if (state.action === "EDIT_PROVIDER") {

            if (state.environmentName) {
                setSelectedEnv(
                    state.environmentName
                );
            }

            if (state.service) {
                setActiveService(
                    state.service
                );
            }

            if (state.provider) {

                editProvider(
                    state.provider
                );

            }

        }

        if (state.action === "DELETE_PROVIDER") {

            if (state.environmentName) {
                setSelectedEnv(
                    state.environmentName
                );
            }

            if (state.service) {
                setActiveService(
                    state.service
                );
            }

            if (state.provider) {

                setShowDeleteModal({
                    id: state.provider.id,
                    name: state.provider.name
                });

            }

        }

    }, [location.state]);

    useEffect(() => {

        const handleClick = (e: MouseEvent) => {

            const target = e.target as HTMLElement;

            if (
                !target.closest('.global-search-wrapper')
            ) {
                setShowSearchDropdown(false);
            }
        };

        document.addEventListener(
            'mousedown',
            handleClick
        );

        return () =>
            document.removeEventListener(
                'mousedown',
                handleClick
            );

    }, []);

    // Add this useEffect in ProviderConfig.tsx
    useEffect(() => {
        if (!openEnvMenu) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Don't close if clicking inside the menu
            if (target.closest('.env-menu-dropdown') || target.closest('.env-menu-trigger')) {
                return;
            }
            setOpenEnvMenu(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openEnvMenu]);
    useEffect(() => {
        if (!project) {
            showToast("Invalid request. Redirecting...", "error");
            setTimeout(() => navigate("/dashboard/project"), 1500);
            return;
        }
        loadEnvironments();
    }, []);

    useEffect(() => {
        if (selectedEnv) loadProviders();
    }, [selectedEnv, activeService]);

    useEffect(() => {
        if (environments.length === 0) {
            setTimeout(() => {
                const illustrator = document.querySelector('.pc-fullpage-illustrator');
                if (illustrator) illustrator.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [environments.length]);

    const getEnvIcon = (name: string): React.ReactNode => {
        const icons: Record<string, React.ReactNode> = {
            'Local': <Home size={16} />, 'Dev': <Monitor size={16} />,
            'Staging': <Rocket size={16} />, 'Live': <Globe size={16} />
        };
        return icons[name] || <Wrench size={16} />;
    };

    const loadEnvironments = () => {
        const presetEnvs = ['Local', 'Dev', 'Staging', 'Live'];
        const allKeys = Object.keys(localStorage);
        const envSet = new Set<string>();
        allKeys.forEach(key => {
            const match = key.match(/^env_(.+)_(sms|email|whatsapp)_providers$/);
            if (match) envSet.add(match[1]);
        });
        presetEnvs.forEach(env => {
            if (localStorage.getItem(`env_${env}_sms_providers`) || localStorage.getItem(`env_${env}_email_providers`) || localStorage.getItem(`env_${env}_whatsapp_providers`)) {
                envSet.add(env);
            }
        });
        const configuredEnvs: EnvironmentInfo[] = [];
        envSet.forEach(envName => {
            const sms = JSON.parse(localStorage.getItem(`env_${envName}_sms_providers`) || '{"providers":[]}');
            const email = JSON.parse(localStorage.getItem(`env_${envName}_email_providers`) || '{"providers":[]}');
            const whatsapp = JSON.parse(localStorage.getItem(`env_${envName}_whatsapp_providers`) || '{"providers":[]}');
            const total = (sms.providers?.length || 0) + (email.providers?.length || 0) + (whatsapp.providers?.length || 0);
            configuredEnvs.push({ name: envName, icon: getEnvIcon(envName), hasProviders: total > 0, providerCount: total });
        });
        configuredEnvs.sort((a, b) => {
            const aIdx = presetEnvs.indexOf(a.name), bIdx = presetEnvs.indexOf(b.name);
            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
            if (aIdx !== -1) return -1;
            if (bIdx !== -1) return 1;
            return a.name.localeCompare(b.name);
        });
        setEnvironments(configuredEnvs);
        if (configuredEnvs.length > 0 && (!selectedEnv || !configuredEnvs.some(e => e.name === selectedEnv))) {
            setSelectedEnv(configuredEnvs[0].name);
        }
    };

    const loadProviders = () => {
        if (!selectedEnv) return;
        const key = `env_${selectedEnv}_${activeService.toLowerCase()}_providers`;
        const data = localStorage.getItem(key);
        setProviders(data ? JSON.parse(data).providers || [] : []);
        updateServiceCounts();
    };

    const updateServiceCounts = () => {
        if (!selectedEnv) return;
        const counts: Record<string, number> = {};
        SERVICE_TYPES.forEach(s => {
            const key = `env_${selectedEnv}_${s.toLowerCase()}_providers`;
            const data = localStorage.getItem(key);
            counts[s] = data ? JSON.parse(data).providers?.length || 0 : 0;
        });
        setServiceProviderCounts(counts);
    };

    const saveToLocalStorage = (p: Provider[]) => {
        localStorage.setItem(`env_${selectedEnv}_${activeService.toLowerCase()}_providers`, JSON.stringify({ providers: p, timestamp: Date.now() }));
    };

    const handleAddEnvironment = () => {
        let name = newEnvName;
        if (isCustomEnv && customEnvInput.trim()) name = customEnvInput.trim();
        if (!name) { showToast("Please enter environment name", "error"); return; }
        if (environments.some(e => e.name.toLowerCase() === name.toLowerCase())) { showToast("Already exists", "error"); return; }
        ['sms', 'email', 'whatsapp'].forEach(s => {
            if (!localStorage.getItem(`env_${name}_${s}_providers`)) localStorage.setItem(`env_${name}_${s}_providers`, JSON.stringify({ providers: [], timestamp: Date.now() }));
        });
        setEnvironments(prev => [...prev, { name, icon: getEnvIcon(name), hasProviders: false, providerCount: 0 }]);
        setSelectedEnv(name); setProviders([]); setServiceProviderCounts({ SMS: 0, EMAIL: 0, WHATSAPP: 0 });
        setShowAddEnvModal(false); setNewEnvName(""); setIsCustomEnv(false); setCustomEnvInput("");
        showToast(`Environment "${name}" created!`, "success");
    };

    // ... (rest of functions: handleEditEnvironment, handleDeleteEnvironment, saveProvider, editProvider, deleteProvider, executeClone, etc. - keep them exactly as they were)

    const executeClone = () => {
        let target = cloneCustomMode && cloneCustomName.trim() ? cloneCustomName.trim() : cloneTarget;
        if (!target) { showToast("Select target", "error"); return; }
        ['sms', 'email', 'whatsapp'].forEach(s => {
            const src = localStorage.getItem(`env_${selectedEnv}_${s}_providers`);
            if (src) localStorage.setItem(`env_${target}_${s}_providers`, JSON.stringify({ ...JSON.parse(src), timestamp: Date.now() }));
        });
        loadEnvironments(); setSelectedEnv(target); loadProviders();
        showToast("Cloned!", "success"); setShowCloneModal(false);
    };

    const saveProvider = () => {
        if (!selectedProvider) { showToast("Select provider", "error"); return; }
        const fields = PROVIDER_FIELDS_MAP[selectedProvider];
        if (fields) for (const f of fields) if (f.required && !providerFields[f.name]) { showToast(`${f.label} required`, "error"); return; }
        setSaving(true);
        setTimeout(() => {
            let updated: Provider[];
            if (editingProvider) {
                updated = providers.map(p => p.id === editingProvider.id ? { ...p, name: selectedProvider, fields: { ...providerFields } } : p);
            } else {
                updated = [...providers, { id: Date.now(), name: selectedProvider, fields: { ...providerFields } }];
            }
            setProviders(updated); saveToLocalStorage(updated); updateServiceCounts(); loadEnvironments();
            setShowAddModal(false); setEditingProvider(null); setSelectedProvider(""); setProviderFields({}); setSaving(false);
            showToast("Saved!", "success");
        }, 800);
    };

    const editProvider = (p: Provider) => { setEditingProvider(p); setSelectedProvider(p.name); setProviderFields({ ...p.fields }); setShowAddModal(true); };
    const deleteProvider = () => {
        if (!showDeleteModal) return;
        const updated = providers.filter(p => p.id !== showDeleteModal.id);
        setProviders(updated); saveToLocalStorage(updated); updateServiceCounts(); loadEnvironments();
        setShowDeleteModal(null); showToast("Deleted", "success");
    };
    const closeAddModal = () => { setShowAddModal(false); setEditingProvider(null); setSelectedProvider(""); setProviderFields({}); setShowCancelConfirm(false); };
    const handleCancelAdd = () => selectedProvider || Object.values(providerFields).some(v => v) ? setShowCancelConfirm(true) : closeAddModal();
    const handleEditEnvironment = () => {
        if (!editEnvName.trim()) return showToast("Name required", "error");
        if (environments.some(e => e.name.toLowerCase() === editEnvName.toLowerCase() && e.name !== editingEnvName)) return showToast("Exists", "error");
        ['sms', 'email', 'whatsapp'].forEach(s => {
            const old = `env_${editingEnvName}_${s}_providers`, nw = `env_${editEnvName}_${s}_providers`;
            const d = localStorage.getItem(old); if (d) { localStorage.setItem(nw, d); localStorage.removeItem(old); }
        });
        loadEnvironments(); if (selectedEnv === editingEnvName) setSelectedEnv(editEnvName);
        setShowEditEnvModal(false); showToast("Updated", "success");
    };
    const handleDeleteEnvironment = () => {
        ['sms', 'email', 'whatsapp'].forEach(s => localStorage.removeItem(`env_${deletingEnvName}_${s}_providers`));
        const updated = environments.filter(e => e.name !== deletingEnvName);
        setEnvironments(updated); if (selectedEnv === deletingEnvName) setSelectedEnv(updated[0]?.name || "");
        setShowDeleteEnvModal(false); showToast("Deleted", "success");
    };
    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProvider(e.target.value);
        const defs = PROVIDER_FIELDS_MAP[e.target.value] || [];
        const nf: Record<string, string> = {}; defs.forEach(f => nf[f.name] = "");
        setProviderFields(nf);
    };
    const handleFieldChange = (n: string, v: string) => setProviderFields(prev => ({ ...prev, [n]: v }));
    const togglePasswordVisibility = (n: string) => setShowPasswords(prev => ({ ...prev, [n]: !prev[n] }));
    const filteredEnvironments = environments.filter(env => {

        const matchesSearch =
            env.name
                .toLowerCase()
                .includes(searchProvider.toLowerCase());

        return matchesSearch;
    });

    const searchResults = (() => {

        if (!globalSearch.trim()) return [];

        const query = globalSearch.toLowerCase();

        const results: any[] = [];

        environments.forEach((env) => {

            // CHECK ENV PROVIDERS
            const smsData = JSON.parse(
                localStorage.getItem(
                    `env_${env.name}_sms_providers`
                ) || '{"providers":[]}'
            );

            const emailData = JSON.parse(
                localStorage.getItem(
                    `env_${env.name}_email_providers`
                ) || '{"providers":[]}'
            );

            const whatsappData = JSON.parse(
                localStorage.getItem(
                    `env_${env.name}_whatsapp_providers`
                ) || '{"providers":[]}'
            );

            const totalProviders =
                (smsData.providers?.length || 0) +
                (emailData.providers?.length || 0) +
                (whatsappData.providers?.length || 0);

            // ENVIRONMENT RESULT
            if (
                env.name.toLowerCase().includes(query)
            ) {

                if (
                    searchFilter === "ALL" ||
                    searchFilter === "ENVIRONMENTS" ||
                    (
                        searchFilter === "EMPTY_ENVIRONMENTS" &&
                        totalProviders === 0
                    )
                ) {

                    results.push({
                        type: "environment",
                        label: env.name,
                        environment: env.name
                    });

                }

            }

            SERVICE_TYPES.forEach((service) => {

                // SERVICE RESULT
                if (
                    service
                        .toLowerCase()
                        .includes(query)
                ) {

                    if (
                        searchFilter === "ALL" ||
                        searchFilter === "SERVICES"
                    ) {

                        results.push({
                            type: "service",
                            label: service,
                            environment: env.name,
                            service
                        });

                    }

                }

                // PROVIDERS
                const data = JSON.parse(
                    localStorage.getItem(
                        `env_${env.name}_${service.toLowerCase()}_providers`
                    ) || '{"providers":[]}'
                );

                data.providers?.forEach((provider: any) => {

                    if (
                        provider.name
                            .toLowerCase()
                            .includes(query)
                    ) {

                        if (
                            searchFilter === "ALL" ||
                            searchFilter === "PROVIDERS" ||
                            searchFilter === "CONFIGURED_PROVIDERS"
                        ) {

                            results.push({
                                type: "provider",
                                label: provider.name.replace(/_/g, ' '),
                                environment: env.name,
                                service,
                                providerId: provider.id
                            });

                        }

                    }

                });

            });

        });

        return results;

    })();

    if (!project) return <div className="loading">Loading...</div>;

    return (
        <div className="provider-config-redesign">
            <ToastContainer />

            {/* Header */}
            <div className="pc-header">
                <div className="pc-header-top">
                    <h1>Environment Management</h1>
                    <div className="pc-breadcrumbs">
                        <button className="breadcrumb-link" onClick={() => navigate("/dashboard")}>Dashboard</button>
                        <span className="breadcrumb-separator">›</span>
                        <button onClick={() => navigate("/dashboard/project")}>Projects</button>
                        <span>›</span>
                        <span className="current">Environment Management</span>
                    </div>
                </div>
                <p className="pc-project-name">
                    {project.logo && <img src={project.logo} alt="Logo" className="pc-project-logo" />}
                    <button className="pc-project-link" onClick={() => navigate(`/dashboard/project/${project.id}/view`)}>{project.name}</button>
                </p>
            </div>

            {/* FIRST TIME - No Environments */}
            {environments.length === 0 && (
                <div className="pc-fullpage-illustrator">
                    <div className="pc-bg-circles"><div className="pc-bg-circle circle-1" /><div className="pc-bg-circle circle-2" /><div className="pc-bg-circle circle-3" /></div>
                    <div className="pc-floating-dots"><span className="dot dot-1" /><span className="dot dot-2" /><span className="dot dot-3" /><span className="dot dot-4" /><span className="dot dot-5" /><span className="dot dot-6" /></div>
                    <div className="pc-center-card">
                        <div className="pc-card-icon"><Globe size={56} color="#00f2fe" /></div>
                        <h2>Configure Your Environment</h2>
                        <p>Get started by creating an environment to manage SMS, Email & WhatsApp providers</p>
                        <div className="pc-card-steps">
                            <div className="pc-card-step"><span className="pc-step-dot">1</span><span>Choose an environment type</span></div>
                            <div className="pc-card-step"><span className="pc-step-dot">2</span><span>Add providers for each service</span></div>
                            <div className="pc-card-step"><span className="pc-step-dot">3</span><span>Start sending notifications</span></div>
                        </div>
                        <div className="pc-card-select">
                            <div className="pc-env-options">
                                {['Local', 'Dev', 'Staging', 'Live'].map(env => (
                                    <div key={env} className={`pc-env-option ${newEnvName === env && !isCustomEnv ? 'selected' : ''}`}
                                        onClick={() => { setNewEnvName(env); setIsCustomEnv(false); }}>
                                        <span className="pc-env-option-icon">{getEnvIcon(env)}</span><span>{env}</span>
                                        {newEnvName === env && !isCustomEnv && <Check size={16} />}
                                    </div>
                                ))}
                                <div className={`pc-env-option custom ${isCustomEnv ? 'selected' : ''}`} onClick={() => { setIsCustomEnv(true); setNewEnvName(""); }}>
                                    <span className="pc-env-option-icon"><Wrench size={18} /></span><span>Custom</span>
                                    {isCustomEnv && <Check size={16} />}
                                </div>
                            </div>
                            {isCustomEnv && <input type="text" placeholder="Enter environment name" value={customEnvInput} onChange={e => setCustomEnvInput(e.target.value)} className="pc-input" autoFocus />}
                            <button className="pc-create-first-env-btn" onClick={handleAddEnvironment}
                                disabled={(!isCustomEnv && !newEnvName) || (isCustomEnv && !customEnvInput.trim())}>
                                Create Environment <Rocket size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HAS ENVIRONMENTS */}
            {selectedEnv && (
                <>
                    <div className="env-header-row">

                        <h3 className="env-heading">
                            Environments
                        </h3>

                        <div className="env-header-right">

                            {/* SEARCH */}
                            <div className="global-search-wrapper">
                                <Search size={14} className="global-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search environments, services, providers..."
                                    value={globalSearch}
                                    onChange={(e) => {
                                        setGlobalSearch(e.target.value);
                                        setShowSearchDropdown(true);
                                    }}
                                    onFocus={() =>
                                        setShowSearchDropdown(true)
                                    }
                                    className="global-search-input"
                                />

                                {showSearchDropdown && (
                                    <div className="global-search-dropdown">

                                        {searchResults.length === 0 ? (

                                            <div className="search-no-results">
                                                No results found
                                            </div>

                                        ) : (

                                            searchResults.map((result, index) => (

                                                <button
                                                    key={index}
                                                    className="search-result-item"
                                                    onClick={() => {

                                                        if (result.environment) {
                                                            setSelectedEnv(
                                                                result.environment
                                                            );
                                                        }

                                                        if (result.service) {
                                                            setActiveService(
                                                                result.service
                                                            );
                                                        }

                                                        if (result.providerId) {
                                                            setExpandedProviders(
                                                                prev => ({
                                                                    ...prev,
                                                                    [result.providerId]: true
                                                                })
                                                            );
                                                        }

                                                        setGlobalSearch("");

                                                        setShowSearchDropdown(false);

                                                    }}
                                                >

                                                    <div className="search-result-main">
                                                        {result.label}
                                                    </div>

                                                    <div className="search-result-meta">

                                                        {result.environment}

                                                        {result.service &&
                                                            ` • ${result.service}`}

                                                    </div>

                                                </button>

                                            ))

                                        )}

                                    </div>
                                )}

                            </div>

                            {/* FILTER */}
                            <select
                                className="global-search-filter"
                                value={searchFilter}
                                onChange={(e) =>
                                    setSearchFilter(e.target.value)
                                }
                            >

                                <option value="ALL">
                                    All
                                </option>

                                <option value="ENVIRONMENTS">
                                    Environments
                                </option>

                                <option value="SERVICES">
                                    Services
                                </option>

                                <option value="PROVIDERS">
                                    Providers
                                </option>

                            </select>

                            {/* ADD BUTTON */}
                            <button
                                className="pc-add-env-btn"
                                onClick={() => {
                                    setNewEnvName("");
                                    setIsCustomEnv(false);
                                    setCustomEnvInput("");
                                    setShowAddEnvModal(true);
                                }}
                            >
                                <Plus size={14} />
                                New Environment
                            </button>

                        </div>
                    </div>

                    {/* Environment Tabs */}
                    <div className="env-tabs-container">
                        <div className="env-tabs">
                            {filteredEnvironments.length === 0 && (
                                <div className="env-empty-search">
                                    No environments found
                                </div>
                            )}
                            {filteredEnvironments.map(env => (
                                <div key={env.name} className={`env-tab ${selectedEnv === env.name ? 'active' : ''}`}
                                    onClick={() => { setSelectedEnv(env.name); setOpenEnvMenu(null); }}>
                                    <span className="env-tab-name">{env.name}</span>
                                    <div className="env-tab-menu" onClick={e => e.stopPropagation()}>
                                        <button className="env-menu-trigger" onClick={() => setOpenEnvMenu(openEnvMenu === env.name ? null : env.name)}>⋯</button>
                                        {openEnvMenu === env.name && (
                                            <div className="env-menu-dropdown">
                                                <button onClick={() => { setCloneTarget(""); setCloneCustomMode(false); setShowCloneModal(true); setOpenEnvMenu(null); }}><Copy size={14} /></button>
                                                <button onClick={() => { setEditingEnvName(env.name); setEditEnvName(env.name); setShowEditEnvModal(true); setOpenEnvMenu(null); }}><Pencil size={14} /></button>
                                                <button onClick={() => {
                                                    const sms = JSON.parse(localStorage.getItem(`env_${env.name}_sms_providers`) || '{"providers":[]}');
                                                    const email = JSON.parse(localStorage.getItem(`env_${env.name}_email_providers`) || '{"providers":[]}');
                                                    const wa = JSON.parse(localStorage.getItem(`env_${env.name}_whatsapp_providers`) || '{"providers":[]}');
                                                    const total = (sms.providers?.length || 0) + (email.providers?.length || 0) + (wa.providers?.length || 0);
                                                    setDeletingEnvName(env.name);
                                                    if (total > 0) setBlockedDeleteCounts({ sms: sms.providers?.length || 0, email: email.providers?.length || 0, whatsapp: wa.providers?.length || 0 });
                                                    else setShowDeleteEnvModal(true);
                                                    setOpenEnvMenu(null);
                                                }}><Trash2 size={14} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Service & Env Info */}


                    {/* Services Sidebar + Providers Panel */}
                    <div className="pc-main-content">
                        {/* Services Sidebar */}
                        <div className="pc-sidebar-wrapper">
                            <div className="pc-service-env-info">
                                <span className="pc-service-label">{activeService}</span>
                                <span className="pc-separator-dash">-</span>
                                <span className="pc-env-label">{selectedEnv}</span>
                            </div>
                            <div className="pc-sidebar">
                                {SERVICE_TYPES.map(service => (
                                    <div key={service}
                                        className={`pc-sidebar-item ${activeService === service ? 'active' : ''}`}
                                        onClick={() => setActiveService(service)}
                                        style={{
                                            borderLeftColor: activeService === service ? SERVICE_COLORS[service] : 'transparent',
                                            backgroundColor: activeService === service ? `${SERVICE_COLORS[service]}10` : 'transparent'
                                        }}>
                                        <span className="pc-sidebar-icon">{SERVICE_ICONS[service]}</span>
                                        <div className="pc-sidebar-info">
                                            <div className="pc-sidebar-name">{service}</div>
                                            <div className="pc-sidebar-count">{serviceProviderCounts[service] || 0} providers</div>
                                        </div>
                                        {activeService === service && <div className="pc-sidebar-active-indicator" style={{ background: SERVICE_COLORS[service] }} />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Providers Panel */}
                        <div className="pc-sidebar-wrapper" style={{ flex: 1 }}>
                            <h4 className="pc-column-label pc-column-label-providers">Providers</h4>
                            <div className="pc-providers-panel" style={{ borderTop: `3px solid ${SERVICE_COLORS[activeService]}` }}>
                                <div className="pc-panel-header">
                                    <div className="pc-panel-title">
                                        {SERVICE_ICONS[activeService]}
                                        <h3>{activeService} Providers</h3>
                                        <span className="pc-panel-count">{serviceProviderCounts[activeService] || 0}</span>
                                    </div>
                                    <button className="pc-add-btn" style={{ backgroundColor: SERVICE_COLORS[activeService] }}
                                        onClick={() => { setEditingProvider(null); setSelectedProvider(""); setProviderFields({}); setShowAddModal(true); }}>
                                        <Plus size={14} /> Add Provider
                                    </button>
                                </div>
                                <div className="pc-providers-list">
                                    {providers.length === 0 ? (
                                        <div className="pc-empty-state">
                                            <Server size={44} color="#cbd5e1" />
                                            <h4>No {activeService} providers yet</h4>
                                            <p>Add your first provider to start configuring services</p>
                                        </div>
                                    ) : (
                                        providers.map(provider => (
                                            <div key={provider.id} className="pc-provider-card" style={{ borderLeftColor: SERVICE_COLORS[activeService] }}>
                                                <div className="pc-provider-card-header" onClick={() => setExpandedProviders(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}>
                                                    <div className="pc-provider-title">
                                                        <Plug size={14} />
                                                        <span>{provider.name.replace(/_/g, ' ')}</span>
                                                        <span className="pc-configured-badge" style={{ background: `${SERVICE_COLORS[activeService]}15`, color: SERVICE_COLORS[activeService] }}>
                                                            <Check size={10} /> Configured
                                                        </span>
                                                        <span className="pc-notification-count">0 sent</span>
                                                    </div>
                                                    <div className="pc-provider-actions" onClick={e => e.stopPropagation()}>
                                                        <button className="pc-edit-btn" onClick={() => editProvider(provider)}><Pencil size={14} /></button>
                                                        <button className="pc-delete-btn" onClick={() => setShowDeleteModal({ id: provider.id, name: provider.name })}><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                                {expandedProviders[provider.id] && (
                                                    <div className="pc-provider-card-body">
                                                        {Object.entries(provider.fields).map(([key, value]) => {
                                                            const fc = PROVIDER_FIELDS_MAP[provider.name]?.find((f: any) => f.name === key);
                                                            const isPwd = fc?.type === "password" || key.includes("Key") || key.includes("Token");
                                                            const pk = `${provider.id}_${key}`;
                                                            return (
                                                                <div className="pc-credential-row" key={key}>
                                                                    <span className="pc-credential-label">{fc?.label || key}</span>
                                                                    <span className="pc-credential-value">{isPwd ? (visiblePasswords[pk] ? value : "••••••••••") : value || "—"}</span>
                                                                    {isPwd && value && (
                                                                        <button className="pc-eye-btn-inline" onClick={() => setVisiblePasswords(prev => ({ ...prev, [pk]: !prev[pk] }))}>
                                                                            {visiblePasswords[pk] ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Add Environment Modal */}
            {showAddEnvModal && (
                <div className="pc-modal-overlay" onClick={() => setShowAddEnvModal(false)}>
                    <div className="pc-modal" onClick={e => e.stopPropagation()}>
                        <div className="pc-modal-header">
                            <h3><Plus size={18} /> Add Environment</h3>
                            <button className="pc-modal-close" onClick={() => setShowAddEnvModal(false)}><X size={20} /></button>
                        </div>
                        <div className="pc-modal-body">
                            <p className="pc-modal-desc">Select an environment or create a custom one</p>
                            <div className="pc-env-options">
                                {['Local', 'Dev', 'Staging', 'Live'].filter(env => !environments.some(e => e.name === env)).map(env => (
                                    <div key={env} className={`pc-env-option ${newEnvName === env && !isCustomEnv ? 'selected' : ''}`}
                                        onClick={() => { setNewEnvName(env); setIsCustomEnv(false); }}>
                                        <span className="pc-env-option-icon">{getEnvIcon(env)}</span>
                                        <span>{env}</span>
                                        {newEnvName === env && !isCustomEnv && <Check size={18} className="pc-check" />}
                                    </div>
                                ))}
                                <div className={`pc-env-option custom ${isCustomEnv ? 'selected' : ''}`} onClick={() => { setIsCustomEnv(true); setNewEnvName(""); }}>
                                    <span className="pc-env-option-icon"><Wrench size={18} /></span>
                                    <span>Custom Environment</span>
                                    {isCustomEnv && <Check size={18} className="pc-check" />}
                                </div>
                            </div>
                            {isCustomEnv && (
                                <div className="pc-form-group">
                                    <label>Environment Name *</label>
                                    <input type="text" placeholder="e.g., Production, Testing, QA" value={customEnvInput}
                                        onChange={(e) => setCustomEnvInput(e.target.value)} className="pc-input" autoFocus />
                                </div>
                            )}
                        </div>
                        <div className="pc-modal-footer">
                            <button className="pc-btn-cancel" onClick={() => { setShowAddEnvModal(false); setNewEnvName(""); setIsCustomEnv(false); setCustomEnvInput(""); }}>Cancel</button>
                            <button className="pc-btn-primary" onClick={handleAddEnvironment}
                                disabled={(!isCustomEnv && !newEnvName) || (isCustomEnv && !customEnvInput.trim())}>
                                Save Environment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Provider Modal */}
            {showAddModal && (
                <div className="pc-modal-overlay" onClick={handleCancelAdd}>
                    <div className="pc-modal pc-modal-provider" onClick={e => e.stopPropagation()}>
                        <div className="pc-modal-header">
                            <div className="pc-modal-header-left">
                                {/* Service Badge */}
                                <span className="pc-modal-service-badge" style={{
                                    backgroundColor: `${SERVICE_COLORS[activeService]}15`,
                                    color: SERVICE_COLORS[activeService],
                                    border: `1px solid ${SERVICE_COLORS[activeService]}40`
                                }}>
                                    {SERVICE_ICONS[activeService]}
                                    <span>{activeService}</span>
                                </span>
                                <h3>{editingProvider ? 'Edit Provider' : 'Add Provider'}</h3>
                            </div>
                            <button className="pc-modal-close" onClick={handleCancelAdd}><X size={20} /></button>
                        </div>

                        {/* Environment info bar */}
                        <div className="pc-modal-env-info">
                            <Globe size={14} />
                            <span>Environment: <strong>{selectedEnv}</strong></span>
                        </div>

                        <div className="pc-modal-body">
                            <div className="pc-form-group">
                                <label>Select Provider *</label>
                                <select value={selectedProvider} onChange={handleProviderChange} className="pc-select">
                                    <option value="">-- Choose provider --</option>
                                    {PROVIDERS_BY_SERVICE[activeService]
                                        ?.filter(p => editingProvider?.name === p || !providers.some(prov => prov.name === p))
                                        .map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                            {selectedProvider && PROVIDER_FIELDS_MAP[selectedProvider] && (
                                <div className="pc-credentials-section">
                                    <h4><Lock size={14} /> Credentials</h4>
                                    {PROVIDER_FIELDS_MAP[selectedProvider].map((field: any) => (
                                        <div className="pc-form-group" key={field.name}>
                                            <label>{field.label}{field.required && " *"}</label>
                                            <div className="pc-input-wrapper">
                                                <input
                                                    type={field.type === "password" && !showPasswords[field.name] ? "password" : "text"}
                                                    value={providerFields[field.name] || ""}
                                                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                                    placeholder={`Enter ${field.label}`}
                                                    className="pc-input"
                                                />
                                                {field.type === "password" && (
                                                    <button type="button" className="pc-eye-btn" onClick={() => togglePasswordVisibility(field.name)}>
                                                        {showPasswords[field.name] ? <FaEyeSlash /> : <FaEye />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="pc-modal-footer">
                            <button className="pc-btn-cancel" onClick={handleCancelAdd}>Cancel</button>
                            <button
                                className="pc-btn-primary"
                                onClick={saveProvider}
                                disabled={saving}
                                style={{ backgroundColor: SERVICE_COLORS[activeService] }}
                            >
                                {saving ? 'Saving...' : editingProvider ? 'Update Provider' : 'Add Provider'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showEditEnvModal && (
                <div
                    className="pc-modal-overlay"
                    onClick={() => setShowEditEnvModal(false)}
                >
                    <div
                        className="pc-modal pc-modal-small"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="pc-modal-header">
                            <h3>Edit Environment</h3>

                            <button
                                className="pc-modal-close"
                                onClick={() =>
                                    setShowEditEnvModal(false)
                                }
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="pc-modal-body">
                            <div className="pc-form-group">
                                <label>Environment Name</label>

                                <input
                                    type="text"
                                    className="pc-input"
                                    value={editEnvName}
                                    onChange={(e) =>
                                        setEditEnvName(
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <div className="pc-modal-footer">
                            <button
                                className="pc-btn-cancel"
                                onClick={() =>
                                    setShowEditEnvModal(false)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                className="pc-btn-primary"
                                onClick={handleEditEnvironment}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteEnvModal && (
                <div
                    className="pc-modal-overlay"
                    onClick={() =>
                        setShowDeleteEnvModal(false)
                    }
                >
                    <div
                        className="pc-modal pc-modal-small"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="pc-modal-header">
                            <h3>Delete Environment</h3>

                            <button
                                className="pc-modal-close"
                                onClick={() =>
                                    setShowDeleteEnvModal(false)
                                }
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="pc-modal-body">
                            <p>
                                Are you sure you want to delete
                                <strong>
                                    {" "}
                                    {deletingEnvName}{" "}
                                </strong>
                                environment?
                            </p>

                            <div className="warning-text">
                                This action cannot be undone.
                            </div>
                        </div>

                        <div className="pc-modal-footer">
                            <button
                                className="pc-btn-cancel"
                                onClick={() =>
                                    setShowDeleteEnvModal(false)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                className="pc-btn-danger"
                                onClick={handleDeleteEnvironment}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="pc-modal-overlay" onClick={() => setShowCancelConfirm(false)}>
                    <div className="pc-modal pc-modal-small" onClick={e => e.stopPropagation()}>
                        <div className="pc-modal-header">
                            <h3><AlertTriangle size={18} /> Discard Changes?</h3>
                            <button className="pc-modal-close" onClick={() => setShowCancelConfirm(false)}><X size={20} /></button>
                        </div>
                        <div className="pc-modal-body"><p>You have unsaved changes. Are you sure you want to discard them?</p></div>
                        <div className="pc-modal-footer">
                            <button className="pc-btn-cancel" onClick={() => setShowCancelConfirm(false)}>Continue Editing</button>
                            <button className="pc-btn-danger" onClick={closeAddModal}>Discard</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="pc-modal-overlay" onClick={() => setShowDeleteModal(null)}>
                    <div className="pc-modal pc-modal-small" onClick={e => e.stopPropagation()}>
                        <div className="pc-modal-header">
                            <h3><Trash2 size={18} /> Delete Provider</h3>
                            <button className="pc-modal-close" onClick={() => setShowDeleteModal(null)}><X size={20} /></button>
                        </div>
                        <div className="pc-modal-body">
                            <p>Are you sure you want to delete <strong>{showDeleteModal.name.replace(/_/g, ' ')}</strong>?</p>
                            <p className="pc-warning-text">This action cannot be undone.</p>
                        </div>
                        <div className="pc-modal-footer">
                            <button className="pc-btn-cancel" onClick={() => setShowDeleteModal(null)}>Cancel</button>
                            <button className="pc-btn-danger" onClick={deleteProvider}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {!showDeleteEnvModal &&
                deletingEnvName &&
                (
                    blockedDeleteCounts.sms > 0 ||
                    blockedDeleteCounts.email > 0 ||
                    blockedDeleteCounts.whatsapp > 0
                ) && (
                    <div
                        className="pc-modal-overlay"
                        onClick={() => {
                            setDeletingEnvName("");

                            setBlockedDeleteCounts({
                                sms: 0,
                                email: 0,
                                whatsapp: 0
                            });
                        }}
                    >
                        <div
                            className="pc-modal pc-modal-small"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >
                            <div className="pc-modal-header">
                                <h3>
                                    <AlertTriangle
                                        size={18}
                                    />
                                    Cannot Delete Environment
                                </h3>

                                <button
                                    className="pc-modal-close"
                                    onClick={() => {
                                        setDeletingEnvName("");

                                        setBlockedDeleteCounts({
                                            sms: 0,
                                            email: 0,
                                            whatsapp: 0
                                        });
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="pc-modal-body">

                                <p>
                                    Environment
                                    <strong>
                                        {" "}
                                        "{deletingEnvName}"{" "}
                                    </strong>
                                    cannot be deleted because
                                    providers are still configured.
                                </p>

                                <div className="provider-summary">

                                    {blockedDeleteCounts.sms > 0 && (
                                        <div className="summary-item">
                                            SMS:
                                            {" "}
                                            {blockedDeleteCounts.sms}
                                        </div>
                                    )}

                                    {blockedDeleteCounts.email > 0 && (
                                        <div className="summary-item">
                                            Email:
                                            {" "}
                                            {blockedDeleteCounts.email}
                                        </div>
                                    )}

                                    {blockedDeleteCounts.whatsapp > 0 && (
                                        <div className="summary-item">
                                            WhatsApp:
                                            {" "}
                                            {blockedDeleteCounts.whatsapp}
                                        </div>
                                    )}

                                </div>

                                <p className="warning-text">
                                    Remove all providers before
                                    deleting this environment.
                                </p>

                            </div>

                            <div className="pc-modal-footer">

                                <button
                                    className="pc-btn-cancel"
                                    onClick={() => {
                                        setDeletingEnvName("");

                                        setBlockedDeleteCounts({
                                            sms: 0,
                                            email: 0,
                                            whatsapp: 0
                                        });
                                    }}
                                >
                                    Close
                                </button>

                            </div>
                        </div>
                    </div>
                )}

            {/* Clone Modal */}
            {showCloneModal && (
                <div className="pc-modal-overlay" onClick={() => setShowCloneModal(false)}>
                    <div className="pc-modal" onClick={e => e.stopPropagation()}>
                        <div className="pc-modal-header">
                            <h3><Copy size={18} /> Clone Environment</h3>
                            <button className="pc-modal-close" onClick={() => setShowCloneModal(false)}><X size={20} /></button>
                        </div>
                        <div className="pc-modal-body">
                            <div className="clone-source-info">
                                <label>Source Environment</label>
                                <div className="clone-source-name">{getEnvIcon(selectedEnv)} {selectedEnv}</div>
                            </div>
                            <div className="pc-form-group">
                                <label>Select Target Environment</label>
                                <div className="pc-env-options">
                                    {['Local', 'Dev', 'Staging', 'Live'].filter(env => env !== selectedEnv && !environments.some(e => e.name === env)).map(env => (
                                        <div key={env} className={`pc-env-option ${cloneTarget === env && !cloneCustomMode ? 'selected' : ''}`}
                                            onClick={() => { setCloneTarget(env); setCloneCustomMode(false); }}>
                                            <span className="pc-env-option-icon">{getEnvIcon(env)}</span>
                                            <span>{env}</span>
                                            {cloneTarget === env && !cloneCustomMode && <Check size={18} className="pc-check" />}
                                        </div>
                                    ))}
                                    <div className={`pc-env-option custom ${cloneCustomMode ? 'selected' : ''}`}
                                        onClick={() => { setCloneCustomMode(true); setCloneTarget(""); }}>
                                        <span className="pc-env-option-icon"><Wrench size={18} /></span>
                                        <span>Custom Environment</span>
                                        {cloneCustomMode && <Check size={18} className="pc-check" />}
                                    </div>
                                </div>
                            </div>
                            {cloneCustomMode && (
                                <div className="pc-form-group">
                                    <label>Custom Environment Name *</label>
                                    <input type="text" placeholder="Enter environment name" value={cloneCustomName}
                                        onChange={(e) => setCloneCustomName(e.target.value)} className="pc-input" autoFocus />
                                </div>
                            )}
                        </div>
                        <div className="pc-modal-footer">
                            <button className="pc-btn-cancel" onClick={() => setShowCloneModal(false)}>Cancel</button>
                            <button className="pc-btn-primary" onClick={executeClone}
                                disabled={(!cloneCustomMode && !cloneTarget) || (cloneCustomMode && !cloneCustomName.trim())}>
                                Clone Environment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}