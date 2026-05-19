import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/ProjectView.css";
import {
  Pencil, FolderOpen, Plus, MessageSquare, Mail, MessageCircle, Plug, Check,
  Save, X, ChevronDown, Server, Copy, Trash2, Globe, Rocket, Wrench,
  Search, Lock, AlertTriangle, Home, Monitor, Key,
  User, UserMinus, UserPlus, AlertCircle, Calendar, Clock, RefreshCw, Filter, Settings
} from 'lucide-react';
import { Link as LinkIcon } from 'lucide-react';
import { useToast } from "../hooks/useToast";
import "../styles/Toast.css"
import noDataIllustration from '../assets/illustration/No data.gif';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  created: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  logo?: string;
  services: string[];
}

interface Provider {
  id: number;
  name: string;
  fields: Record<string, string>;
  usageCount?: number;
}

interface ApiToken {
  id: string;
  name: string;
  token: string;
  projectId: string;
  environmentName: string;
  mode: string;
  created: string;
  expires: string;
  expiresInDays: number | null;
  revealed: boolean;
}

const PROVIDER_FIELDS_MAP: Record<string, { name: string; label: string; type: string; required?: boolean; readOnly?: boolean }[]> = {
  MSG91: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "apiKey", label: "MSG91 API Key", type: "password", required: true },
    { name: "senderId", label: "MSG91 Sender ID", type: "text", required: true },
    { name: "templateId", label: "MSG91 Template ID (DLT)", type: "text", required: true },
  ],
  Twilio: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "accountSid", label: "Twilio Account SID", type: "text", required: true },
    { name: "authToken", label: "Twilio Auth Token", type: "password", required: true },
    { name: "phoneNumber", label: "Twilio Phone Number", type: "text", required: true },
  ],
  Gupshup: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "apiKey", label: "Gupshup API Key", type: "password", required: true },
    { name: "appName", label: "Gupshup App Name", type: "text", required: true },
    { name: "sourceNumber", label: "Gupshup Source Number", type: "text", required: true },
  ],
  Vonage: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "apiKey", label: "Vonage API Key", type: "text", required: true },
    { name: "apiSecret", label: "Vonage API Secret", type: "password", required: true },
    { name: "fromNumber", label: "Vonage From Number", type: "text", required: true },
  ],
  Kaleyra: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "apiKey", label: "Kaleyra API Key", type: "password", required: true },
    { name: "sid", label: "Kaleyra SID", type: "text", required: true },
    { name: "senderId", label: "Kaleyra Sender ID", type: "text", required: true },
  ],
  Textlocal: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "apiKey", label: "Textlocal API Key", type: "password", required: true },
    { name: "senderId", label: "Textlocal Sender ID", type: "text", required: true },
  ],
  TrueDialog: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "apiKey", label: "TrueDialog API Key", type: "password", required: true },
    { name: "accountId", label: "TrueDialog Account ID", type: "text", required: true },
    { name: "fromNumber", label: "TrueDialog From Number", type: "text", required: true },
  ],
  SendGrid: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "apiKey", label: "SendGrid API Key", type: "password", required: true },
    { name: "fromEmail", label: "From Email", type: "email", required: true },
    { name: "fromName", label: "From Name", type: "text", required: false },
  ],
  AWS_SES: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "accessKeyId", label: "AWS Access Key ID", type: "text", required: true },
    { name: "secretAccessKey", label: "AWS Secret Access Key", type: "password", required: true },
    { name: "region", label: "AWS Region", type: "text", required: true },
    { name: "fromEmail", label: "From Email", type: "email", required: true },
    { name: "fromName", label: "From Name", type: "text", required: false },
  ],
  Mailgun: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "apiKey", label: "Mailgun API Key", type: "password", required: true },
    { name: "domain", label: "Mailgun Domain", type: "text", required: true },
    { name: "fromEmail", label: "From Email", type: "email", required: true },
  ],
  SMTP: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "host", label: "SMTP Host", type: "text", required: true },
    { name: "port", label: "SMTP Port", type: "text", required: true },
    { name: "username", label: "SMTP Username", type: "text", required: true },
    { name: "password", label: "SMTP Password", type: "password", required: true },
    { name: "fromEmail", label: "From Email", type: "email", required: true },
    { name: "fromName", label: "From Name", type: "text", required: false },
    { name: "encryption", label: "Encryption", type: "text", required: false },
  ],
  Postmark: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "serverToken", label: "Postmark Server Token", type: "password", required: true },
    { name: "fromEmail", label: "From Email", type: "email", required: true },
    { name: "fromName", label: "From Name", type: "text", required: false },
  ],
  WhatsApp_Twilio: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "accountSid", label: "Twilio Account SID", type: "text", required: true },
    { name: "authToken", label: "Twilio Auth Token", type: "password", required: true },
    { name: "phoneNumber", label: "Twilio WhatsApp Number", type: "text", required: true },
  ],
  WhatsApp_Gupshup: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "apiKey", label: "Gupshup API Key", type: "password", required: true },
    { name: "appName", label: "Gupshup App Name", type: "text", required: true },
    { name: "phoneNumber", label: "Gupshup WhatsApp Number", type: "text", required: true },
  ],
  Meta_Cloud: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "phoneNumberId", label: "Meta Phone Number ID", type: "text", required: true },
    { name: "accessToken", label: "Meta Access Token", type: "password", required: true },
    { name: "businessAccountId", label: "Meta Business Account ID", type: "text", required: true },
  ],
  WhatsApp_Kaleyra: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "apiKey", label: "Kaleyra API Key", type: "password", required: true },
    { name: "sid", label: "Kaleyra SID", type: "text", required: true },
    { name: "phoneNumber", label: "Kaleyra WhatsApp Number", type: "text", required: true },
  ],
  WhatsApp_Vonage: [
    { name: "mode", label: "Selected Mode", type: "select", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "endpoint", required: false },
    { name: "apiKey", label: "Vonage API Key", type: "text", required: true },
    { name: "apiSecret", label: "Vonage API Secret", type: "password", required: true },
    { name: "phoneNumber", label: "Vonage WhatsApp Number", type: "text", required: true },
  ],
};

const SERVICE_TYPES = ["SMS", "Email", "Whatsapp"];
const SERVICE_COLORS: Record<string, string> = { SMS: "#10b981", Email: "#6366f1", Whatsapp: "#25D366" };
const SERVICE_ICONS: Record<string, React.ReactNode> = {
  SMS: <MessageSquare size={18} />, Email: <Mail size={18} />, Whatsapp: <MessageCircle size={18} />
};
const PROVIDERS_BY_SERVICE: Record<string, string[]> = {
  SMS: ["MSG91", "Twilio", "Gupshup", "Vonage", "Kaleyra", "Textlocal", "TrueDialog"],
  Email: ["SendGrid", "AWS_SES", "Mailgun", "SMTP", "Postmark"],
  Whatsapp: ["WhatsApp_Twilio", "WhatsApp_Gupshup", "Meta_Cloud", "WhatsApp_Kaleyra", "WhatsApp_Vonage"]
};

// Token Utils
const TOKEN_PREFIX = "env_";
const generateToken = (): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = TOKEN_PREFIX;
  for (let i = 0; i < 40; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};
