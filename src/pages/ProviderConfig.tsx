import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/EnvironmentManagement.css";
import {
    Copy, Plus, Globe, Lock,
    Monitor, Server,
    Pencil, Trash2, X, Check, Home,
    Rocket, Wrench, AlertTriangle
} from 'lucide-react';

const PROVIDER_FIELDS_MAP: Record<string, { name: string; label: string; type: string; required?: boolean; icon?: string }[]> = {
    MSG91: [
        { name: "apiKey", label: "API Key", type: "password", required: true, icon: "key" },
        { name: "endpoint", label: "Endpoint URL", type: "text", required: false, icon: "globe" },
        { name: "senderId", label: "Sender ID", type: "text", required: true, icon: "phone" },
        { name: "templateId", label: "Template ID (DLT)", type: "text", required: true, icon: "fileText" },
    ],
    Twilio: [
        { name: "accountSid", label: "Account SID", type: "text", required: true, icon: "hash" },
        { name: "authToken", label: "Auth Token", type: "password", required: true, icon: "lock" },
        { name: "phoneNumber", label: "Phone Number", type: "text", required: true, icon: "phone" },
    ],
    Gupshup: [
        { name: "apiKey", label: "API Key", type: "password", required: true, icon: "key" },
        { name: "senderId", label: "Sender ID", type: "text", required: true, icon: "phone" },
    ],
    Vonage: [
        { name: "apiKey", label: "API Key", type: "password", required: true, icon: "key" },
        { name: "apiSecret", label: "API Secret", type: "password", required: true, icon: "lock" },
        { name: "senderId", label: "Sender ID", type: "text", required: false, icon: "phone" },
    ],
    SendGrid: [
        { name: "apiKey", label: "API Key", type: "password", required: true, icon: "key" },
        { name: "fromEmail", label: "From Email", type: "email", required: true, icon: "mail" },
        { name: "fromName", label: "From Name", type: "text", required: false, icon: "user" },
    ],
    AWS_SES: [
        { name: "accessKeyId", label: "Access Key ID", type: "text", required: true, icon: "hash" },
        { name: "secretAccessKey", label: "Secret Access Key", type: "password", required: true, icon: "lock" },
        { name: "region", label: "Region", type: "text", required: true, icon: "globe" },
        { name: "fromEmail", label: "From Email", type: "email", required: true, icon: "mail" },
    ],
    Mailgun: [
        { name: "apiKey", label: "API Key", type: "password", required: true, icon: "key" },
        { name: "domain", label: "Domain", type: "text", required: true, icon: "globe" },
        { name: "fromEmail", label: "From Email", type: "email", required: true, icon: "mail" },
    ],
    SMTP: [
        { name: "host", label: "SMTP Host", type: "text", required: true, icon: "server" },
        { name: "port", label: "Port", type: "number", required: true, icon: "plug" },
        { name: "username", label: "Username", type: "text", required: true, icon: "user" },
        { name: "password", label: "Password", type: "password", required: true, icon: "lock" },
        { name: "fromEmail", label: "From Email", type: "email", required: true, icon: "mail" },
    ],
    WhatsApp_Twilio: [
        { name: "accountSid", label: "Account SID", type: "text", required: true, icon: "hash" },
        { name: "authToken", label: "Auth Token", type: "password", required: true, icon: "lock" },
        { name: "phoneNumber", label: "WhatsApp Number", type: "text", required: true, icon: "messageCircle" },
    ],
    Meta_Cloud: [
        { name: "phoneNumberId", label: "Phone Number ID", type: "text", required: true, icon: "hash" },
        { name: "accessToken", label: "Access Token", type: "password", required: true, icon: "key" },
        { name: "businessAccountId", label: "Business Account ID", type: "text", required: true, icon: "shield" },
    ],
};

// Icon mapping function


