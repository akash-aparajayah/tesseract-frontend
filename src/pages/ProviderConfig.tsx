import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/EnvironmentManagement.css";

// Provider field definitions
const PROVIDER_FIELDS_MAP: Record<string, { name: string; label: string; type: string; required?: boolean; icon?: string }[]> = {
    MSG91: [
        { name: "apiKey", label: "API Key", type: "password", required: true, icon: "🔑" },
        { name: "endpoint", label: "Endpoint URL", type: "text", required: false, icon: "🌐" },
        { name: "senderId", label: "Sender ID", type: "text", required: true, icon: "📱" },
        { name: "templateId", label: "Template ID (DLT)", type: "text", required: true, icon: "📝" },
    ],
    Twilio: [
        { name: "accountSid", label: "Account SID", type: "text", required: true, icon: "🆔" },
        { name: "authToken", label: "Auth Token", type: "password", required: true, icon: "🔒" },
        { name: "phoneNumber", label: "Phone Number", type: "text", required: true, icon: "📞" },
    ],
    Gupshup: [
        { name: "apiKey", label: "API Key", type: "password", required: true, icon: "🔑" },
        { name: "senderId", label: "Sender ID", type: "text", required: true, icon: "📱" },
    ],
    Vonage: [
        { name: "apiKey", label: "API Key", type: "password", required: true, icon: "🔑" },
        { name: "apiSecret", label: "API Secret", type: "password", required: true, icon: "🔒" },
        { name: "senderId", label: "Sender ID", type: "text", required: false, icon: "📱" },
    ],
    SendGrid: [
        { name: "apiKey", label: "API Key", type: "password", required: true, icon: "🔑" },
        { name: "fromEmail", label: "From Email", type: "email", required: true, icon: "✉️" },
        { name: "fromName", label: "From Name", type: "text", required: false, icon: "👤" },
    ],
    AWS_SES: [
        { name: "accessKeyId", label: "Access Key ID", type: "text", required: true, icon: "🆔" },
        { name: "secretAccessKey", label: "Secret Access Key", type: "password", required: true, icon: "🔒" },
        { name: "region", label: "Region", type: "text", required: true, icon: "🌍" },
        { name: "fromEmail", label: "From Email", type: "email", required: true, icon: "✉️" },
    ],
    Mailgun: [
        { name: "apiKey", label: "API Key", type: "password", required: true, icon: "🔑" },
        { name: "domain", label: "Domain", type: "text", required: true, icon: "🌐" },
        { name: "fromEmail", label: "From Email", type: "email", required: true, icon: "✉️" },
    ],
    SMTP: [
        { name: "host", label: "SMTP Host", type: "text", required: true, icon: "🖥️" },
        { name: "port", label: "Port", type: "number", required: true, icon: "🔌" },
        { name: "username", label: "Username", type: "text", required: true, icon: "👤" },
        { name: "password", label: "Password", type: "password", required: true, icon: "🔒" },
        { name: "fromEmail", label: "From Email", type: "email", required: true, icon: "✉️" },
    ],
    WhatsApp_Twilio: [
        { name: "accountSid", label: "Account SID", type: "text", required: true, icon: "🆔" },
        { name: "authToken", label: "Auth Token", type: "password", required: true, icon: "🔒" },
        { name: "phoneNumber", label: "WhatsApp Number", type: "text", required: true, icon: "💬" },
    ],
    Meta_Cloud: [
        { name: "phoneNumberId", label: "Phone Number ID", type: "text", required: true, icon: "🆔" },
        { name: "accessToken", label: "Access Token", type: "password", required: true, icon: "🔑" },
        { name: "businessAccountId", label: "Business Account ID", type: "text", required: true, icon: "🏢" },
    ],
};