const getExpiryDate = (days: string, customDays?: string): string => {
  const now = new Date(); let daysNum = 0;
  switch (days) { case "7": daysNum = 7; break; case "30": daysNum = 30; break; case "60": daysNum = 60; break; case "90": daysNum = 90; break; case "custom": daysNum = parseInt(customDays || "0"); break; case "never": return "Never"; }
  if (daysNum === 0) return "Never";
  return new Date(now.getTime() + daysNum * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
};
const getExpiryDays = (days: string, customDays?: string): number | null => {
  switch (days) { case "7": return 7; case "30": return 30; case "60": return 60; case "90": return 90; case "custom": return parseInt(customDays || "0") || null; case "never": return null; }
  return null;
};
const formatDate = (dateString: string): string => {
  if (dateString === "Never") return "Never";
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const calculateExpiryLabel = (expires: string, expiresInDays: number | null): string => {
  if (expiresInDays === null) return "Never expires";
  const now = new Date(); const expiry = new Date(expires);
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Expired";
  if (diffDays === 1) return "1 day left";
  return `${diffDays} days left`;
};

export default function ProjectView() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [project, setProject] = useState<Project | null>(null);
  const [environments, setEnvironments] = useState<string[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<string>("");
  const [activeService, setActiveService] = useState<string>("SMS");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [serviceProviderCounts, setServiceProviderCounts] = useState<Record<string, number>>({ SMS: 0, Email: 0, Whatsapp: 0 });
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [expandedProviders, setExpandedProviders] = useState<Record<number, boolean>>({});
  const [openEnvMenu, setOpenEnvMenu] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", status: "active" as "active" | "inactive" });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const [isCustomEnv, setIsCustomEnv] = useState(false);
  const [customEnvInput, setCustomEnvInput] = useState("");

  const [showAddProviderModal, setShowAddProviderModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [providerFields, setProviderFields] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteProviderModal, setShowDeleteProviderModal] = useState<{ id: number; name: string } | null>(null);

  const [showAddEnvModal, setShowAddEnvModal] = useState(false);
  const [showEditEnvModal, setShowEditEnvModal] = useState(false);
  const [editingEnvName] = useState("");
  const [editEnvName, setEditEnvName] = useState("");
  const [showDeleteEnvModal, setShowDeleteEnvModal] = useState(false);
  const [deletingEnvName, setDeletingEnvName] = useState("");
  const [blockedDeleteCounts, setBlockedDeleteCounts] = useState({ sms: 0, email: 0, whatsapp: 0 });
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneTarget, setCloneTarget] = useState("");
  const [cloneCustomMode, setCloneCustomMode] = useState(false);
  const [cloneCustomName, setCloneCustomName] = useState("");

  const [modeFilter, setmodeFilter] = useState<string>("Sandbox");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const { showToast, ToastContainer } = useToast();
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null);

  const [showUserPanel, setShowUserPanel] = useState(false);
  const [userActiveTab, setUserActiveTab] = useState<"assign" | "unassign">("assign");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [userFilter, setUserFilter] = useState("all");

  // Main tab state
  const [activeMainTab, setActiveMainTab] = useState<"environments" | "tokens">("environments");

  // Token states
  const [allTokens, setAllTokens] = useState<Record<string, ApiToken>>({});
  const [tokenSearchTerm, setTokenSearchTerm] = useState("");
  const [showTokenFormModal, setShowTokenFormModal] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [tokenExpiration, setTokenExpiration] = useState("30");
  const [tokenCustomDays, setTokenCustomDays] = useState("");
  const [tokenCustomDate, setTokenCustomDate] = useState("");
  const [tokenMode, setTokenMode] = useState("");
  const [generatedToken, setGeneratedToken] = useState<ApiToken | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentToken, setCurrentToken] = useState<ApiToken | null>(null);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [showTokenDeleteModal, setShowTokenDeleteModal] = useState(false);
  const [showTokenLeaveModal, setShowTokenLeaveModal] = useState(false);

  const [editingTabEnv, setEditingTabEnv] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState("");
  const [userFilterDropdownOpen, setUserFilterDropdownOpen] = useState(false);
  const [envStatus, setEnvStatus] = useState<Record<string, "active" | "inactive">>({});

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ env: string; newStatus: "active" | "inactive" } | null>(null);



  const startEditingTab = (env: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTabEnv(env);
    setEditingTabName(env);
  };

  const saveTabEdit = () => {
    if (!editingTabEnv || !editingTabName.trim() || editingTabName === editingTabEnv) {
      setEditingTabEnv(null);
      setEditingTabName("");
      return;
    }
    handleEditEnvironmentInline(editingTabEnv, editingTabName.trim());
    setEditingTabEnv(null);
    setEditingTabName("");
  };

  const cancelTabEdit = () => {
    setEditingTabEnv(null);
    setEditingTabName("");
  };

  const handleEditEnvironmentInline = (oldName: string, newName: string) => {
    if (!projectId) return;
    ['sms', 'email', 'whatsapp'].forEach(s => {
      const oldKey = `env_${projectId}_${oldName}_${s}_providers`;
      const newKey = `env_${projectId}_${newName}_${s}_providers`;
      const data = localStorage.getItem(oldKey);
      if (data) { localStorage.setItem(newKey, data); localStorage.removeItem(oldKey); }
    });
    const savedOrder = JSON.parse(localStorage.getItem(`env_order_${projectId}`) || "[]");
    const updatedOrder = savedOrder.map((env: string) => env === oldName ? newName : env);
    localStorage.setItem(`env_order_${projectId}`, JSON.stringify(updatedOrder));
    setEnvironments(updatedOrder);
    if (selectedEnv === oldName) setSelectedEnv(newName);

    showToast(`Environment renamed to "${newName}"`, "success"); // Add this
  };

  // Close filter dropdown when clicking outside
  useEffect(() => {
    if (!userFilterDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-panel-filter-wrapper')) {
        setUserFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userFilterDropdownOpen]);

  useEffect(() => {
    if (!generatedToken) return;

    // Browser refresh/close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have an unsaved token. Are you sure you want to leave?';
    };

    // Browser back/forward
    const handlePopState = () => {
      const confirmLeave = window.confirm('You have an unsaved token. Are you sure you want to leave?');
      if (!confirmLeave) {
        window.history.pushState(null, '', window.location.href);
      } else {
        setGeneratedToken(null);
        setCopied(false);
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [generatedToken]);

  useEffect(() => {
    if (generatedToken) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [generatedToken]);

  // Close edit on click outside
  useEffect(() => {
    if (!editingTabEnv) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only cancel if clicking outside ALL env-tabs
      if (!target.closest('.env-tab')) {
        cancelTabEdit();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingTabEnv]);


  // Mock user data
  const availableUsers = [
    { id: "u1", name: "John Doe", email: "john@example.com", role: "Developer", status: "active", assignedAt: "2026-05-14" },
    { id: "u2", name: "Jane Smith", email: "jane@example.com", role: "Admin", status: "active", assignedAt: "2026-05-13" },
    { id: "u3", name: "Mike Johnson", email: "mike@example.com", role: "Viewer", status: "inactive", assignedAt: "2026-05-12" },
    { id: "u4", name: "Sarah Wilson", email: "sarah@example.com", role: "Developer", status: "active", assignedAt: "2026-05-11" },
    { id: "u5", name: "Tom Brown", email: "tom@example.com", role: "Viewer", status: "active", assignedAt: "2026-05-10" },
    { id: "u6", name: "Alice Cooper", email: "alice@example.com", role: "Developer", status: "active", assignedAt: "2026-05-09" },
    { id: "u7", name: "Bob Marley", email: "bob@example.com", role: "Admin", status: "active", assignedAt: "2026-05-08" },
  ];
  const [assignedUsers, setAssignedUsers] = useState<any[]>([
    { id: "u6", name: "Alice Cooper", email: "alice@example.com", role: "Developer", status: "active", assignedAt: "2026-05-14" },
    { id: "u7", name: "Bob Marley", email: "bob@example.com", role: "Admin", status: "active", assignedAt: "2026-05-13" },
  ]);
  const unassignedUsers = availableUsers.filter(u => !assignedUsers.some(au => au.id === u.id));

  // ---- ENVIRONMENT FUNCTIONS ----
  const loadEnvironments = () => {
    if (!projectId) return;

    const savedOrder = JSON.parse(
      localStorage.getItem(`env_order_${projectId}`) || "[]"
    );

    setEnvironments(savedOrder);

    if (savedOrder.length > 0 && !selectedEnv) {
      setSelectedEnv(savedOrder[0]);
    }
  };

  const loadProviders = () => {
    if (!selectedEnv || !projectId) return;
    const key = `env_${projectId}_${selectedEnv}_${activeService.toLowerCase()}_providers`;
    const data = localStorage.getItem(key);
    setProviders(data ? JSON.parse(data).providers || [] : []);
    updateAllServiceCounts();
  };

  const updateAllServiceCounts = () => {
    if (!selectedEnv || !projectId) return;
    const counts: Record<string, number> = {};
    SERVICE_TYPES.forEach(service => {
      const key = `env_${projectId}_${selectedEnv}_${service.toLowerCase()}_providers`;
      const data = localStorage.getItem(key);
      const providers = data ? JSON.parse(data).providers || [] : [];
      counts[service] = providers.filter((p: Provider) => p.fields.mode === modeFilter).length;
    });
    setServiceProviderCounts(counts);
  };

  const saveToLocalStorage = (p: Provider[]) => {
    if (!projectId) return;
    localStorage.setItem(`env_${projectId}_${selectedEnv}_${activeService.toLowerCase()}_providers`, JSON.stringify({ providers: p, timestamp: Date.now() }));
  };

  const handleCreateEnvironment = () => {
    if (!projectId) return;
    const envToCreate = isCustomEnv && customEnvInput.trim() ? customEnvInput.trim() : (newEnvName || 'Local');
    ['sms', 'email', 'whatsapp'].forEach(service => {
      const key = `env_${projectId}_${envToCreate}_${service}_providers`;
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ providers: [], timestamp: Date.now() }));
    });
    const existingOrder = JSON.parse(
      localStorage.getItem(`env_order_${projectId}`) || "[]"
    );

    if (!existingOrder.includes(envToCreate)) {
      const updatedOrder = [...existingOrder, envToCreate];

      localStorage.setItem(
        `env_order_${projectId}`,
        JSON.stringify(updatedOrder)
      );
    }
    loadEnvironments();
    setSelectedEnv(envToCreate);
    setNewEnvName(""); setIsCustomEnv(false); setCustomEnvInput("");
  };

  const handleAddEnvironment = () => {
    if (!projectId) return;
    let name = newEnvName;
    if (isCustomEnv && customEnvInput.trim()) name = customEnvInput.trim();
    if (!name) return;
    if (environments.some(e => e.toLowerCase() === name.toLowerCase())) return;
    ['sms', 'email', 'whatsapp'].forEach(s => {
      if (!localStorage.getItem(`env_${projectId}_${name}_${s}_providers`))
        localStorage.setItem(`env_${projectId}_${name}_${s}_providers`, JSON.stringify({ providers: [], timestamp: Date.now() }));
    });
    const updatedEnvs = [...environments, name];
    setEnvironments(updatedEnvs);
    localStorage.setItem(`env_order_${projectId}`, JSON.stringify(updatedEnvs));
    setSelectedEnv(name);
    setProviders([]);
    setServiceProviderCounts({ SMS: 0, EMAIL: 0, WHATSAPP: 0 });
    setShowAddEnvModal(false);
    setNewEnvName("");
    setIsCustomEnv(false);
    setCustomEnvInput("");

    showToast(`Environment "${name}" created successfully`, "success"); // <-- After everything
  };

  const handleEditEnvironment = () => {
    if (!projectId || !editEnvName.trim()) return;
    ['sms', 'email', 'whatsapp'].forEach(s => {
      const oldKey = `env_${projectId}_${editingEnvName}_${s}_providers`;
      const newKey = `env_${projectId}_${editEnvName}_${s}_providers`;
      const data = localStorage.getItem(oldKey);
      if (data) { localStorage.setItem(newKey, data); localStorage.removeItem(oldKey); }
    });
    const savedOrder = JSON.parse(localStorage.getItem(`env_order_${projectId}`) || "[]");
    const updatedOrder = savedOrder.map((env: string) => env === editingEnvName ? editEnvName : env);
    localStorage.setItem(`env_order_${projectId}`, JSON.stringify(updatedOrder));
    setEnvironments(updatedOrder);
    if (selectedEnv === editingEnvName) setSelectedEnv(editEnvName);
    setShowEditEnvModal(false);

    showToast(`Environment renamed to "${editEnvName}"`, "success"); // Add this
  };

  const handleDeleteEnvironment = () => {
    if (!projectId) return;
    ['sms', 'email', 'whatsapp'].forEach(s => localStorage.removeItem(`env_${projectId}_${deletingEnvName}_${s}_providers`));
    // Also delete tokens for this environment
    deleteToken(projectId, deletingEnvName, 'Sandbox');
    deleteToken(projectId, deletingEnvName, 'Live');
    // Update allTokens state
    setAllTokens(prev => {
      const updated = { ...prev };
      delete updated[`${deletingEnvName}_Sandbox`];
      delete updated[`${deletingEnvName}_Live`];
      return updated;
    });
    const updated = environments.filter(e => e !== deletingEnvName);
    localStorage.setItem(
      `env_order_${projectId}`,
      JSON.stringify(updated)
    );
    setEnvironments(updated);
    if (selectedEnv === deletingEnvName) setSelectedEnv(updated[0] || "");
    setShowDeleteEnvModal(false);
    showToast(`Environment "${deletingEnvName}" deleted`, "error");
  };

  const executeClone = () => {
    if (!projectId) return;
    let target = cloneCustomMode && cloneCustomName.trim() ? cloneCustomName.trim() : cloneTarget;
    if (!target) return;

    ['sms', 'email', 'whatsapp'].forEach(s => {
      const src = localStorage.getItem(`env_${projectId}_${selectedEnv}_${s}_providers`);
      if (src) localStorage.setItem(`env_${projectId}_${target}_${s}_providers`, JSON.stringify({ ...JSON.parse(src), timestamp: Date.now() }));
    });

    // Add the cloned environment to the order list
    const savedOrder = JSON.parse(localStorage.getItem(`env_order_${projectId}`) || "[]");
    if (!savedOrder.includes(target)) {
      const updatedOrder = [...savedOrder, target];
      localStorage.setItem(`env_order_${projectId}`, JSON.stringify(updatedOrder));
    }

    loadEnvironments();
    setSelectedEnv(target);
    loadProviders();
    setShowCloneModal(false);
    showToast(`Environment cloned to "${target}"`, "success");
  };

  const saveProvider = () => {
    if (!selectedProvider) return;
    const fields = PROVIDER_FIELDS_MAP[selectedProvider];
    if (fields) for (const f of fields) if (f.required && !providerFields[f.name]) return;
    setSaving(true);
    setTimeout(() => {
      let updated: Provider[];
      if (editingProvider) {
        updated = providers.map(p => p.id === editingProvider.id ? { ...p, name: selectedProvider, fields: { ...providerFields } } : p);
      } else {
        updated = [...providers, { id: Date.now(), name: selectedProvider, fields: { ...providerFields } }];
      }
      setProviders(updated);
      saveToLocalStorage(updated);
      updateAllServiceCounts();
      const savedMode = providerFields.mode;
      if (savedMode) setmodeFilter(savedMode);
      setShowAddProviderModal(false);
      setEditingProvider(null);
      setSelectedProvider("");
      setProviderFields({});
      setSaving(false);

      // Toast after modal closes
      showToast(editingProvider ? "Provider updated successfully" : "Provider added successfully", "success");
    }, 500);
  };

  const deleteProvider = () => {
    if (!showDeleteProviderModal) return;
    const updated = providers.filter(p => p.id !== showDeleteProviderModal.id);
    setProviders(updated); saveToLocalStorage(updated); updateAllServiceCounts();
    setShowDeleteProviderModal(null);
    showToast("Provider deleted", "error");
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvider(e.target.value);
    const defs = PROVIDER_FIELDS_MAP[e.target.value] || [];
    const nf: Record<string, string> = {};
    defs.forEach(f => {
      if (f.type === "select") {
        // Auto-set mode to current modeFilter when adding
        if (!editingProvider) {
          nf[f.name] = modeFilter; // "Sandbox" or "Live"
        }
      } else {
        nf[f.name] = "";
      }
    });
    setProviderFields(nf);
  };

  const handleFieldChange = (n: string, v: string) => setProviderFields(prev => ({ ...prev, [n]: v }));
  const togglePasswordVisibility = (n: string) => setShowPasswords(prev => ({ ...prev, [n]: !prev[n] }));

  // ---- TOKEN FUNCTIONS ----
  const saveToken = (pId: string, env: string, mode: string, token: ApiToken) => {
    localStorage.setItem(`token_${pId}_${env}_${mode}`, JSON.stringify(token));
  };
  const getAllTokens = (pId: string): Record<string, ApiToken> => {
    const tokens: Record<string, ApiToken> = {};
    Object.keys(localStorage).forEach(key => {
      const match = key.match(new RegExp(`^token_${pId}_(.+)_(Sandbox|Live)$`));
      if (match) {
        const data = localStorage.getItem(key);
        if (data) try { tokens[`${match[1]}_${match[2]}`] = JSON.parse(data); } catch { }
      }
    });
    return tokens;
  };
  const deleteToken = (pId: string, env: string, mode: string) => {
    localStorage.removeItem(`token_${pId}_${env}_${mode}`);
  };

  const handleTokenGenerate = () => {
    if (!tokenName.trim() || !selectedEnv || !projectId || !tokenMode) return;

    // If regenerating, delete the old token first
    if (isRegenerating && currentToken?.mode) {
      deleteToken(projectId, selectedEnv, currentToken.mode);
    }

    const token: ApiToken = {
      id: Date.now().toString(), name: tokenName.trim(), token: generateToken(),
      projectId, environmentName: selectedEnv, mode: tokenMode,
      created: new Date().toISOString().split('T')[0],
      expires: getExpiryDate(tokenExpiration, tokenCustomDays),
      expiresInDays: getExpiryDays(tokenExpiration, tokenCustomDays), revealed: false,
    };
    saveToken(projectId, selectedEnv, tokenMode, token);
    setAllTokens(prev => ({ ...prev, [`${selectedEnv}_${tokenMode}`]: token }));
    setGeneratedToken(token);
    setShowTokenFormModal(false);
    showToast(`Token ${isRegenerating ? 'regenerated' : 'generated'} for ${selectedEnv}`, "success");
  };

  const handleTokenDelete = () => {
    if (!projectId || !selectedEnv || !currentToken?.mode) return;
    deleteToken(projectId, selectedEnv, currentToken.mode);
    setAllTokens(prev => { const updated = { ...prev }; delete updated[`${selectedEnv}_${currentToken.mode}`]; return updated; });
    setShowTokenDeleteModal(false); setSelectedEnv(""); setCurrentToken(null);
    showToast("Token deleted", "error");
  };

  const filteredTokens = environments.filter(env => {
    if (!tokenSearchTerm.trim()) return true;
    const q = tokenSearchTerm.toLowerCase();
    return env.toLowerCase().includes(q) || allTokens[`${env}_Sandbox`]?.name?.toLowerCase().includes(q) || allTokens[`${env}_Live`]?.name?.toLowerCase().includes(q);
  });

  // ---- DRAG & DROP ----
  const filteredProviders = providers.filter(p => p.fields.mode === modeFilter);
  const handleDragStart = (e: React.DragEvent, index: number) => {
    const provider = filteredProviders[index];
    setDragIndex(providers.findIndex(p => p.id === provider.id));
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null) return;
    const dropProvider = filteredProviders[dropIndex];
    const realDropIndex = providers.findIndex(p => p.id === dropProvider.id);
    if (dragIndex === realDropIndex) { setDragIndex(null); return; }
    const newProviders = [...providers];
    const draggedItem = newProviders[dragIndex];
    newProviders.splice(dragIndex, 1); newProviders.splice(realDropIndex, 0, draggedItem);
    setProviders(newProviders); setDragIndex(null); saveToLocalStorage(newProviders);
    showToast("Primary provider updated successfully", "success");
  };
  const handleDragEnd = () => setDragIndex(null);

  // ---- USER FUNCTIONS ----
  const getFilteredUsers = () => {
    const userList = userActiveTab === "assign" ? unassignedUsers : assignedUsers;
    let filtered = userList;
    if (userSearchTerm.trim()) {
      const q = userSearchTerm.toLowerCase();
      filtered = filtered.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
    }
    if (userFilter !== "all") filtered = filtered.filter(u => u.status === userFilter);
    if (userActiveTab === "unassign") filtered = [...filtered].sort((a, b) => new Date(b.assignedAt || "").getTime() - new Date(a.assignedAt || "").getTime());
    return filtered;
  };
  const filteredUserList = getFilteredUsers();
  const handleSelectAll = () => { setSelectAll(!selectAll); setSelectedUsers(selectAll ? new Set() : new Set(filteredUserList.map(u => u.id))); };
  const handleUserSelect = (userId: string) => {
    const ns = new Set(selectedUsers); ns.has(userId) ? ns.delete(userId) : ns.add(userId);
    setSelectedUsers(ns); setSelectAll(ns.size === filteredUserList.length);
  };
  const handleAssignUsers = () => {
    const usersToAssign = unassignedUsers.filter(u => selectedUsers.has(u.id)).map(u => ({ ...u, assignedAt: new Date().toISOString().split('T')[0] }));
    setAssignedUsers(prev => [...usersToAssign, ...prev]);
    setSelectedUsers(new Set());
    setSelectAll(false);

    const count = usersToAssign.length;
    showToast(`${count} user${count !== 1 ? 's' : ''} Unassigned successfully`, "error");
  };

  const handleUnassignUsers = () => {
    const count = selectedUsers.size;
    setAssignedUsers(prev => prev.filter(u => !selectedUsers.has(u.id)));
    setSelectedUsers(new Set());
    setSelectAll(false);

    showToast(`${count} user${count !== 1 ? 's' : ''} Assigned successfully`, "success");
  };

  // ---- EFFECTS ----
  useEffect(() => {
    const loadProject = () => {
      const allProjects = JSON.parse(localStorage.getItem('allProjects') || '[]');
      const currentProject = JSON.parse(localStorage.getItem('currentProject') || 'null');
      let projectToLoad = allProjects.find((p: any) => String(p.id) === String(projectId));
      if (!projectToLoad && currentProject && String(currentProject.id) === String(projectId)) projectToLoad = currentProject;
      if (projectToLoad) {
        setProject({ ...projectToLoad, createdBy: projectToLoad.createdBy || "Admin User", updatedAt: projectToLoad.updatedAt || projectToLoad.created, updatedBy: projectToLoad.updatedBy || "Admin User" });
        setEditForm({ name: projectToLoad.name || "", description: projectToLoad.description || "", status: projectToLoad.status || "active" });
      }
    };
    loadProject();
    loadEnvironments();
    const handleProjectUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const updatedProject = customEvent.detail;
      setProject({ ...updatedProject, createdBy: updatedProject.createdBy || "Admin User", updatedAt: updatedProject.updatedAt || updatedProject.created, updatedBy: updatedProject.updatedBy || "Admin User" });
      setEditForm({ name: updatedProject.name || "", description: updatedProject.description || "", status: updatedProject.status || "active" });
    };
    window.addEventListener('projectUpdated', handleProjectUpdate);
    return () => window.removeEventListener('projectUpdated', handleProjectUpdate);
  }, [projectId]);

  useEffect(() => { if (!dropdownOpen) return; const hc = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.custom-dropdown-wrapper')) setDropdownOpen(false); }; document.addEventListener('mousedown', hc); return () => document.removeEventListener('mousedown', hc); }, [dropdownOpen]);
  useEffect(() => { if (!openEnvMenu) return; const hc = (e: MouseEvent) => { const t = e.target as HTMLElement; if (t.closest('.env-menu-dropdown') || t.closest('.env-menu-trigger')) return; setOpenEnvMenu(null); }; document.addEventListener('mousedown', hc); return () => document.removeEventListener('mousedown', hc); }, [openEnvMenu]);
  useEffect(() => { if (selectedEnv && activeMainTab === 'environments') loadProviders(); }, [selectedEnv, activeService, activeMainTab]);
  useEffect(() => { if (selectedEnv && activeMainTab === 'environments') updateAllServiceCounts(); }, [selectedEnv, activeService, modeFilter, activeMainTab]);
  useEffect(() => { loadEnvironments(); }, [projectId]);
  useEffect(() => {
    if (projectId) setAllTokens(getAllTokens(projectId));
  }, [projectId]);
  useEffect(() => {
    if (projectId) setAllTokens(getAllTokens(projectId));
  }, [showTokenFormModal, showTokenDeleteModal, showRegenModal]);

  const getEnvIcon = (name: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = { 'Local': <Home size={16} />, 'Dev': <Monitor size={16} />, 'Staging': <Rocket size={16} />, 'Live': <Globe size={16} /> };
    return icons[name] || <Wrench size={16} />;
  };

  const handleSaveEdit = () => {
    if (!project || !editForm.name.trim()) return;
    const updatedProject = { ...project, name: editForm.name.trim(), description: editForm.description.trim(), status: editForm.status, updatedAt: new Date().toISOString().split('T')[0], updatedBy: "Current User" };
    setProject(updatedProject); setIsEditing(false);
    localStorage.setItem(`project_${project.id}`, JSON.stringify(updatedProject));
    localStorage.setItem('currentProject', JSON.stringify(updatedProject));
    const allProjects = JSON.parse(localStorage.getItem('allProjects') || '[]');
    localStorage.setItem('allProjects', JSON.stringify(allProjects.map((p: Project) => String(p.id) === String(project.id) ? updatedProject : p)));
    window.dispatchEvent(new CustomEvent('projectUpdated', { detail: updatedProject }));
  };
  const handleCancelEdit = () => { if (project) setEditForm({ name: project.name, description: project.description || "", status: project.status }); setIsEditing(false); };

  if (!project) return <div className="loading">Loading...</div>;

  return (
    <div className="project-view-page">

      {/* Project Details Card */}
      <div className="project-details-card">
        <div className="project-details-content">
          <div className="project-logo-section">
            {isEditing ? (
              <div className="logo-edit-wrapper">
                <label className="logo-label">Logo</label>
                <label className="project-logo editable-logo" style={{ cursor: 'pointer' }}>
                  {project.logo ? <img src={project.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }} /> : <FolderOpen size={40} color="#818cf8" />}
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setProject({ ...project, logo: reader.result as string }); }; reader.readAsDataURL(file); } }} style={{ display: 'none' }} />
                  <div className="image-overlay-edit"><span>Change</span></div>
                </label>
              </div>
            ) : (
              <div className="project-logo">{project.logo ? <img src={project.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }} /> : <FolderOpen size={40} color="#818cf8" />}</div>
            )}
          </div>
          <div className="project-info-section">
            {isEditing ? (
              <>
                <div className="edit-inline-form">
                  <div className="edit-row">
                    <div className="form-group-inline flex-1">
                      <label>Project Name</label>
                      <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="inline-input" />
                    </div>
                    <div className="form-group-inline" style={{ width: '160px' }}>
                      <label>Status</label>
                      <div className="status-select-wrapper">
                        <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "active" | "inactive" })} className="inline-select-dark">
                          <option value="active">Active</option><option value="inactive">Inactive</option>
                        </select>
                        <ChevronDown size={14} className="select-arrow" />
                      </div>
                    </div>
                  </div>
                  <div className="form-group-inline"><label>Description</label><textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="inline-textarea" rows={2} /></div>
                </div>
                <div className="edit-actions-inline">
                  <button className="action-btn cancel" onClick={handleCancelEdit}><X size={16} /> Cancel</button>
                  <button className="action-btn save" onClick={handleSaveEdit}><Save size={16} /> Save</button>
                </div>
              </>
            ) : (
              <>
                <div className="project-name-row">
                  <div className="project-name-left">
                    <h2>{project.name}</h2>
                    <span className={`status-badge ${project.status}`}>{project.status === "active" ? "Active" : "Inactive"}</span>
                    <button className="edit-icon-inline" onClick={() => setIsEditing(true)}><Pencil size={15} /></button>
                  </div>
                  <span className="project-date-text">Created on: {project.created}</span>
                </div>
                <p className="project-id-text">#{project.id}</p>
                {project.description && <p className="project-desc-text">{project.description}</p>}


              </>
            )}
          </div>
        </div>
        {/* Main Tabs */}
        <div className="main-tabs-wrapper">
          <button className={`main-tab ${activeMainTab === 'environments' ? 'active' : ''}`} onClick={() => setActiveMainTab('environments')}>
            <Globe size={16} /> Environments
          </button>
          <button className={`main-tab ${activeMainTab === 'tokens' ? 'active' : ''}`} onClick={() => setActiveMainTab('tokens')}>
            <Key size={16} /> Manage Token
          </button>
        </div>
      </div>

      {/* Content Section */}
      {activeMainTab === 'environments' ? (
        <div className="environment-section-new">
          {environments.length === 0 ? (
            <div className="pc-simple-first-time">
              <div className="pc-simple-card">
                <div className="pc-card-icon"><Globe size={40} color="#6366f1" /></div>
                <h2>Configure Your Environment</h2>
                <p>Get started by creating an environment to manage SMS, Email & WhatsApp providers</p>
                <div className="pc-card-steps">
                  <div className="pc-card-step"><span className="pc-step-dot">1</span><span>Choose an environment type</span></div>
                  <div className="pc-card-step"><span className="pc-step-dot">2</span><span>Add providers for each service</span></div>
                  <div className="pc-card-step"><span className="pc-step-dot">3</span><span>Start sending notifications</span></div>
                </div>
                <div className="pc-simple-select-row">
                  <div className="custom-dropdown-wrapper">
                    <div className={`custom-dropdown-trigger ${dropdownOpen ? 'open' : ''}`} onClick={() => setDropdownOpen(!dropdownOpen)}>
                      <span className={newEnvName || isCustomEnv ? 'selected-text' : 'placeholder-text'}>{isCustomEnv ? 'Custom' : newEnvName || '-- Select Environment --'}</span>
                      <ChevronDown size={16} />
                    </div>
                    {dropdownOpen && (
                      <div className="custom-dropdown-menu">
                        {['Local', 'Dev', 'Staging', 'Live'].map(env => (
                          <div key={env} className={`custom-dropdown-item ${newEnvName === env && !isCustomEnv ? 'selected' : ''}`} onClick={() => { setNewEnvName(env); setIsCustomEnv(false); setDropdownOpen(false); }}>
                            {getEnvIcon(env)} {env}{newEnvName === env && !isCustomEnv && <Check size={14} style={{ marginLeft: 'auto' }} />}
                          </div>
                        ))}
                        <div className="custom-dropdown-divider"></div>
                        <div className={`custom-dropdown-item ${isCustomEnv ? 'selected' : ''}`} onClick={() => { setIsCustomEnv(true); setNewEnvName(""); setDropdownOpen(false); }}>
                          <Wrench size={14} /> Custom{isCustomEnv && <Check size={14} />}
                        </div>
                      </div>
                    )}
                  </div>
                  {isCustomEnv && <input type="text" placeholder="Enter environment name" value={customEnvInput} onChange={e => setCustomEnvInput(e.target.value)} className="pc-input" autoFocus />}
                  <button className="pc-create-first-env-btn" onClick={handleCreateEnvironment} disabled={(!isCustomEnv && !newEnvName) || (isCustomEnv && !customEnvInput.trim())}>
                    Create Environment <Rocket size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Environment Tabs with Sticky Add Button */}
              <div className="env-tabs-container">
                <div className="env-tabs-wrapper">
                  <div className="env-tabs">
                    {environments.map((env) => (
                      <div key={env} className={`env-tab ${selectedEnv === env ? 'active' : ''}`} onClick={() => setSelectedEnv(env)}>
                        {editingTabEnv === env ? (
                          <div className="env-tab-editing" onClick={e => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingTabName}
                              onChange={(e) => setEditingTabName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveTabEdit();
                                if (e.key === 'Escape') cancelTabEdit();
                              }}
                              className="env-tab-edit-input"
                              autoFocus
                              style={{ width: `${Math.max(editingTabName.length * 10, 60)}px` }}
                            />
                            <button className="env-tab-save-btn" onClick={saveTabEdit}>
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="env-tab-name" onDoubleClick={(e) => startEditingTab(env, e)}>{env}</span>
                            <div className="env-tab-menu" onClick={(e) => e.stopPropagation()}>
                              <button className="env-menu-trigger" onClick={() => setOpenEnvMenu(openEnvMenu === env ? null : env)}>
                                <Settings size={14} />
                              </button>
                              {openEnvMenu === env && (
                                <div className="env-menu-dropdown">
                                  <button onClick={() => {
                                    setEditingTabEnv(env);
                                    setEditingTabName(env);
                                    setOpenEnvMenu(null);
                                  }}>
                                    <Pencil size={14} /><span className="env-menu-tooltip">Edit</span>
                                  </button>
                                  <button onClick={() => { setCloneTarget(""); setCloneCustomMode(false); setShowCloneModal(true); setOpenEnvMenu(null); }}>
                                    <Copy size={14} /><span className="env-menu-tooltip">Clone</span>
                                  </button>
                                  <button onClick={() => { setShowUserPanel(true); setOpenEnvMenu(null); setUserSearchTerm(""); setSelectedUsers(new Set()); setSelectAll(false); setUserFilter("all"); }}>
                                    <User size={14} /><span className="env-menu-tooltip">Users</span>
                                  </button>
                                  <button onClick={() => {
                                    const sms = JSON.parse(localStorage.getItem(`env_${projectId}_${env}_sms_providers`) || '{"providers":[]}');
                                    const email = JSON.parse(localStorage.getItem(`env_${projectId}_${env}_email_providers`) || '{"providers":[]}');
                                    const wa = JSON.parse(localStorage.getItem(`env_${projectId}_${env}_whatsapp_providers`) || '{"providers":[]}');
                                    const total = (sms.providers?.length || 0) + (email.providers?.length || 0) + (wa.providers?.length || 0);
                                    setDeletingEnvName(env);
                                    if (total > 0) setBlockedDeleteCounts({ sms: sms.providers?.length || 0, email: email.providers?.length || 0, whatsapp: wa.providers?.length || 0 });
                                    else setShowDeleteEnvModal(true);
                                    setOpenEnvMenu(null);
                                  }}>
                                    <Trash2 size={14} /><span className="env-menu-tooltip">Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <button className="pc-add-env-btn sticky-add-env" onClick={() => { setNewEnvName(""); setIsCustomEnv(false); setCustomEnvInput(""); setShowAddEnvModal(true); }}>
                    <Plus size={14} /> New Environment
                  </button>
                </div>
              </div>

              {/* Environment Content Container */}
              <div className="env-content-container">
                {/* Token Status Strip */}
                <div className="token-status-strip">
                  <span className="token-status-title"><strong>{selectedEnv}</strong> Token Details -</span>

                  {/* Sandbox */}
                  <div className="token-status-item">
                    {(() => {
                      const sandboxToken = allTokens[`${selectedEnv}_Sandbox`];
                      const isExpiring = sandboxToken?.expiresInDays != null && sandboxToken.expiresInDays <= 7;
                      if (sandboxToken) {
                        return isExpiring ? (
                          <span className="token-status-dot expiring"></span>
                        ) : (
                          <span className="token-status-dot active"></span>
                        );
                      }
                      return <span className="token-status-dot inactive"></span>;
                    })()}
                    <Wrench size={14} />
                    <span className="token-status-name">Sandbox</span>
                    {(() => {
                      const sandboxToken = allTokens[`${selectedEnv}_Sandbox`];
                      if (sandboxToken) {
                        return (
                          <span className="token-status-expiry">
                            {sandboxToken.name} · {calculateExpiryLabel(sandboxToken.expires, sandboxToken.expiresInDays)}
                          </span>
                        );
                      }
                      return (
                        <span className="token-status-expiry" style={{ color: '#94a3b8' }}>Not generated yet</span>
                      );
                    })()}
                  </div>

                  <span className="token-status-divider">|</span>

                  {/* Live */}
                  <div className="token-status-item">
                    {(() => {
                      const liveToken = allTokens[`${selectedEnv}_Live`];
                      const isExpiring = liveToken?.expiresInDays != null && liveToken.expiresInDays <= 7;
                      if (liveToken) {
                        return isExpiring ? (
                          <span className="token-status-dot expiring"></span>
                        ) : (
                          <span className="token-status-dot active"></span>
                        );
                      }
                      return <span className="token-status-dot inactive"></span>;
                    })()}
                    <Rocket size={14} />
                    <span className="token-status-name">Live</span>
                    {(() => {
                      const liveToken = allTokens[`${selectedEnv}_Live`];
                      if (liveToken) {
                        return (
                          <span className="token-status-expiry">
                            {liveToken.name} · {calculateExpiryLabel(liveToken.expires, liveToken.expiresInDays)}
                          </span>
                        );
                      }
                      return (
                        <span className="token-status-expiry" style={{ color: '#94a3b8' }}>Not generated yet</span>
                      );
                    })()}
                  </div>
                  {/* Vertical Separator */}
                  <span className="token-section-separator"></span>

                  {/* Active/Inactive Toggle */}
                  {/* Environment Status Toggle */}
                  <div className="env-status-wrapper">
                    <span className="env-status-label"><strong>{selectedEnv}</strong> Environment is:</span>
                    <button
                      className={`env-status-toggle ${(envStatus[selectedEnv] || 'active') === 'active' ? 'status-active' : 'status-inactive'}`}
                      onClick={() => {
                        const newStatus = (envStatus[selectedEnv] || 'active') === 'active' ? 'inactive' : 'active';
                        setPendingStatusChange({ env: selectedEnv, newStatus });
                        setShowStatusModal(true);
                      }}
                    >
                      <span className="toggle-text">{(envStatus[selectedEnv] || 'active').toUpperCase()}</span>
                      <span className="toggle-icon">
                        <svg viewBox="0 0 24 24">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>







                {/* Services Sidebar + Providers Panel */}
                <div className="pc-main-content" style={{ padding: '0' }}>
                  <div className="pc-sidebar-wrapper" style={{ padding: '16px 0 16px 16px' }}>
                    <div className="pc-service-env-info">

                      <span>Services</span>
                      <span className="pc-separator-dash">-</span>
                      <span className="pc-service-label">{activeService}</span>


                    </div>
                    <div className="pc-sidebar">
                      {SERVICE_TYPES.map((service) => (
                        <div key={service} className={`pc-sidebar-item ${activeService === service ? 'active' : ''}`} onClick={() => setActiveService(service)}
                          style={{ borderLeftColor: activeService === service ? SERVICE_COLORS[service] : 'transparent', backgroundColor: activeService === service ? `${SERVICE_COLORS[service]}10` : 'transparent' }}>
                          <span className="pc-sidebar-icon">{SERVICE_ICONS[service]}</span>
                          <div className="pc-sidebar-info"><div className="pc-sidebar-name">{service}</div><div className="pc-sidebar-count">{serviceProviderCounts[service] || 0} providers</div></div>
                          {activeService === service && <div className="pc-sidebar-active-indicator" style={{ background: SERVICE_COLORS[service] }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pc-sidebar-wrapper" style={{ flex: 1, padding: '16px 16px 16px 0' }}>
                    <h4 className="pc-column-label pc-column-label-providers">Providers</h4>
                    <div className="pc-providers-panel" style={{ borderTop: `3px solid ${SERVICE_COLORS[activeService]}` }}>
                      <div className="pc-panel-header">
                        <div className="pc-panel-title">{SERVICE_ICONS[activeService]}<h3>{activeService} Providers</h3></div>
                        <button className="pc-add-btn" style={{ backgroundColor: SERVICE_COLORS[activeService] }} onClick={() => { setEditingProvider(null); setSelectedProvider(""); setProviderFields({}); setShowAddProviderModal(true); }}>
                          <Plus size={14} /> Add Provider
                        </button>
                      </div>
                      <div className="pc-mode-tabs">
                        <button className={`pc-mode-tab ${modeFilter === 'Sandbox' ? 'active sandbox' : ''}`} onClick={() => setmodeFilter('Sandbox')}>
                          <Wrench size={14} /> Sandbox <span className="pc-mode-tab-count">{providers.filter(p => p.fields.mode === 'Sandbox').length}</span>
                        </button>
                        <button className={`pc-mode-tab ${modeFilter === 'Live' ? 'active live' : ''}`} onClick={() => setmodeFilter('Live')}>
                          <Rocket size={14} /> Live <span className="pc-mode-tab-count">{providers.filter(p => p.fields.mode === 'Live').length}</span>
                        </button>
                      </div>
                      <div className="pc-providers-list">
                        {filteredProviders.length === 0 ? (
                          <div className="pc-empty-state"><Server size={44} color="#cbd5e1" /><h4>No {modeFilter} {activeService} providers yet</h4><p>Add your first {modeFilter.toLowerCase()} provider to start configuring services</p></div>
                        ) : (
                          filteredProviders.map((provider, index) => (
                            <div key={provider.id} className={`pc-provider-card ${dragIndex === index ? 'dragging' : ''}`} style={{ borderLeftColor: SERVICE_COLORS[activeService] }}
                              draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, index)} onDragEnd={handleDragEnd}>
                              <div className="pc-provider-card-header" onClick={() => setExpandedProviders(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}>
                                <div className="pc-provider-title">
                                  <Plug size={14} /><span>{provider.name.replace(/_/g, ' ')}</span>
                                  {index === 0 && <span className="pc-primary-badge"><Rocket size={10} /> Primary</span>}
                                  <span className="pc-configured-badge" style={{ background: `${SERVICE_COLORS[activeService]}15`, color: SERVICE_COLORS[activeService] }}><Check size={10} /> Configured</span>
                                </div>
                                <div className="pc-provider-header-right">
                                  {provider.fields.endpoint && (
                                    <div className="pc-endpoint-inline">
                                      <code className="pc-endpoint-text">{provider.fields.endpoint}</code>
                                      <button
                                        className="pc-endpoint-copy-mini"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(provider.fields.endpoint);
                                          showToast("Endpoint copied!", "success");
                                        }}
                                      >
                                        <Copy size={12} />
                                      </button>
                                    </div>
                                  )}
                                  <div className="pc-provider-actions" onClick={(e) => e.stopPropagation()}>
                                    <button className="pc-edit-btn" onClick={() => { setEditingProvider(provider); setSelectedProvider(provider.name); setProviderFields({ ...provider.fields }); setShowAddProviderModal(true); }}><Pencil size={14} /></button>
                                    <button className="pc-delete-btn" onClick={() => setShowDeleteProviderModal({ id: provider.id, name: provider.name })}><Trash2 size={14} /></button>
                                  </div>
                                </div>
                              </div>
                              {expandedProviders[provider.id] && (
                                <div className="pc-provider-card-body">
                                  {Object.entries(provider.fields).sort(([a], [b]) => a === 'mode' ? -1 : b === 'mode' ? 1 : 0).map(([key, value]) => {
                                    const fc = PROVIDER_FIELDS_MAP[provider.name]?.find((f: any) => f.name === key);
                                    const isPwd = fc?.type === "password" || key.includes("Key") || key.includes("Token");
                                    const ismode = fc?.type === "select";
                                    const pk = `${provider.id}_${key}`;
                                    return (
                                      <div className="pc-credential-row" key={key}>
                                        <span className="pc-credential-label">{ismode ? "Mode" : fc?.label || key}</span>
                                        {ismode ? (
                                          <span className={`pc-mode-badge ${value === 'Live' ? 'live' : 'sandbox'}`}>{value === 'Live' ? <Rocket size={12} /> : <Wrench size={12} />}{value || "—"}</span>
                                        ) : (
                                          <>
                                            <span className="pc-credential-value">{isPwd ? (visiblePasswords[pk] ? value : "••••••••••") : value || "—"}</span>
                                            {isPwd && value && <button className="pc-eye-btn-inline" onClick={() => setVisiblePasswords(prev => ({ ...prev, [pk]: !prev[pk] }))}>{visiblePasswords[pk] ? <FaEyeSlash size={14} /> : <FaEye size={14} />}</button>}
                                          </>
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
              </div>
            </>
          )}
        </div>
      ) : (
        /* Token Generation Section */
        <div className="token-section-wrapper">
          <div className="form-card">
            <div className="form-header"><p>Manage API tokens for your environments</p><div className="header-underline"></div></div>
            {environments.length > 0 && (
              <div className="token-search-filter-row">
                <div className="token-search-bar">
                  <div className="search-input-group">
                    <Search size={16} className="search-icon" />
                    <input type="text" placeholder="Search environments..." value={tokenSearchTerm} onChange={(e) => setTokenSearchTerm(e.target.value)} className="token-search-input" />
                    {tokenSearchTerm && <button className="token-clear-btn" onClick={() => setTokenSearchTerm("")}><X size={14} />Clear</button>}
                  </div>
                </div>
              </div>
            )}
            <div className="token-cards-grid">
              {filteredTokens.length === 0 ? (
                <div className="token-empty-illustration">
                  {tokenSearchTerm.trim() ? (
                    <>
                      <img src={noDataIllustration} alt="No data" className="empty-illustration-img" />
                      <h4>No results found</h4>
                      <p>Try adjusting your search term</p>
                    </>
                  ) : (
                    <>
                      <h4>No environments found</h4>
                      <p>Create an environment first to get started</p>
                      <button
                        className="pc-create-first-env-btn"
                        onClick={() => setActiveMainTab('environments')}
                        style={{ marginTop: '16px' }}
                      >
                        <Plus size={16} /> Create Environment
                      </button>
                    </>
                  )}
                </div>
              ) : (
                filteredTokens.map(env => {
                  const sandboxToken = allTokens[`${env}_Sandbox`];
                  const liveToken = allTokens[`${env}_Live`];
                  return (
                    <div key={env} className="token-env-card-full">
                      <div className="token-card-header"><Globe size={18} /><span className="token-card-env-name">{env}</span></div>
                      <div className="token-mode-buttons-row">
                        <div className="token-mode-card">
                          {sandboxToken ? (
                            <div className="mode-configured">
                              <div className="mode-configured-header">
                                <div className="mode-header-left"><Wrench size={16} /><span>Sandbox</span></div>
                                <div className="mode-header-right">
                                  <span className="status-badge active">Active</span>
                                  {sandboxToken.expiresInDays && sandboxToken.expiresInDays <= 7 && <span className="status-badge expiring">Expiring Soon</span>}
                                </div>
                              </div>
                              <div className="mode-token-info">
                                <div className="mode-token-row"><Key size={12} /><span>{sandboxToken.name}</span></div>
                                <div className="mode-token-row"><Calendar size={12} /><span>Created {formatDate(sandboxToken.created)}</span></div>
                                <div className="mode-token-row token-expiry-row">
                                  <div className="expiry-left"><Clock size={12} /><span className={sandboxToken.expiresInDays && sandboxToken.expiresInDays <= 7 ? 'expiring-soon' : ''}>{calculateExpiryLabel(sandboxToken.expires, sandboxToken.expiresInDays)}</span></div>
                                  <div className="mode-token-actions">
                                    <button className="token-action-btn regenerate" onClick={() => { setSelectedEnv(env); setCurrentToken(sandboxToken); setShowRegenModal(true); }}><RefreshCw size={12} />Regenerate</button>
                                    <button className="token-action-btn delete" onClick={() => { setSelectedEnv(env); setCurrentToken(sandboxToken); setShowTokenDeleteModal(true); }}><Trash2 size={12} />Delete</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button className="mode-generate-btn sandbox" onClick={() => { setSelectedEnv(env); setTokenMode('Sandbox'); setTokenName(""); setTokenExpiration("30"); setTokenCustomDays(""); setTokenCustomDate(""); setIsRegenerating(false); setCurrentToken(null); setShowTokenFormModal(true); }}>
                              <Wrench size={18} /><span>Generate Sandbox Token</span><Plus size={16} />
                            </button>
                          )}
                        </div>
                        <div className="token-mode-card">
                          {liveToken ? (
                            <div className="mode-configured">
                              <div className="mode-configured-header">
                                <div className="mode-header-left"><Globe size={16} /><span>Live</span></div>
                                <div className="mode-header-right">
                                  <span className="status-badge active">Active</span>
                                  {liveToken.expiresInDays && liveToken.expiresInDays <= 7 && <span className="status-badge expiring">Expiring Soon</span>}
                                </div>
                              </div>
                              <div className="mode-token-info">
                                <div className="mode-token-row"><Key size={12} /><span>{liveToken.name}</span></div>
                                <div className="mode-token-row"><Calendar size={12} /><span>Created {formatDate(liveToken.created)}</span></div>
                                <div className="mode-token-row token-expiry-row">
                                  <div className="expiry-left"><Clock size={12} /><span className={liveToken.expiresInDays && liveToken.expiresInDays <= 7 ? 'expiring-soon' : ''}>{calculateExpiryLabel(liveToken.expires, liveToken.expiresInDays)}</span></div>
                                  <div className="mode-token-actions">
                                    <button className="token-action-btn regenerate" onClick={() => { setSelectedEnv(env); setCurrentToken(liveToken); setShowRegenModal(true); }}><RefreshCw size={12} />Regenerate</button>
                                    <button className="token-action-btn delete" onClick={() => { setSelectedEnv(env); setCurrentToken(liveToken); setShowTokenDeleteModal(true); }}><Trash2 size={12} />Delete</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button className="mode-generate-btn live" onClick={() => { setSelectedEnv(env); setTokenMode('Live'); setTokenName(""); setTokenExpiration("30"); setTokenCustomDays(""); setTokenCustomDate(""); setIsRegenerating(false); setCurrentToken(null); setShowTokenFormModal(true); }}>
                              <Rocket size={18} /><span>Generate Live Token</span><Plus size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )
      }

      {/* ===== ALL MODALS ===== */}
      {/* Add Environment Modal */}
      {
        showAddEnvModal && (
          <div className="pc-modal-overlay slide-panel">
            <div className="pc-modal" onClick={e => e.stopPropagation()}>
              <div className="pc-modal-header"><h3><Plus size={18} /> Add Environment</h3><button className="pc-modal-close" onClick={() => { setShowAddEnvModal(false); setNewEnvName(""); setIsCustomEnv(false); setCustomEnvInput(""); }}><X size={20} /></button></div>
              <div className="pc-modal-body">
                <p className="pc-modal-desc">Select an environment or create a custom one</p>
                <div className="pc-env-options">
                  {['Local', 'Dev', 'Staging', 'Live'].filter(env => !environments.includes(env)).map(env => (
                    <div key={env} className={`pc-env-option ${newEnvName === env && !isCustomEnv ? 'selected' : ''}`} onClick={() => { setNewEnvName(env); setIsCustomEnv(false); }}>
                      <span className="pc-env-option-icon">{getEnvIcon(env)}</span><span>{env}</span>{newEnvName === env && !isCustomEnv && <Check size={18} />}
                    </div>
                  ))}
                  <div className={`pc-env-option custom ${isCustomEnv ? 'selected' : ''}`} onClick={() => { setIsCustomEnv(true); setNewEnvName(""); }}>
                    <span className="pc-env-option-icon"><Wrench size={18} /></span><span>Custom Environment</span>{isCustomEnv && <Check size={18} />}
                  </div>
                </div>
                {isCustomEnv && <div className="pc-form-group"><label>Environment Name *</label><input type="text" placeholder="e.g., Production" value={customEnvInput} onChange={(e) => setCustomEnvInput(e.target.value)} className="pc-input" autoFocus /></div>}
              </div>
              <div className="pc-modal-footer">
                <button className="pc-btn-cancel" onClick={() => { setShowAddEnvModal(false); setNewEnvName(""); setIsCustomEnv(false); setCustomEnvInput(""); }}>Cancel</button>
                <button className="pc-btn-primary" onClick={handleAddEnvironment} disabled={(!isCustomEnv && !newEnvName) || (isCustomEnv && !customEnvInput.trim())}>Save Environment</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Environment Modal */}
      {
        showEditEnvModal && (
          <div className="pc-modal-overlay slide-panel">
            <div className="pc-modal pc-modal-small" onClick={e => e.stopPropagation()}>
              <div className="pc-modal-header"><h3>Edit Environment</h3><button className="pc-modal-close" onClick={() => { setPendingCloseAction(() => () => setShowEditEnvModal(false)); setShowUnsavedModal(true); }}><X size={18} /></button></div>
              <div className="pc-modal-body"><div className="pc-form-group"><label>Environment Name</label><input type="text" className="pc-input" value={editEnvName} onChange={(e) => setEditEnvName(e.target.value)} /></div></div>
              <div className="pc-modal-footer">
                <button className="pc-btn-cancel" onClick={() => { setPendingCloseAction(() => () => setShowEditEnvModal(false)); setShowUnsavedModal(true); }}>Cancel</button>
                <button className="pc-btn-primary" onClick={handleEditEnvironment}>Save Changes</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Clone Modal */}
      {
        showCloneModal && (
          <div className="pc-modal-overlay slide-panel">
            <div className="pc-modal" onClick={e => e.stopPropagation()}>
              <div className="pc-modal-header"><h3><Copy size={18} /> Clone Environment</h3><button className="pc-modal-close" onClick={() => setShowCloneModal(false)}><X size={20} /></button></div>
              <div className="pc-modal-body">
                <div className="clone-source-info"><label>Source Environment</label><div className="clone-source-name">{getEnvIcon(selectedEnv)} {selectedEnv}</div></div>
                <div className="pc-form-group"><label>Select Target Environment</label>
                  <div className="pc-env-options">
                    {['Local', 'Dev', 'Staging', 'Live'].filter(env => env !== selectedEnv && !environments.includes(env)).map(env => (
                      <div key={env} className={`pc-env-option ${cloneTarget === env && !cloneCustomMode ? 'selected' : ''}`} onClick={() => { setCloneTarget(env); setCloneCustomMode(false); }}>
                        <span className="pc-env-option-icon">{getEnvIcon(env)}</span><span>{env}</span>{cloneTarget === env && !cloneCustomMode && <Check size={18} />}
                      </div>
                    ))}
                    <div className={`pc-env-option custom ${cloneCustomMode ? 'selected' : ''}`} onClick={() => { setCloneCustomMode(true); setCloneTarget(""); }}>
                      <span className="pc-env-option-icon"><Wrench size={18} /></span><span>Custom Environment</span>{cloneCustomMode && <Check size={18} />}
                    </div>
                  </div>
                </div>
                {cloneCustomMode && <div className="pc-form-group"><label>Custom Environment Name *</label><input type="text" placeholder="Enter environment name" value={cloneCustomName} onChange={(e) => setCloneCustomName(e.target.value)} className="pc-input" autoFocus /></div>}
              </div>
              <div className="pc-modal-footer">
                <button className="pc-btn-cancel" onClick={() => setShowCloneModal(false)}>Cancel</button>
                <button className="pc-btn-primary" onClick={executeClone} disabled={(!cloneCustomMode && !cloneTarget) || (cloneCustomMode && !cloneCustomName.trim())}>Clone Environment</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Add/Edit Provider Modal */}
      {
        showAddProviderModal && (
          <div className="pc-modal-overlay slide-panel">
            <div className="pc-modal pc-modal-provider" onClick={e => e.stopPropagation()}>
              <div className="pc-modal-header">
                <div className="pc-modal-header-left">
                  <span className="pc-modal-service-badge" style={{ backgroundColor: `${SERVICE_COLORS[activeService]}15`, color: SERVICE_COLORS[activeService], border: `1px solid ${SERVICE_COLORS[activeService]}40` }}>{SERVICE_ICONS[activeService]}<span>{activeService}</span></span>
                  <h3>{editingProvider ? 'Edit Provider' : 'Add Provider'}</h3>
                </div>
                <button className="pc-modal-close" onClick={() => { setPendingCloseAction(() => () => { setShowAddProviderModal(false); setEditingProvider(null); }); setShowUnsavedModal(true); }}><X size={20} /></button>
              </div>
              <div className="pc-modal-env-info-row">
                <div className="pc-modal-env-info">
                  <Globe size={14} />
                  <span>Environment: <strong>{selectedEnv}</strong></span>
                </div>
                {!editingProvider && (
                  <div className="pc-modal-mode-info">
                    <span className={`pc-mode-badge ${modeFilter === 'Live' ? 'live' : 'sandbox'}`}>
                      {modeFilter === 'Live' ? <Rocket size={14} /> : <Wrench size={14} />}
                      {modeFilter} Mode
                    </span>
                  </div>
                )}
              </div>
              <div className="pc-modal-body">
                <div className="pc-form-group"><label>Select Provider *</label>
                  <select value={selectedProvider} onChange={handleProviderChange} className="pc-select">
                    <option value="">-- Choose provider --</option>
                    {PROVIDERS_BY_SERVICE[activeService]?.filter(p => {
                      // Always show the provider being edited
                      if (editingProvider?.name === p) return true;

                      // Get existing providers of this type
                      const existingOfType = providers.filter(prov => prov.name === p);

                      // If both modes exist, hide this provider
                      const hasLive = existingOfType.some(prov => prov.fields.mode === 'Live');
                      const hasSandbox = existingOfType.some(prov => prov.fields.mode === 'Sandbox');

                      if (hasLive && hasSandbox) return false;

                      return true;
                    }).map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                {selectedProvider && PROVIDER_FIELDS_MAP[selectedProvider] && (
                  <>





                    <div className="pc-credentials-section"><h4><Lock size={14} /> Credentials</h4>
                      {PROVIDER_FIELDS_MAP[selectedProvider].filter((f: any) => f.type !== "select" && f.type !== "endpoint").map((field: any) => (
                        <div className="pc-form-group" key={field.name}><label>{field.label}{field.required && " *"}</label>
                          <div className="pc-input-wrapper">
                            <input type={field.type === "password" && !showPasswords[field.name] ? "password" : "text"} value={providerFields[field.name] || ""} onChange={(e) => handleFieldChange(field.name, e.target.value)} placeholder={`Enter ${field.label}`} className="pc-input" readOnly={field.readOnly && editingProvider && providerFields[field.name]} style={field.readOnly && editingProvider && providerFields[field.name] ? { background: '#f1f5f9', cursor: 'not-allowed' } : {}} />
                            {field.type === "password" && <button type="button" className="pc-eye-btn" onClick={() => togglePasswordVisibility(field.name)}>{showPasswords[field.name] ? <FaEyeSlash /> : <FaEye />}</button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="pc-modal-footer">
                <button className="pc-btn-cancel" onClick={() => { setPendingCloseAction(() => () => { setShowAddProviderModal(false); setEditingProvider(null); }); setShowUnsavedModal(true); }}>Cancel</button>
                <button className="pc-btn-primary" onClick={saveProvider} disabled={saving} style={{ backgroundColor: SERVICE_COLORS[activeService] }}>{saving ? 'Saving...' : editingProvider ? 'Update Provider' : 'Add Provider'}</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Environment Modal */}
      {
        showDeleteEnvModal && (
          <div className="pc-modal-overlay" onClick={() => setShowDeleteEnvModal(false)}>
            <div className="pc-modal pc-modal-small" onClick={e => e.stopPropagation()}><div className="pc-modal-header"><h3>Delete Environment</h3><button className="pc-modal-close" onClick={() => setShowDeleteEnvModal(false)}><X size={18} /></button></div><div className="pc-modal-body"><p>Are you sure you want to delete <strong>{deletingEnvName}</strong> environment?</p><div className="warning-text">This action cannot be undone.</div></div><div className="pc-modal-footer"><button className="pc-btn-cancel" onClick={() => setShowDeleteEnvModal(false)}>Cancel</button><button className="pc-btn-danger" onClick={handleDeleteEnvironment}>Delete</button></div></div>
          </div>
        )
      }

      {/* Cannot Delete Modal */}
      {
        deletingEnvName && (blockedDeleteCounts.sms > 0 || blockedDeleteCounts.email > 0 || blockedDeleteCounts.whatsapp > 0) && (
          <div className="pc-modal-overlay" onClick={() => { setDeletingEnvName(""); setBlockedDeleteCounts({ sms: 0, email: 0, whatsapp: 0 }); }}>
            <div className="pc-modal pc-modal-small" onClick={e => e.stopPropagation()}><div className="pc-modal-header"><h3><AlertTriangle size={18} /> Cannot Delete</h3><button className="pc-modal-close" onClick={() => { setDeletingEnvName(""); setBlockedDeleteCounts({ sms: 0, email: 0, whatsapp: 0 }); }}><X size={18} /></button></div><div className="pc-modal-body"><p>Environment <strong>"{deletingEnvName}"</strong> cannot be deleted because providers are still configured.</p><div className="provider-summary">{blockedDeleteCounts.sms > 0 && <div className="summary-item">SMS: {blockedDeleteCounts.sms}</div>}{blockedDeleteCounts.email > 0 && <div className="summary-item">Email: {blockedDeleteCounts.email}</div>}{blockedDeleteCounts.whatsapp > 0 && <div className="summary-item">WhatsApp: {blockedDeleteCounts.whatsapp}</div>}</div><p className="warning-text">Remove all providers before deleting this environment.</p></div><div className="pc-modal-footer"><button className="pc-btn-cancel" onClick={() => { setDeletingEnvName(""); setBlockedDeleteCounts({ sms: 0, email: 0, whatsapp: 0 }); }}>Close</button></div></div>
          </div>
        )
      }

      {/* Delete Provider Modal */}
      {
        showDeleteProviderModal && (
          <div className="pc-modal-overlay" onClick={() => setShowDeleteProviderModal(null)}>
            <div className="pc-modal pc-modal-small" onClick={e => e.stopPropagation()}><div className="pc-modal-header"><h3><Trash2 size={18} /> Delete Provider</h3><button className="pc-modal-close" onClick={() => setShowDeleteProviderModal(null)}><X size={20} /></button></div><div className="pc-modal-body"><p>Are you sure you want to delete <strong>{showDeleteProviderModal.name.replace(/_/g, ' ')}</strong>?</p><p className="pc-warning-text">This action cannot be undone.</p></div><div className="pc-modal-footer"><button className="pc-btn-cancel" onClick={() => setShowDeleteProviderModal(null)}>Cancel</button><button className="pc-btn-danger" onClick={deleteProvider}>Delete</button></div></div>
          </div>
        )
      }

      {/* Unsaved Changes Modal */}
      {
        showUnsavedModal && (
          <div className="pc-modal-overlay" onClick={() => setShowUnsavedModal(false)}>
            <div className="pc-modal pc-modal-small" onClick={e => e.stopPropagation()}>
              <div className="pc-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AlertTriangle size={22} color="#f59e0b" />
                  <h3 style={{ margin: 0 }}>Discard Changes?</h3>
                </div>
              </div>
              <div className="pc-modal-body">
                <p>You have unsaved changes. If you leave now, your entered credentials will be lost.</p>
                <div className="warning-text"><AlertTriangle size={14} /> This action cannot be undone.</div>
              </div>
              <div className="pc-modal-footer">
                <button className="pc-btn-cancel" onClick={() => setShowUnsavedModal(false)}>Continue Editing</button>
                <button className="pc-btn-danger" onClick={() => { setShowUnsavedModal(false); if (pendingCloseAction) pendingCloseAction(); setPendingCloseAction(null); }}><Trash2 size={16} /> Discard Changes</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Token Generate Form Modal */}
      {
        showTokenFormModal && (
          <div className="pc-modal-overlay slide-panel">
            <div className="pc-modal token-form-modal" onClick={e => e.stopPropagation()}>
              <div className="pc-modal-header"><h3>{isRegenerating ? 'Regenerate Token' : 'Generate Token'}</h3><button className="pc-modal-close" onClick={() => setShowTokenFormModal(false)}><X size={20} /></button></div>
              <div className="pc-modal-body">
                <div className="modal-token-info">
                  <div><Globe size={14} /> Environment: <strong>{selectedEnv}</strong></div>
                  <div>{tokenMode === 'Sandbox' ? <Wrench size={14} /> : <Rocket size={14} />} Mode: <strong>{tokenMode}</strong></div>
                </div>
                <div className="pc-form-group"><label>Note</label><input type="text" placeholder="What’s this token for?" value={tokenName} onChange={(e) => setTokenName(e.target.value)} className="pc-input" autoFocus /></div>
                <div className="pc-form-group"><label>Expiration</label>
                  <div className="expiration-options">
                    {[{ value: "7", label: "7 Days" }, { value: "30", label: "30 Days" }, { value: "60", label: "60 Days" }, { value: "90", label: "90 Days" }, { value: "custom", label: "Custom" }, { value: "never", label: "Never" }].map(opt => (
                      <div key={opt.value} className={`expiration-option ${tokenExpiration === opt.value ? 'active' : ''}`} onClick={() => setTokenExpiration(opt.value)}>
                        <div className="expiration-label">{opt.label}</div>
                        <div className="expiration-date">{opt.value === "never" ? "—" : opt.value === "custom" ? (tokenCustomDate ? formatDate(tokenCustomDate) : "Pick a date") : getExpiryDate(opt.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {tokenExpiration === "custom" && (
                  <div className="pc-form-group"><label>Select Expiry Date</label>
                    <div className="token-date-wrapper" onClick={() => { const input = document.querySelector('.token-date-input') as HTMLInputElement; if (input) input.showPicker(); }}>
                      <input type="date" value={tokenCustomDate} onChange={(e) => { setTokenCustomDate(e.target.value); const now = new Date(); const expiry = new Date(e.target.value); const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)); setTokenCustomDays(String(diffDays > 0 ? diffDays : 1)); }} className="pc-input token-date-input" min={new Date().toISOString().split('T')[0]} />
                      <Calendar className="token-date-icon" size={16} />
                    </div>
                  </div>
                )}
                <div className="token-warning"><AlertTriangle size={16} /><span>The token will only be shown once after creation.</span></div>
              </div>
              <div className="pc-modal-footer">
                <button className="pc-btn-cancel" onClick={() => setShowTokenFormModal(false)}>Cancel</button>
                <button className="pc-btn-primary" onClick={handleTokenGenerate} disabled={!tokenName.trim() || !tokenMode}>{isRegenerating ? 'Regenerate Token' : 'Generate Token'}</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Token Reveal Modal */}
      {
        generatedToken && (
          <div className="pc-modal-overlay">
            <div className="pc-modal token-reveal-modal" onClick={e => e.stopPropagation()}>
              <div className="reveal-success"><Check size={20} /> Token Generated!</div>
              <div className="reveal-warning-box"><AlertTriangle size={18} /><div><strong>SAVE THIS TOKEN NOW</strong><p>This token will NOT be shown again.</p></div></div>
              <div className="reveal-token-box">
                <div className="reveal-token-row">
                  <div className="reveal-token-value">{generatedToken.token}</div>
                  <button className={`btn-copy-inline ${copied ? 'copied' : ''}`} onClick={() => { navigator.clipboard.writeText(generatedToken.token); setCopied(true); setTimeout(() => setCopied(false), 3000); }}>
                    {copied ? <><Check size={14} />Copied!</> : <><Copy size={14} />Copy</>}
                  </button>
                </div>
                <div className="reveal-token-meta">
                  <div><Globe size={14} />{generatedToken.environmentName}</div>
                  <div><Calendar size={14} />{generatedToken.name} · {formatDate(generatedToken.created)}</div>
                  <div><Clock size={14} />Expires: {formatDate(generatedToken.expires)}</div>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <button className="pc-btn-primary" onClick={() => setShowTokenLeaveModal(true)}>
                  <Check size={16} /> I've Saved the Token, Go Back
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Regenerate Token Confirm Modal */}
      {
        showRegenModal && (
          <div className="pc-modal-overlay" onClick={() => setShowRegenModal(false)}>
            <div className="pc-modal pc-modal-small" onClick={e => e.stopPropagation()}><div className="pc-modal-header"><RefreshCw size={22} color="#6366f1" /><h3>Regenerate Token?</h3></div><div className="pc-modal-body"><div className="modal-token-info"><div><Globe size={14} /> Environment: <strong>{selectedEnv}</strong></div>{currentToken && <><div><Key size={14} /> Token: <strong>{currentToken.name}</strong></div><div><Calendar size={14} /> Created: {formatDate(currentToken.created)}</div></>}</div><p className="warning-text">Regenerating will revoke the old token.</p></div><div className="pc-modal-footer"><button className="pc-btn-cancel" onClick={() => setShowRegenModal(false)}>Cancel</button><button className="pc-btn-primary" onClick={() => {
              setShowRegenModal(false);
              setTokenMode(currentToken?.mode || '');
              setTokenName("");  // Clear the token name
              setTokenExpiration("30");
              setTokenCustomDays("");
              setTokenCustomDate("");
              setIsRegenerating(true);
              setShowTokenFormModal(true);
            }}>Continue</button></div></div>
          </div>
        )
      }

      {/* Delete Token Confirm Modal */}
      {
        showTokenDeleteModal && (
          <div className="pc-modal-overlay" onClick={() => setShowTokenDeleteModal(false)}>
            <div className="pc-modal pc-modal-small" onClick={e => e.stopPropagation()}><div className="pc-modal-header"><Trash2 size={22} color="#ef4444" /><h3>Delete Token?</h3></div><div className="pc-modal-body"><div className="modal-token-info"><div><Globe size={14} /> Environment: <strong>{selectedEnv}</strong></div>{currentToken && <><div><Key size={14} /> Token: <strong>{currentToken.name}</strong></div><div><Calendar size={14} /> Created: {formatDate(currentToken.created)}</div></>}</div><p className="warning-text">This will permanently revoke API access.</p></div><div className="pc-modal-footer"><button className="pc-btn-cancel" onClick={() => setShowTokenDeleteModal(false)}>Cancel</button><button className="pc-btn-primary" onClick={handleTokenDelete} style={{ background: '#ef4444' }}>Delete Token</button></div></div>
          </div>
        )
      }

      {/* User Assignment Panel */}
      {
        showUserPanel && (
          <div className="user-panel-overlay" onClick={() => setShowUserPanel(false)}>
            <div className="user-panel" onClick={e => e.stopPropagation()}>
              <div className="user-panel-header"><div className="user-panel-header-left"><User size={20} /><h3>Manage Users - {selectedEnv}</h3></div><button className="user-panel-close" onClick={() => setShowUserPanel(false)}><X size={20} /></button></div>
              <div className="user-panel-tabs">
                <button className={`user-panel-tab ${userActiveTab === 'assign' ? 'active' : ''}`} onClick={() => { setUserActiveTab('assign'); setSelectedUsers(new Set()); setSelectAll(false); }}><UserPlus size={14} /> Assign User</button>
                <button className={`user-panel-tab ${userActiveTab === 'unassign' ? 'active' : ''}`} onClick={() => { setUserActiveTab('unassign'); setSelectedUsers(new Set()); setSelectAll(false); }}><UserMinus size={14} /> Unassign User</button>
              </div>
              <div className="user-panel-search-row">
                <div className="user-panel-search">
                  <Search size={16} className="user-panel-search-icon" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="user-panel-search-input"
                  />
                  {userSearchTerm && (
                    <button className="user-panel-search-clear" onClick={() => setUserSearchTerm("")}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Replace the select with this custom dropdown */}
                <div className="user-panel-filter-wrapper">
                  <div
                    className={`user-panel-filter-trigger ${userFilterDropdownOpen ? 'open' : ''}`}
                    onClick={() => setUserFilterDropdownOpen(!userFilterDropdownOpen)}
                  >
                    <div className="filter-trigger-left">
                      <Filter size={14} className="filter-icon" />
                      <span className="filter-selected-text">
                        {userFilter === 'all' ? 'All Status' : userFilter === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <ChevronDown size={16} className="filter-chevron" />
                  </div>
                  {userFilterDropdownOpen && (
                    <div className="user-panel-filter-menu">
                      <div
                        className={`user-panel-filter-item ${userFilter === 'all' ? 'selected' : ''}`}
                        onClick={() => {
                          setUserFilter('all');
                          setUserFilterDropdownOpen(false);
                        }}
                      >
                        <span>All Status</span>
                        {userFilter === 'all' && <Check size={14} />}
                      </div>
                      <div
                        className={`user-panel-filter-item ${userFilter === 'active' ? 'selected' : ''}`}
                        onClick={() => {
                          setUserFilter('active');
                          setUserFilterDropdownOpen(false);
                        }}
                      >
                        <div className="filter-item-dot active"></div>
                        <span>Active</span>
                        {userFilter === 'active' && <Check size={14} />}
                      </div>
                      <div
                        className={`user-panel-filter-item ${userFilter === 'inactive' ? 'selected' : ''}`}
                        onClick={() => {
                          setUserFilter('inactive');
                          setUserFilterDropdownOpen(false);
                        }}
                      >
                        <div className="filter-item-dot inactive"></div>
                        <span>Inactive</span>
                        {userFilter === 'inactive' && <Check size={14} />}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="user-panel-table-wrapper">
                <table className="user-panel-table"><thead><tr><th className="col-checkbox"><input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="user-checkbox" /></th><th className="col-user">User</th><th className="col-status">Status</th></tr></thead>

                  <tbody>
                    {filteredUserList.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="user-empty-state">
                          {userSearchTerm.trim() ? (
                            <>
                              <img
                                src={noDataIllustration}
                                alt="No data"
                                className="user-empty-illustration-img"
                              />
                              <div className="user-empty-message">
                                <h4>No results found</h4>
                                <p>Try adjusting your search term</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <img
                                src={noDataIllustration}
                                alt="No data"
                                className="user-empty-illustration-img"
                              />
                              <div className="user-empty-message">
                                <h4>
                                  {userActiveTab === 'assign'
                                    ? 'No users available to assign'
                                    : 'No users assigned yet'}
                                </h4>
                                <p>
                                  {userActiveTab === 'assign'
                                    ? 'All users are already assigned to this environment'
                                    : 'Assign users to this environment to get started'}
                                </p>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredUserList.map(user => (
                        <tr key={user.id} className={selectedUsers.has(user.id) ? 'selected' : ''}>
                          <td className="col-checkbox"><input type="checkbox" checked={selectedUsers.has(user.id)} onChange={() => handleUserSelect(user.id)} className="user-checkbox" /></td>
                          <td className="col-user"><div className="user-cell"><span className="user-name">{user.name}</span><span className="user-email">{user.email}</span></div></td>
                          <td className="col-status"><span className={`user-status-badge ${user.status}`}>{user.status === 'active' ? <Check size={12} /> : <AlertCircle size={12} />}{user.status}</span></td>
                        </tr>
                      )))}
                  </tbody>
                </table>
              </div>
              <div className="user-panel-footer">
                <button className="user-panel-action-btn" onClick={userActiveTab === 'assign' ? handleAssignUsers : handleUnassignUsers} disabled={selectedUsers.size === 0} style={{ background: userActiveTab === 'assign' ? '#6366f1' : '#ef4444' }}>
                  {userActiveTab === 'assign' ? <><UserPlus size={16} /> Unassign Selected ({selectedUsers.size})</> : <><UserMinus size={16} /> Assign Selected ({selectedUsers.size})</>}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Token Leave Confirmation Modal */}
      {
        showTokenLeaveModal && (
          <div className="pc-modal-overlay" onClick={() => setShowTokenLeaveModal(false)}>
            <div className="pc-modal pc-modal-small" onClick={e => e.stopPropagation()}>
              <div className="pc-modal-header">
                <AlertTriangle size={22} color="#f59e0b" />
                <h3>Leave Token Page?</h3>
              </div>
              <div className="pc-modal-body">
                <p>Have you copied and saved this token?</p>
                <div className="warning-text">
                  <AlertTriangle size={14} /> This token will not be shown again after leaving this page.
                </div>
              </div>
              <div className="pc-modal-footer">
                <button className="pc-btn-cancel" onClick={() => setShowTokenLeaveModal(false)}>Stay Here</button>
                <button className="pc-btn-danger" onClick={() => {
                  setShowTokenLeaveModal(false);
                  setGeneratedToken(null);
                  setCopied(false);
                }}>
                  <Check size={16} /> Yes, I've Saved It
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Environment Status Change Modal */}
      {showStatusModal && pendingStatusChange && (
        <div className="pc-modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="pc-modal pc-modal-small" onClick={e => e.stopPropagation()}>
            <div className="pc-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={22} color="#f59e0b" />
                <h3 style={{ margin: 0 }}>
                  {pendingStatusChange.newStatus === 'active' ? 'Activate' : 'Deactivate'} Environment?
                </h3>
              </div>
            </div>
            <div className="pc-modal-body">
              <p>
                Are you sure you want to <strong>{pendingStatusChange.newStatus === 'active' ? 'activate' : 'deactivate'}</strong> the <strong>{pendingStatusChange.env}</strong> environment?
              </p>
              {pendingStatusChange.newStatus === 'inactive' && (
                <div className="warning-text">
                  <AlertTriangle size={14} /> Deactivating this environment may affect running services.
                </div>
              )}
            </div>
            <div className="pc-modal-footer">
              <button className="pc-btn-cancel" onClick={() => {
                setShowStatusModal(false);
                setPendingStatusChange(null);
              }}>Cancel</button>
              <button
                className={pendingStatusChange.newStatus === 'active' ? 'pc-btn-primary' : 'pc-btn-danger'}
                onClick={() => {
                  if (pendingStatusChange) {
                    setEnvStatus(prev => ({
                      ...prev,
                      [pendingStatusChange.env]: pendingStatusChange.newStatus
                    }));
                    showToast(
                      `Environment "${pendingStatusChange.env}" ${pendingStatusChange.newStatus === 'active' ? 'activated' : 'deactivated'}`,
                      pendingStatusChange.newStatus === 'active' ? 'success' : 'error'
                    );
                  }
                  setShowStatusModal(false);
                  setPendingStatusChange(null);
                }}
              >
                {pendingStatusChange.newStatus === 'active' ? (
                  <> Yes, Activate</>
                ) : (
                  <><AlertTriangle size={16} /> Yes, Deactivate</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <ToastContainer />
    </div >
  );
}