const SERVICE_TYPES = ["SMS", "EMAIL", "WHATSAPP"];
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
    const [serviceProviderCounts, setServiceProviderCounts] = useState<Record<string, number>>({
        SMS: 0, EMAIL: 0, WHATSAPP: 0
    });

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
    const [blockedDeleteCounts, setBlockedDeleteCounts] =
        useState({
            sms: 0,
            email: 0,
            whatsapp: 0
        });
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

    // Auto-scroll to illustrator when no environments exist
    useEffect(() => {
        if (environments.length === 0) {
            setTimeout(() => {
                const illustrator = document.querySelector('.pc-fullpage-illustrator');
                if (illustrator) {
                    illustrator.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, [environments.length]);

    const getEnvIcon = (name: string): React.ReactNode => {
        const icons: Record<string, React.ReactNode> = {
            'Local': <Home size={16} />,
            'Dev': <Monitor size={16} />,
            'Staging': <Rocket size={16} />,
            'Live': <Globe size={16} />
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
            const smsKey = `env_${env}_sms_providers`;
            const emailKey = `env_${env}_email_providers`;
            const whatsappKey = `env_${env}_whatsapp_providers`;
            if (localStorage.getItem(smsKey) || localStorage.getItem(emailKey) || localStorage.getItem(whatsappKey)) {
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
            const aPreset = presetEnvs.indexOf(a.name);
            const bPreset = presetEnvs.indexOf(b.name);
            if (aPreset !== -1 && bPreset !== -1) return aPreset - bPreset;
            if (aPreset !== -1) return -1;
            if (bPreset !== -1) return 1;
            return a.name.localeCompare(b.name);
        });

        setEnvironments(configuredEnvs);
        if (configuredEnvs.length > 0 && (!selectedEnv || !configuredEnvs.some(e => e.name === selectedEnv))) {
            setSelectedEnv(configuredEnvs[0].name);
        }
    };

    const loadProviders = () => {
        if (!selectedEnv) return;
        const storageKey = `env_${selectedEnv}_${activeService.toLowerCase()}_providers`;
        const savedData = localStorage.getItem(storageKey);
        setProviders(savedData ? JSON.parse(savedData).providers || [] : []);
        updateServiceCounts();
    };

    const executeClone = () => {
        let targetName = cloneTarget;
        if (cloneCustomMode && cloneCustomName.trim()) targetName = cloneCustomName.trim();
        if (!targetName) { showToast("Please select or enter a target environment", "error"); return; }

        ['sms', 'email', 'whatsapp'].forEach(service => {
            const sourceKey = `env_${selectedEnv}_${service}_providers`;
            const sourceData = localStorage.getItem(sourceKey);
            if (sourceData) {
                const parsed = JSON.parse(sourceData);
                localStorage.setItem(`env_${targetName}_${service}_providers`, JSON.stringify({
                    providers: parsed.providers || [],
                    timestamp: Date.now()
                }));
            }
        });

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
            counts[service] = data ? JSON.parse(data).providers?.length || 0 : 0;
        });
        setServiceProviderCounts(counts);
    };

    const saveToLocalStorage = (updatedProviders: Provider[]) => {
        localStorage.setItem(`env_${selectedEnv}_${activeService.toLowerCase()}_providers`, JSON.stringify({
            providers: updatedProviders,
            timestamp: Date.now()
        }));
    };

    const handleAddEnvironment = () => {
        let envName = newEnvName;
        if (isCustomEnv && customEnvInput.trim()) envName = customEnvInput.trim();
        if (!envName) { showToast("Please select or enter an environment name", "error"); return; }
        if (environments.some(e => e.name.toLowerCase() === envName.toLowerCase())) {
            showToast("This environment already exists!", "error"); return;
        }

        ['sms', 'email', 'whatsapp'].forEach(service => {
            const key = `env_${envName}_${service}_providers`;
            if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ providers: [], timestamp: Date.now() }));
        });

        setEnvironments(prev => prev.some(e => e.name === envName) ? prev : [...prev, { name: envName, icon: getEnvIcon(envName), hasProviders: false, providerCount: 0 }]);
        setSelectedEnv(envName);
        setProviders([]);
        setServiceProviderCounts({ SMS: 0, EMAIL: 0, WHATSAPP: 0 });
        setShowAddEnvModal(false);
        setNewEnvName(""); setIsCustomEnv(false); setCustomEnvInput("");
        showToast(`Environment "${envName}" created!`, "success");
    };

    const handleEditEnvironment = () => {
        if (!editEnvName.trim()) {
            showToast("Environment name is required", "error");
            return;
        }

        if (
            environments.some(
                (e) =>
                    e.name.toLowerCase() ===
                    editEnvName.toLowerCase() &&
                    e.name !== editingEnvName
            )
        ) {
            showToast("Environment already exists", "error");
            return;
        }

        ['sms', 'email', 'whatsapp'].forEach((service) => {
            const oldKey = `env_${editingEnvName}_${service}_providers`;

            const newKey = `env_${editEnvName}_${service}_providers`;

            const data = localStorage.getItem(oldKey);

            if (data) {
                localStorage.setItem(newKey, data);
                localStorage.removeItem(oldKey);
            }
        });

        loadEnvironments();

        if (selectedEnv === editingEnvName) {
            setSelectedEnv(editEnvName);
        }

        setShowEditEnvModal(false);

        showToast("Environment updated successfully", "success");
    };

    const handleDeleteEnvironment = () => {
        ['sms', 'email', 'whatsapp'].forEach((service) => {
            localStorage.removeItem(
                `env_${deletingEnvName}_${service}_providers`
            );
        });

        const updatedEnvs = environments.filter(
            (e) => e.name !== deletingEnvName
        );

        setEnvironments(updatedEnvs);
        loadEnvironments();
        if (selectedEnv === deletingEnvName) {
            setSelectedEnv(updatedEnvs[0]?.name || "");
        }

        setShowDeleteEnvModal(false);

        showToast("Environment deleted", "success");
    };

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
        if (!selectedProvider) { showToast("Please select a provider", "error"); return; }
        const fieldsDef = PROVIDER_FIELDS_MAP[selectedProvider];
        if (fieldsDef) {
            for (const field of fieldsDef) {
                if (field.required && !providerFields[field.name]) {
                    showToast(`${field.label} is required`, "error"); return;
                }
            }
        }
        setSaving(true);
        setTimeout(() => {
            let updatedProviders: Provider[];
            if (editingProvider) {
                updatedProviders = providers.map(p => p.id === editingProvider.id ? { ...p, name: selectedProvider, fields: { ...providerFields } } : p);
                showToast(`${selectedProvider.replace(/_/g, ' ')} updated successfully!`, "success");
            } else {
                updatedProviders = [...providers, { id: Date.now(), name: selectedProvider, fields: { ...providerFields } }];
                showToast(`${selectedProvider.replace(/_/g, ' ')} added successfully!`, "success");
            }
            setProviders(updatedProviders);
            saveToLocalStorage(updatedProviders);
            updateServiceCounts();
            loadEnvironments();
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

    if (!project) return <div className="loading">Loading...</div>;

    return (
        <div className="provider-config-redesign">
            <ToastContainer />

            {/* Header */}
            <div className="pc-header">
                <div className="pc-header-top">
                    <h1>Environment Management</h1>
                    <div className="pc-breadcrumbs">
                        <button onClick={() => navigate("/dashboard/project")}>Projects</button>
                        <span>›</span>
                        <button onClick={() => navigate("/dashboard/environments", { state: { project } })}>
                            Environments
                        </button>
                    </div>
                </div>
                <p className="pc-project-name">
                    {project.logo && (
                        <img
                            src={project.logo}
                            alt="Project logo"
                            className="pc-project-logo"
                        />
                    )}
                    <button className="pc-project-link" onClick={() => navigate(`/dashboard/project/${project.id}/view`)}>
                        {project.name}
                    </button>
                </p>
            </div>
            {/* FIRST TIME - No Environments Full Page Illustrator */}
            {environments.length === 0 && (
                <div className="pc-fullpage-illustrator">
                    <div className="pc-bg-circles">
                        <div className="pc-bg-circle circle-1"></div>
                        <div className="pc-bg-circle circle-2"></div>
                        <div className="pc-bg-circle circle-3"></div>
                    </div>
                    <div className="pc-floating-dots">
                        <span className="dot dot-1"></span>
                        <span className="dot dot-2"></span>
                        <span className="dot dot-3"></span>
                        <span className="dot dot-4"></span>
                        <span className="dot dot-5"></span>
                        <span className="dot dot-6"></span>
                    </div>

                    {/* Center Card */}
                    <div className="pc-center-card">
                        <div className="pc-card-icon">
                            <Globe size={56} color="#00f2fe" />
                        </div>
                        <h2>Configure Your Environment</h2>
                        <p>Get started by creating an environment to manage SMS, Email & WhatsApp providers</p>

                        {/* Steps */}
                        <div className="pc-card-steps">
                            <div className="pc-card-step">
                                <span className="pc-step-dot">1</span>
                                <span>Choose an environment type</span>
                            </div>
                            <div className="pc-card-step">
                                <span className="pc-step-dot">2</span>
                                <span>Add providers for each service</span>
                            </div>
                            <div className="pc-card-step">
                                <span className="pc-step-dot">3</span>
                                <span>Start sending notifications</span>
                            </div>
                        </div>

                        {/* Environment Selection */}
                        <div className="pc-card-select">
                            <div className="pc-env-options">
                                {['Local', 'Dev', 'Staging', 'Live'].map(env => (
                                    <div
                                        key={env}
                                        className={`pc-env-option ${newEnvName === env && !isCustomEnv ? 'selected' : ''}`}
                                        onClick={() => { setNewEnvName(env); setIsCustomEnv(false); }}
                                    >
                                        <span className="pc-env-option-icon">{getEnvIcon(env)}</span>
                                        <span>{env}</span>
                                        {newEnvName === env && !isCustomEnv && <Check size={16} />}
                                    </div>
                                ))}
                                <div
                                    className={`pc-env-option custom ${isCustomEnv ? 'selected' : ''}`}
                                    onClick={() => { setIsCustomEnv(true); setNewEnvName(""); }}
                                >
                                    <span className="pc-env-option-icon"><Wrench size={18} /></span>
                                    <span>Custom</span>
                                    {isCustomEnv && <Check size={16} />}
                                </div>
                            </div>
                            {isCustomEnv && (
                                <input
                                    type="text"
                                    placeholder="Enter environment name"
                                    value={customEnvInput}
                                    onChange={(e) => setCustomEnvInput(e.target.value)}
                                    className="pc-input"
                                    autoFocus
                                />
                            )}
                            <button
                                className="pc-create-first-env-btn"
                                onClick={handleAddEnvironment}
                                disabled={(!isCustomEnv && !newEnvName) || (isCustomEnv && !customEnvInput.trim())}
                            >
                                Create Environment <Rocket size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Main Content */}
            {selectedEnv && (

                <>
                    {/* Environment Header Row */}
                    <div className="env-header-row">
                        <h3 className="env-heading">Environments</h3>

                        <div className="env-header-actions">
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
                                Add Environment
                            </button>
                        </div>
                    </div>

                    {/* Environment Tabs */}
                    <div className="env-tabs-container">
                        <div className="env-tabs">
                            {environments.map((env) => (
                                <div
                                    key={env.name}
                                    className={`env-tab ${selectedEnv === env.name ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedEnv(env.name);
                                        setOpenEnvMenu(null);
                                    }}
                                >
                                    <span className="env-tab-name">{env.name}</span>

                                    <div
                                        className="env-tab-menu"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            className="env-menu-trigger"
                                            onClick={() =>
                                                setOpenEnvMenu(
                                                    openEnvMenu === env.name ? null : env.name
                                                )
                                            }
                                        >
                                            ⋯
                                        </button>

                                        {openEnvMenu === env.name && (
                                            <div className="env-menu-dropdown">
                                                <button
                                                    onClick={() => {
                                                        setCloneTarget("");
                                                        setCloneCustomMode(false);
                                                        setCloneCustomName("");
                                                        setShowCloneModal(true);
                                                        setOpenEnvMenu(null);
                                                    }}
                                                >
                                                    <Copy size={14} />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setEditingEnvName(env.name);

                                                        setEditEnvName(env.name);

                                                        setShowEditEnvModal(true);

                                                        setOpenEnvMenu(null);
                                                    }}
                                                >
                                                    <Pencil size={14} />
                                                </button>

                                                <button
                                                    onClick={() => {

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

                                                        const counts = {
                                                            sms: smsData.providers?.length || 0,
                                                            email: emailData.providers?.length || 0,
                                                            whatsapp: whatsappData.providers?.length || 0
                                                        };

                                                        const total =
                                                            counts.sms +
                                                            counts.email +
                                                            counts.whatsapp;

                                                        setDeletingEnvName(env.name);

                                                        if (total > 0) {

                                                            setBlockedDeleteCounts(counts);

                                                        } else {

                                                            setShowDeleteEnvModal(true);

                                                        }

                                                        setOpenEnvMenu(null);
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pc-service-env-info">
                        <span className="pc-service-label">{activeService}</span>
                        <span className="pc-separator-dash"> - </span>
                        <span className="pc-env-label">{selectedEnv}</span>
                    </div>
                    {/* Main Content */}
                    <div className="pc-service-provider-section">

                        {/* SERVICE TILES */}
                        <div className="pc-service-tiles">
                            {SERVICE_TYPES.map((service) => (
                                <div
                                    key={service}
                                    className={`pc-service-tile ${activeService === service ? 'active' : ''}`}
                                    onClick={() => setActiveService(service)}
                                >
                                    <div className="pc-service-tile-top">
                                        <span className="pc-service-name">{service}</span>
                                        <span className="pc-service-count">{serviceProviderCounts[service] || 0} providers</span>
                                    </div>


                                </div>
                            ))}
                        </div>

                        {/* CONNECTED PROVIDER FRAME */}
                        <div className="pc-provider-frame">
                            <div className="pc-providers-panel">

                                <div className="pc-panel-header">
                                    <div className="pc-panel-title">
                                        <h3>{activeService} Providers</h3>

                                        <span className="pc-panel-count">
                                            {serviceProviderCounts[activeService] || 0}
                                        </span>
                                    </div>

                                    <button
                                        className="pc-add-btn"
                                        style={{
                                            backgroundColor:
                                                SERVICE_COLORS[activeService]
                                        }}
                                        onClick={() => {
                                            setEditingProvider(null);
                                            setSelectedProvider("");
                                            setProviderFields({});
                                            setShowAddModal(true);
                                        }}
                                    >
                                        <Plus size={14} />
                                        Add Provider
                                    </button>
                                </div>

                                <div className="pc-providers-list">
                                    {providers.length === 0 ? (
                                        <div className="pc-empty-state">
                                            <Server size={44} color="#cbd5e1" />

                                            <h4>
                                                No {activeService} providers yet
                                            </h4>

                                            <p>
                                                Add your first provider to start configuring services
                                            </p>
                                        </div>
                                    ) : (
                                        providers.map((provider) => (
                                            <div
                                                key={provider.id}
                                                className="pc-provider-card"
                                                style={{
                                                    borderLeftColor:
                                                        SERVICE_COLORS[activeService]
                                                }}
                                            >
                                                <div
                                                    className="pc-provider-card-header"
                                                    onClick={() =>
                                                        setExpandedProviders((prev) => ({
                                                            ...prev,
                                                            [provider.id]:
                                                                !prev[provider.id]
                                                        }))
                                                    }
                                                >
                                                    <div className="pc-provider-title">
                                                        <span>{provider.name.replace(/_/g, ' ')}</span>
                                                        <span className="pc-configured-badge" style={{
                                                            background: `${SERVICE_COLORS[activeService]}15`,
                                                            color: SERVICE_COLORS[activeService]
                                                        }}>
                                                            <Check size={10} /> Configured
                                                        </span>
                                                        <span className="pc-notification-count">
                                                            0 sent
                                                        </span>
                                                    </div>

                                                    <div
                                                        className="pc-provider-actions"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <button
                                                            className="pc-edit-btn"
                                                            onClick={() =>
                                                                editProvider(provider)
                                                            }
                                                        >
                                                            <Pencil size={14} />
                                                        </button>

                                                        <button
                                                            className="pc-delete-btn"
                                                            onClick={() =>
                                                                setShowDeleteModal({
                                                                    id: provider.id,
                                                                    name: provider.name
                                                                })
                                                            }
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {expandedProviders[provider.id] && (
                                                    <div className="pc-provider-card-body">
                                                        {Object.entries(
                                                            provider.fields
                                                        ).map(([key, value]) => {
                                                            const fieldConfig =
                                                                PROVIDER_FIELDS_MAP[
                                                                    provider.name
                                                                ]?.find(
                                                                    (f: any) =>
                                                                        f.name === key
                                                                );

                                                            const isPassword =
                                                                fieldConfig?.type ===
                                                                "password" ||
                                                                key.includes("Key") ||
                                                                key.includes("Token");

                                                            const passwordKey = `${provider.id}_${key}`;

                                                            return (
                                                                <div className="pc-credential-row" key={key}>
                                                                    <span className="pc-credential-label">{fieldConfig?.label || key}</span>

                                                                    <div className="pc-credential-value-wrapper">
                                                                        <span className="pc-credential-value">
                                                                            {isPassword ? (visiblePasswords[passwordKey] ? value : "••••••••••") : value || "—"}
                                                                        </span>

                                                                        {isPassword &&
                                                                            value && (
                                                                                <button
                                                                                    className="pc-eye-btn"
                                                                                    onClick={() =>
                                                                                        setVisiblePasswords(
                                                                                            (
                                                                                                prev
                                                                                            ) => ({
                                                                                                ...prev,
                                                                                                [passwordKey]:
                                                                                                    !prev[
                                                                                                    passwordKey
                                                                                                    ]
                                                                                            })
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    {visiblePasswords[
                                                                                        passwordKey
                                                                                    ] ? (
                                                                                        <FaEyeSlash />
                                                                                    ) : (
                                                                                        <FaEye />
                                                                                    )}
                                                                                </button>
                                                                            )}
                                                                    </div>
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
                            <h3>{editingProvider ? <><Pencil size={18} /> Edit Provider</> : <><Plus size={18} /> Add Provider</>}</h3>
                            <button className="pc-modal-close" onClick={handleCancelAdd}><X size={20} /></button>
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
                                                <input type={field.type === "password" && !showPasswords[field.name] ? "password" : "text"}
                                                    value={providerFields[field.name] || ""} onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                                    placeholder={`Enter ${field.label}`} className="pc-input" />
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
                            <button className="pc-btn-primary" onClick={saveProvider} disabled={saving}>
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