const SERVICE_TYPES = ["SMS", "EMAIL", "WHATSAPP"];
const SERVICE_ICONS: Record<string, string> = {
    SMS: "💬",
    EMAIL: "✉️",
    WHATSAPP: "💬"
};
const SERVICE_COLORS: Record<string, string> = {
    SMS: "#10b981",
    EMAIL: "#6366f1",
    WHATSAPP: "#25D366"
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
    icon: string;
    hasProviders: boolean;
    providerCount: number;
}

export default function ProviderConfig() {
    const navigate = useNavigate();
    const location = useLocation();
    const { project, environmentName, activeService: initialService } = location.state || {};
    const { showToast, ToastContainer } = useToast();

    // Environment tabs
    const [environments, setEnvironments] = useState<EnvironmentInfo[]>([]);
    const [selectedEnv, setSelectedEnv] = useState<string>(environmentName || "");

    // Service & Providers
    const [activeService, setActiveService] = useState<string>(initialService || "SMS");
    const [providers, setProviders] = useState<Provider[]>([]);
    const [expandedProviders, setExpandedProviders] = useState<Record<number, boolean>>({});
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
    const [serviceProviderCounts, setServiceProviderCounts] = useState<Record<string, number>>({
        SMS: 0, EMAIL: 0, WHATSAPP: 0
    });

    // Add Provider Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState("");
    const [providerFields, setProviderFields] = useState<Record<string, string>>({});
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
    const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
    const [saving, setSaving] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    // Delete Modal
    const [showDeleteModal, setShowDeleteModal] = useState<{ id: number; name: string } | null>(null);

    // Clone Modal
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [cloneTarget, setCloneTarget] = useState("");
    const [cloneCustomMode, setCloneCustomMode] = useState(false);
    const [cloneCustomName, setCloneCustomName] = useState("");

    // Add Environment Modal
    const [showAddEnvModal, setShowAddEnvModal] = useState(false);
    const [newEnvName, setNewEnvName] = useState("");
    const [isCustomEnv, setIsCustomEnv] = useState(false);
    const [customEnvInput, setCustomEnvInput] = useState("");

    useEffect(() => {
        if (!project) {
            showToast("Invalid request. Redirecting...", "error");
            setTimeout(() => navigate("/dashboard/project"), 1500);
            return;
        }
        loadEnvironments();
    }, []);

    useEffect(() => {
        if (selectedEnv) {
            loadProviders();
        }
    }, [selectedEnv, activeService]);

    const loadEnvironments = () => {
        const presetEnvs = ['Local', 'Dev', 'Staging', 'Live'];
        const allKeys = Object.keys(localStorage);
        const envSet = new Set<string>();

        // Find all environments that have any provider storage
        allKeys.forEach(key => {
            const match = key.match(/^env_(.+)_(sms|email|whatsapp)_providers$/);
            if (match) {
                envSet.add(match[1]);
            }
        });

        // Also check for preset envs that might have been created
        presetEnvs.forEach(env => {
            const smsKey = `env_${env}_sms_providers`;
            const emailKey = `env_${env}_email_providers`;
            const whatsappKey = `env_${env}_whatsapp_providers`;

            if (localStorage.getItem(smsKey) || localStorage.getItem(emailKey) || localStorage.getItem(whatsappKey)) {
                envSet.add(env);
            }
        });

        const configuredEnvs: EnvironmentInfo[] = [];

        envSet.forEach(envName => {
            const smsKey = `env_${envName}_sms_providers`;
            const emailKey = `env_${envName}_email_providers`;
            const whatsappKey = `env_${envName}_whatsapp_providers`;

            const sms = JSON.parse(localStorage.getItem(smsKey) || '{"providers":[]}');
            const email = JSON.parse(localStorage.getItem(emailKey) || '{"providers":[]}');
            const whatsapp = JSON.parse(localStorage.getItem(whatsappKey) || '{"providers":[]}');

            const totalProviders = (sms.providers?.length || 0) + (email.providers?.length || 0) + (whatsapp.providers?.length || 0);

            configuredEnvs.push({
                name: envName,
                icon: getEnvIcon(envName),
                hasProviders: totalProviders > 0,
                providerCount: totalProviders
            });
        });

        // Sort: preset envs first, then custom
        configuredEnvs.sort((a, b) => {
            const aPreset = presetEnvs.indexOf(a.name);
            const bPreset = presetEnvs.indexOf(b.name);
            if (aPreset !== -1 && bPreset !== -1) return aPreset - bPreset;
            if (aPreset !== -1) return -1;
            if (bPreset !== -1) return 1;
            return a.name.localeCompare(b.name);
        });

        setEnvironments(configuredEnvs);

        if (configuredEnvs.length > 0) {
            if (!selectedEnv || !configuredEnvs.some(e => e.name === selectedEnv)) {
                setSelectedEnv(configuredEnvs[0].name);
            }
        }
    };

    const loadProviders = () => {
        if (!selectedEnv) return;

        const storageKey = `env_${selectedEnv}_${activeService.toLowerCase()}_providers`;
        const savedData = localStorage.getItem(storageKey);

        if (savedData) {
            const parsed = JSON.parse(savedData);
            setProviders(parsed.providers || []);
        } else {
            setProviders([]);
        }

        updateServiceCounts();
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

        // Clone all services from source to target
        const services = ['sms', 'email', 'whatsapp'];
        let hasProviders = false;

        services.forEach(service => {
            const sourceKey = `env_${selectedEnv}_${service}_providers`;
            const sourceData = localStorage.getItem(sourceKey);

            if (sourceData) {
                const parsed = JSON.parse(sourceData);
                if (parsed.providers?.length > 0) {
                    hasProviders = true;
                    const destKey = `env_${targetName}_${service}_providers`;
                    localStorage.setItem(destKey, JSON.stringify({
                        providers: parsed.providers,
                        timestamp: Date.now()
                    }));
                } else {
                    // Create empty storage if source exists but empty
                    const destKey = `env_${targetName}_${service}_providers`;
                    localStorage.setItem(destKey, JSON.stringify({
                        providers: [],
                        timestamp: Date.now()
                    }));
                }
            }
        });

        // Reload environments
        loadEnvironments();
        setSelectedEnv(targetName);
        loadProviders();

        showToast(`Environment cloned to "${targetName}" successfully!`, "success");
        setShowCloneModal(false);
        setCloneTarget("");
        setCloneCustomMode(false);
        setCloneCustomName("");
    };
    const updateServiceCounts = () => {
        if (!selectedEnv) return;

        const counts: Record<string, number> = {};
        SERVICE_TYPES.forEach(service => {
            const key = `env_${selectedEnv}_${service.toLowerCase()}_providers`;
            const data = localStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                counts[service] = parsed.providers?.length || 0;
            } else {
                counts[service] = 0;
            }
        });
        setServiceProviderCounts(counts);
    };

    const saveToLocalStorage = (updatedProviders: Provider[]) => {
        const storageKey = `env_${selectedEnv}_${activeService.toLowerCase()}_providers`;
        localStorage.setItem(storageKey, JSON.stringify({
            providers: updatedProviders,
            timestamp: Date.now()
        }));
    };

    const getEnvIcon = (name: string) => {
        const icons: Record<string, string> = {
            'Local': '🏠', 'Dev': '💻', 'Staging': '🚀', 'Live': '🌍'
        };
        return icons[name] || '🔧';
    };

    // Add Environment
    const handleAddEnvironment = () => {
        let envName = newEnvName;
        if (isCustomEnv && customEnvInput.trim()) {
            envName = customEnvInput.trim();
        }

        if (!envName) {
            showToast("Please select or enter an environment name", "error");
            return;
        }

        // Check if environment already exists in current list
        if (environments.some(e => e.name.toLowerCase() === envName.toLowerCase())) {
            showToast("This environment already exists!", "error");
            return;
        }

        // Create empty provider storage for this environment
        const smsKey = `env_${envName}_sms_providers`;
        const emailKey = `env_${envName}_email_providers`;
        const whatsappKey = `env_${envName}_whatsapp_providers`;

        if (!localStorage.getItem(smsKey)) {
            localStorage.setItem(smsKey, JSON.stringify({ providers: [], timestamp: Date.now() }));
        }
        if (!localStorage.getItem(emailKey)) {
            localStorage.setItem(emailKey, JSON.stringify({ providers: [], timestamp: Date.now() }));
        }
        if (!localStorage.getItem(whatsappKey)) {
            localStorage.setItem(whatsappKey, JSON.stringify({ providers: [], timestamp: Date.now() }));
        }

        // Add to environments list directly
        const newEnv: EnvironmentInfo = {
            name: envName,
            icon: getEnvIcon(envName),
            hasProviders: false,
            providerCount: 0
        };

        setEnvironments(prev => {
            // Double check no duplicate
            if (prev.some(e => e.name === envName)) {
                return prev;
            }
            return [...prev, newEnv];
        });

        setSelectedEnv(envName);
        setProviders([]);
        setServiceProviderCounts({ SMS: 0, EMAIL: 0, WHATSAPP: 0 });

        // Reset modal
        setShowAddEnvModal(false);
        setNewEnvName("");
        setIsCustomEnv(false);
        setCustomEnvInput("");

        showToast(`Environment "${envName}" created!`, "success");
    };

    // Add/Edit Provider
    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const provider = e.target.value;
        setSelectedProvider(provider);
        const fieldsDef = PROVIDER_FIELDS_MAP[provider] || [];
        const newFields: Record<string, string> = {};
        fieldsDef.forEach((field: any) => { newFields[field.name] = ""; });
        setProviderFields(newFields);
    };

    const handleFieldChange = (fieldName: string, value: string) => {
        setProviderFields(prev => ({ ...prev, [fieldName]: value }));
    };

    const togglePasswordVisibility = (fieldName: string) => {
        setShowPasswords(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
    };

    const saveProvider = async () => {
        if (!selectedProvider) {
            showToast("Please select a provider", "error");
            return;
        }

        const fieldsDef = PROVIDER_FIELDS_MAP[selectedProvider];
        if (fieldsDef) {
            for (const field of fieldsDef) {
                if (field.required && !providerFields[field.name]) {
                    showToast(`${field.label} is required`, "error");
                    return;
                }
            }
        }

        setSaving(true);

        // Simulate API call
        setTimeout(() => {
            let updatedProviders: Provider[];

            if (editingProvider) {
                updatedProviders = providers.map(p =>
                    p.id === editingProvider.id
                        ? { ...p, name: selectedProvider, fields: { ...providerFields } }
                        : p
                );
                showToast(`${selectedProvider.replace(/_/g, ' ')} updated successfully!`, "success");
            } else {
                const newProvider: Provider = {
                    id: Date.now(),
                    name: selectedProvider,
                    fields: { ...providerFields },
                };
                updatedProviders = [...providers, newProvider];
                showToast(`${selectedProvider.replace(/_/g, ' ')} added successfully!`, "success");
            }

            setProviders(updatedProviders);
            saveToLocalStorage(updatedProviders);
            updateServiceCounts();
            loadEnvironments();

            // Reset all modal states
            setShowAddModal(false);
            setEditingProvider(null);
            setSelectedProvider("");
            setProviderFields({});
            setShowPasswords({});
            setSaving(false);
        }, 800);
    };

    const editProvider = (provider: Provider) => {
        setEditingProvider(provider);
        setSelectedProvider(provider.name);
        setProviderFields({ ...provider.fields });
        setShowAddModal(true);
    };

    const deleteProvider = () => {
        if (showDeleteModal) {
            const updatedProviders = providers.filter(p => p.id !== showDeleteModal.id);
            setProviders(updatedProviders);
            saveToLocalStorage(updatedProviders);
            updateServiceCounts();
            loadEnvironments();
            showToast(`${showDeleteModal.name} deleted`, "success");
            setShowDeleteModal(null);
        }
    };

    const closeAddModal = () => {
        setShowAddModal(false);
        setEditingProvider(null);
        setSelectedProvider("");
        setProviderFields({});
        setShowPasswords({});
        setShowCancelConfirm(false);
    };

    const handleCancelAdd = () => {
        if (selectedProvider || Object.values(providerFields).some(val => val)) {
            setShowCancelConfirm(true);
        } else {
            closeAddModal();
        }
    };

    if (!project) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="provider-config-redesign">
            <ToastContainer />

            {/* Header with Breadcrumbs */}
            {/* Header */}
            <div className="pc-header">
                <div className="pc-header-top">
                    <h1>Provider Configuration</h1>
                    <div className="pc-breadcrumbs">
                        <button onClick={() => navigate("/dashboard")}>Dashboard</button>
                        <span>›</span>
                        <button onClick={() => navigate("/dashboard/project")}>Projects</button>
                        <span>›</span>
                        <button onClick={() => navigate(`/dashboard/project/${project.id}/view`)}>
                            {project.name}
                        </button>
                    </div>
                </div>
                <p className="pc-project-name">
                    <button
                        className="pc-project-link"
                        onClick={() => navigate(`/dashboard/project/${project.id}/view`)}
                    >
                        {project.name}
                    </button>
                    {selectedEnv && (
                        <>
                            <span className="pc-separator"> - </span>
                            <span className="pc-env-name">{getEnvIcon(selectedEnv)} {selectedEnv}</span>
                        </>
                    )}
                </p>
            </div>


            {/* Main Content */}
            {environments.length === 0 ? (
                // NO ENVIRONMENTS - Show Create First Environment Screen
                <div className="pc-no-env-container">
                    <div className="pc-no-env-card">
                        <div className="pc-no-env-icon">🌍</div>
                        <h2>No Environments Yet</h2>
                        <p>Create your first environment to start configuring SMS, Email & WhatsApp providers.</p>
                        <div className="pc-no-env-steps">
                            <div className="pc-step">
                                <div className="pc-step-number">1</div>
                                <div className="pc-step-text">
                                    <strong>Create an Environment</strong>
                                    <span>Choose from Local, Dev, Staging, Live or create a custom one</span>
                                </div>
                            </div>
                            <div className="pc-step">
                                <div className="pc-step-number">2</div>
                                <div className="pc-step-text">
                                    <strong>Add Providers</strong>
                                    <span>Configure SMS, Email & WhatsApp providers for each service</span>
                                </div>
                            </div>
                            <div className="pc-step">
                                <div className="pc-step-number">3</div>
                                <div className="pc-step-text">
                                    <strong>Start Sending</strong>
                                    <span>Your providers are ready to send notifications</span>
                                </div>
                            </div>
                        </div>
                        <button className="pc-create-first-env-btn" onClick={() => setShowAddEnvModal(true)}>
                            + Create First Environment
                        </button>
                    </div>
                </div>
            ) : selectedEnv ? (
                // HAS ENVIRONMENTS - Show tabs, sidebar, and providers
                <>
                    {/* Environment Tabs */}
                    <div className="env-tabs-container">
                        <div className="env-tabs-wrapper">
                            <div className="env-tabs">
                                {environments.map((env) => (
                                    <div
                                        key={env.name}
                                        className={`env-tab ${selectedEnv === env.name ? 'active' : ''}`}
                                        onClick={() => setSelectedEnv(env.name)}
                                    >
                                        <span className="env-tab-icon">{env.icon}</span>
                                        <span className="env-tab-name">{env.name}</span>
                                        <span className={`env-tab-dot ${env.hasProviders ? '' : 'empty'}`}>
                                            {env.hasProviders ? '●' : '○'}
                                        </span>
                                    </div>
                                ))}
                                <div className="env-tab add-tab" onClick={() => {
                                    setNewEnvName("");
                                    setIsCustomEnv(false);
                                    setCustomEnvInput("");
                                    setShowAddEnvModal(true);
                                }}>
                                    <span className="env-tab-icon">+</span>
                                    <span className="env-tab-name">New</span>
                                </div>
                            </div>
                            <button
                                className="pc-clone-btn"
                                onClick={() => {
                                    setCloneTarget("");
                                    setCloneCustomMode(false);
                                    setCloneCustomName("");
                                    setShowCloneModal(true);
                                }}
                            >
                                📋 Clone
                            </button>
                        </div>
                    </div>

                    {/* Service Sidebar + Providers */}
                    <div className="pc-main-content">
                        {/* Service Sidebar */}
                        <div className="pc-sidebar">
                            {SERVICE_TYPES.map((service) => (
                                <div
                                    key={service}
                                    className={`pc-sidebar-item ${activeService === service ? 'active' : ''}`}
                                    onClick={() => setActiveService(service)}
                                    style={{
                                        borderLeftColor: activeService === service ? SERVICE_COLORS[service] : 'transparent'
                                    }}
                                >
                                    <span className="pc-sidebar-icon">{SERVICE_ICONS[service]}</span>
                                    <div className="pc-sidebar-info">
                                        <div className="pc-sidebar-name">{service}</div>
                                        <div className="pc-sidebar-count">{serviceProviderCounts[service] || 0} provider(s)</div>
                                    </div>
                                    {activeService === service && (
                                        <div className="pc-sidebar-active-indicator" style={{ background: SERVICE_COLORS[service] }}></div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Providers Panel */}
                        <div className="pc-providers-panel">
                            <div className="pc-panel-header">
                                <div className="pc-panel-title">
                                    <span>{SERVICE_ICONS[activeService]}</span>
                                    <h3>{activeService} Providers</h3>
                                    <span className="pc-panel-count">{serviceProviderCounts[activeService] || 0}</span>
                                </div>
                                <button
                                    className="pc-add-btn"
                                    style={{ backgroundColor: SERVICE_COLORS[activeService] }}
                                    onClick={() => {
                                        setEditingProvider(null);
                                        setSelectedProvider("");
                                        setProviderFields({});
                                        setShowAddModal(true);
                                    }}
                                >
                                    + Add Provider
                                </button>
                            </div>

                            <div className="pc-providers-list">
                                {providers.length === 0 ? (
                                    <div className="pc-empty-state">
                                        <span className="pc-empty-icon">📭</span>
                                        <h4>No {activeService} providers yet</h4>
                                        <p>Add your first provider to start sending {activeService.toLowerCase()} messages</p>
                                    </div>
                                ) : (
                                    providers.map((provider) => (
                                        <div
                                            key={provider.id}
                                            className={`pc-provider-card ${expandedProviders[provider.id] ? 'expanded' : ''}`}
                                            style={{ borderLeftColor: SERVICE_COLORS[activeService] }}
                                        >
                                            <div
                                                className="pc-provider-card-header"
                                                onClick={() => setExpandedProviders(prev => ({
                                                    ...prev,
                                                    [provider.id]: !prev[provider.id]
                                                }))}
                                            >
                                                <div className="pc-provider-title">
                                                    <span className="pc-provider-icon">🔌</span>
                                                    <span>{provider.name.replace(/_/g, ' ')}</span>
                                                    <span className="pc-configured-badge" style={{
                                                        background: `${SERVICE_COLORS[activeService]}15`,
                                                        color: SERVICE_COLORS[activeService]
                                                    }}>
                                                        ✓ Configured
                                                    </span>
                                                </div>
                                                <div className="pc-provider-actions" onClick={(e) => e.stopPropagation()}>
                                                    <button className="pc-edit-btn" onClick={() => editProvider(provider)}>
                                                        ✏️
                                                    </button>
                                                    <button className="pc-delete-btn" onClick={() => setShowDeleteModal({ id: provider.id, name: provider.name })}>
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>

                                            {expandedProviders[provider.id] && (
                                                <div className="pc-provider-card-body">
                                                    {Object.entries(provider.fields).map(([key, value]) => {
                                                        const fieldConfig = PROVIDER_FIELDS_MAP[provider.name]?.find((f: any) => f.name === key);
                                                        const isPassword = fieldConfig?.type === "password" || key.includes("Key") || key.includes("Token");
                                                        const passwordKey = `${provider.id}_${key}`;

                                                        return (
                                                            <div className="pc-credential-row" key={key}>
                                                                <span className="pc-credential-label">
                                                                    {fieldConfig?.icon || "📝"} {fieldConfig?.label || key}
                                                                </span>
                                                                <span className="pc-credential-value">
                                                                    {isPassword
                                                                        ? (visiblePasswords[passwordKey] ? value : "••••••••••")
                                                                        : (value || "—")}
                                                                </span>
                                                                {isPassword && value && (
                                                                    <button
                                                                        className="pc-eye-btn"
                                                                        onClick={() => setVisiblePasswords(prev => ({
                                                                            ...prev,
                                                                            [passwordKey]: !prev[passwordKey]
                                                                        }))}
                                                                    >
                                                                        {visiblePasswords[passwordKey] ? <FaEyeSlash /> : <FaEye />}
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
                </>
            ) : null}

            {/* Add Environment Modal */}
            {showAddEnvModal && (
                <div className="pc-modal-overlay" onClick={() => setShowAddEnvModal(false)}>
                    <div className="pc-modal" onClick={e => e.stopPropagation()}>
                        <div className="pc-modal-header">
                            <h3>➕ Add Environment</h3>
                            <button className="pc-modal-close" onClick={() => setShowAddEnvModal(false)}>×</button>
                        </div>
                        <div className="pc-modal-body">
                            <p className="pc-modal-desc">Select an environment or create a custom one</p>
                            <div className="pc-env-options">
                                {['Local', 'Dev', 'Staging', 'Live']
                                    .filter(env => !environments.some(e => e.name === env))
                                    .map(env => (
                                        <div
                                            key={env}
                                            className={`pc-env-option ${newEnvName === env && !isCustomEnv ? 'selected' : ''}`}
                                            onClick={() => {
                                                setNewEnvName(env);
                                                setIsCustomEnv(false);
                                            }}
                                        >
                                            <span className="pc-env-option-icon">{getEnvIcon(env)}</span>
                                            <span>{env}</span>
                                            {newEnvName === env && !isCustomEnv && <span className="pc-check">✓</span>}
                                        </div>
                                    ))
                                }
                                <div
                                    className={`pc-env-option custom ${isCustomEnv ? 'selected' : ''}`}
                                    onClick={() => {
                                        setIsCustomEnv(true);
                                        setNewEnvName("");
                                    }}
                                >
                                    <span className="pc-env-option-icon">🔧</span>
                                    <span>Custom Environment</span>
                                    {isCustomEnv && <span className="pc-check">✓</span>}
                                </div>
                            </div>
                            {isCustomEnv && (
                                <div className="pc-form-group">
                                    <label>Environment Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Production, Testing, QA"
                                        value={customEnvInput}
                                        onChange={(e) => setCustomEnvInput(e.target.value)}
                                        className="pc-input"
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>
                        <div className="pc-modal-footer">
                            <button className="pc-btn-cancel" onClick={() => {
                                setShowAddEnvModal(false);
                                setNewEnvName("");
                                setIsCustomEnv(false);
                                setCustomEnvInput("");
                            }}>Cancel</button>
                            <button
                                className="pc-btn-primary"
                                onClick={handleAddEnvironment}
                                disabled={(!isCustomEnv && !newEnvName) || (isCustomEnv && !customEnvInput.trim())}
                            >
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
                            <h3>{editingProvider ? '✏️ Edit Provider' : '➕ Add Provider'}</h3>
                            <button className="pc-modal-close" onClick={handleCancelAdd}>×</button>
                        </div>
                        <div className="pc-modal-body">
                            <div className="pc-form-group">
                                <label>Select Provider *</label>
                                <select
                                    value={selectedProvider}
                                    onChange={handleProviderChange}
                                    className="pc-select"
                                >
                                    <option value="">-- Choose provider --</option>
                                    {PROVIDERS_BY_SERVICE[activeService]
                                        ?.filter(p => editingProvider?.name === p || !providers.some(prov => prov.name === p))
                                        .map(p => (
                                            <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            {selectedProvider && PROVIDER_FIELDS_MAP[selectedProvider] && (
                                <div className="pc-credentials-section">
                                    <h4>🔐 Credentials</h4>
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
                                                    <button
                                                        type="button"
                                                        className="pc-eye-btn"
                                                        onClick={() => togglePasswordVisibility(field.name)}
                                                    >
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
                            <button className="pc-btn-primary" onClick={saveProvider} disabled={saving}>
                                {saving ? 'Saving...' : editingProvider ? 'Update Provider' : 'Add Provider'}
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
                            <h3>⚠️ Discard Changes?</h3>
                            <button className="pc-modal-close" onClick={() => setShowCancelConfirm(false)}>×</button>
                        </div>
                        <div className="pc-modal-body">
                            <p>You have unsaved changes. Are you sure you want to discard them?</p>
                        </div>
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
                            <h3>🗑️ Delete Provider</h3>
                            <button className="pc-modal-close" onClick={() => setShowDeleteModal(null)}>×</button>
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

            {/* Clone Modal */}
            {showCloneModal && (
                <div className="pc-modal-overlay" onClick={() => setShowCloneModal(false)}>
                    <div className="pc-modal" onClick={e => e.stopPropagation()}>
                        <div className="pc-modal-header">
                            <h3>📋 Clone Environment</h3>
                            <button className="pc-modal-close" onClick={() => setShowCloneModal(false)}>×</button>
                        </div>
                        <div className="pc-modal-body">
                            <div className="clone-source-info">
                                <label>Source Environment</label>
                                <div className="clone-source-name">
                                    {getEnvIcon(selectedEnv)} {selectedEnv}
                                </div>
                            </div>

                            <div className="pc-form-group">
                                <label>Select Target Environment</label>
                                <div className="pc-env-options">
                                    {['Local', 'Dev', 'Staging', 'Live']
                                        .filter(env => env !== selectedEnv && !environments.some(e => e.name === env))
                                        .map(env => (
                                            <div
                                                key={env}
                                                className={`pc-env-option ${cloneTarget === env && !cloneCustomMode ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setCloneTarget(env);
                                                    setCloneCustomMode(false);
                                                }}
                                            >
                                                <span className="pc-env-option-icon">{getEnvIcon(env)}</span>
                                                <span>{env}</span>
                                                {cloneTarget === env && !cloneCustomMode && <span className="pc-check">✓</span>}
                                            </div>
                                        ))
                                    }
                                    <div
                                        className={`pc-env-option custom ${cloneCustomMode ? 'selected' : ''}`}
                                        onClick={() => {
                                            setCloneCustomMode(true);
                                            setCloneTarget("");
                                        }}
                                    >
                                        <span className="pc-env-option-icon">🔧</span>
                                        <span>Custom Environment</span>
                                        {cloneCustomMode && <span className="pc-check">✓</span>}
                                    </div>
                                </div>
                            </div>

                            {cloneCustomMode && (
                                <div className="pc-form-group">
                                    <label>Custom Environment Name *</label>
                                    <input
                                        type="text"
                                        placeholder="Enter environment name"
                                        value={cloneCustomName}
                                        onChange={(e) => setCloneCustomName(e.target.value)}
                                        className="pc-input"
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>
                        <div className="pc-modal-footer">
                            <button className="pc-btn-cancel" onClick={() => setShowCloneModal(false)}>Cancel</button>
                            <button
                                className="pc-btn-primary"
                                onClick={executeClone}
                                disabled={(!cloneCustomMode && !cloneTarget) || (cloneCustomMode && !cloneCustomName.trim())}
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