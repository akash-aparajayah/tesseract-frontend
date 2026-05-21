import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "../styles/ProjectView.module.css";
import {
  Pencil, FolderOpen, Plus, MessageSquare, Mail, MessageCircle, Plug, Check,
  Save, X, ChevronDown, Server, Copy, Trash2, Globe, Rocket, Wrench,
  Search, Lock, AlertTriangle, Home, Monitor, Key,
  User, UserMinus, UserPlus, AlertCircle, Calendar, Clock, RefreshCw, Filter, Settings
} from 'lucide-react';
import { useToast } from "../hooks/useToast";
import "../styles/Toast.css"
import noDataIllustration from '../assets/illustration/No data.gif';
import {
  getAllServices, getProvidersByServiceId, createProvider, getProviderById, deleteProvider,
  createEnvironment, getEnvironmentsByProjectId, getProvidersByEnvironmentId, updateProvider, getAssignedUnassignedEmployees, assignUnassignEmployee,
  getApiKeys, regenerateApiKey, createApiKey, deleteApiKey
} from "../services/projectApi";

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
  id: string;
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


// Token Utils

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
  const { projectId } = useParams();

  const [project, setProject] = useState<Project | null>(null);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [selectedEnv, setSelectedEnv] = useState("");
  const [activeService, setActiveService] = useState<string>("SMS");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [serviceProviderCounts, setServiceProviderCounts] = useState<Record<string, number>>({ SMS: 0, Email: 0, Whatsapp: 0 });
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});
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
  const [showDeleteProviderModal, setShowDeleteProviderModal] = useState<{ id: string; name: string } | null>(null);

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

  // REFS - ADDED for CSS Modules fix
  const dropdownRef = useRef<HTMLDivElement>(null);
  const envMenuRef = useRef<HTMLDivElement>(null);
  const envTabsRef = useRef<HTMLDivElement>(null);
  const userFilterRef = useRef<HTMLDivElement>(null);
  const tokenDateRef = useRef<HTMLInputElement>(null);

  const [providersLoading, setProvidersLoading] = useState(false);
  const [serviceData, setServiceData] = useState<any>(null);

  const [providersList, setProvidersList] = useState<any[]>([]);


  const fetchUsersForEnvironment = async () => {
    if (!projectId || !selectedEnv) return;

    try {
      setUsersLoading(true);
      const env = environments.find((e: any) => e.environment_name === selectedEnv);
      if (!env?.public_id) return;

      const res = await getAssignedUnassignedEmployees(projectId, env.public_id);
      console.log("Assigned/Unassigned:", res);

      const data = res.data || res;

      // Map API response fields
      const mapUsers = (users: any[]) => users.map((u: any) => ({
        id: u.public_id,
        name: u.user_name,
        email: u.email,
        role: u.role,
        status: u.is_active ? 'active' : 'inactive',
      }));


      const unassigned = mapUsers(data.unassignedEmployees || []);
      const assigned = mapUsers(data.assignedEmployees || []);
      setAvailableUsers(assigned);    // Assign tab = assignedEmployees
      setAssignedUsers(unassigned);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchProvidersForService = async (servicePublicId: string) => {
    try {
      const res = await getProvidersByServiceId(servicePublicId);
      setProvidersList(res.data || []);
    } catch (error) {
      console.error("Failed to fetch providers:", error);
      setProvidersList([]);
    }
  };

  useEffect(() => {
    if (serviceData && activeService) {
      const service = serviceData.find(
        (s: any) => s.name === activeService || s.slug === activeService.toLowerCase()
      );
      if (service?.public_id) {
        fetchProvidersForService(service.public_id);
      }
    }
  }, [activeService, serviceData]);

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

    showToast(`Environment renamed to "${newName}"`, "success");
  };

  const loadProvidersForEnv = (env: any) => {
    if (!projectId || !serviceData) return;
    const service = serviceData.find((s: any) => s.name === activeService);
    if (!env?.public_id || !service?.public_id) return;

    getProvidersByEnvironmentId(env.public_id, service.public_id)
      .then(res => {
        const data = res.data || {};
        const allProviders = [...(data.sandbox || []), ...(data.live || [])];
        setProviders(allProviders.map((p: any) => ({
          id: p.public_id || p.id,
          name: p.provider_name || p.name,
          fields: { ...(p.credentials || {}), mode: p.mode, endpoint: p.endpoint },
        })));
        setServiceProviderCounts(prev => ({ ...prev, [activeService]: allProviders.length }));
      })
      .catch(() => { });
  };



  // Close filter dropdown when clicking outside - FIXED
  useEffect(() => {
    if (!userFilterDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (userFilterRef.current && !userFilterRef.current.contains(target)) {
        setUserFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userFilterDropdownOpen]);

  useEffect(() => {
    if (!generatedToken) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have an unsaved token. Are you sure you want to leave?';
    };

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

  // Close edit on click outside - FIXED
  useEffect(() => {
    if (!editingTabEnv) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (envTabsRef.current && !envTabsRef.current.contains(target)) {
        cancelTabEdit();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingTabEnv]);


  // Mock user data
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const unassignedUsers = (Array.isArray(availableUsers) ? availableUsers : []).filter(
    u => !assignedUsers.some(au => au.id === u.id)
  );



  // ---- ENVIRONMENT FUNCTIONS ----
  // const loadEnvironments = async () => {
  //   if (!projectId) return;

  //   try {
  //     const res = await getEnvironmentsByProjectId(projectId);

  //     const envs = res?.data?.data || [];

  //     setEnvironments(envs);

  //     if (envs.length > 0) {
  //       setSelectedEnv(envs[0].environment_name);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  const loadEnvironments = async () => {
    if (!projectId) return;

    const cached = localStorage.getItem(`env_data_${projectId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.length > 0) {
          setEnvironments(parsed);
          const firstEnv = parsed[0].environment_name;
          setSelectedEnv(firstEnv);
          // ✅ Load providers for the first environment
          loadProvidersForEnv(parsed[0]);
        }
      } catch { }
    }

    try {
      const res = await getEnvironmentsByProjectId(projectId);
      const envs = res?.data || [];
      if (envs.length > 0) {
        setEnvironments(envs);
        const firstEnv = envs[0].environment_name;
        if (!selectedEnv) {
          setSelectedEnv(firstEnv);
          // ✅ Load providers for the first environment
          loadProvidersForEnv(envs[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load environments", error);
    }
  };

  const loadProviders = () => {
    const env = environments.find((e: any) => e.environment_name === selectedEnv);
    if (env) loadProvidersForEnv(env);
  };

  const updateAllServiceCounts = () => {
    setServiceProviderCounts(prev => ({ ...prev, [activeService]: providers.length }));
  };


  // const handleCreateEnvironment = () => {
  //   if (!projectId) return;
  //   const envToCreate = isCustomEnv && customEnvInput.trim() ? customEnvInput.trim() : (newEnvName || 'Local');

  //   ['sms', 'email', 'whatsapp'].forEach(service => {
  //     const key = `env_${projectId}_${envToCreate}_${service}_providers`;
  //     if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ providers: [], timestamp: Date.now() }));
  //   });

  //   const existingOrder = JSON.parse(
  //     localStorage.getItem(`env_order_${projectId}`) || "[]"
  //   );

  //   if (!existingOrder.includes(envToCreate)) {
  //     const updatedOrder = [...existingOrder, envToCreate];
  //     localStorage.setItem(`env_order_${projectId}`, JSON.stringify(updatedOrder));
  //   }

  //   loadEnvironments();
  //   setSelectedEnv(envToCreate);
  //   setNewEnvName("");
  //   setIsCustomEnv(false);
  //   setCustomEnvInput("");
  // };

  const handleAddEnvironment = async () => {
    if (!projectId) return;

    let name = newEnvName;
    if (isCustomEnv && customEnvInput.trim()) name = customEnvInput.trim();
    if (!name) return;

    try {
      await createEnvironment(projectId, { environment_name: name });

      showToast(`Environment "${name}" created successfully`, "success");

      // ✅ Use loadEnvironments instead of calling API directly
      await loadEnvironments();

      setSelectedEnv(name);
      await loadProviders();

      setShowAddEnvModal(false);
      setNewEnvName("");
      setIsCustomEnv(false);
      setCustomEnvInput("");
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to create environment", "error");
    }
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

    showToast(`Environment renamed to "${editEnvName}"`, "success");
  };

  const handleDeleteEnvironment = () => {
    if (!projectId) return;
    ['sms', 'email', 'whatsapp'].forEach(s => localStorage.removeItem(`env_${projectId}_${deletingEnvName}_${s}_providers`));
    deleteToken(projectId, deletingEnvName, 'Sandbox');
    deleteToken(projectId, deletingEnvName, 'Live');
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

  const saveProvider = async () => {
    if (!selectedProvider || !projectId || !selectedEnv) return;

    setSaving(true);

    try {
      const env = environments.find((e: any) => e.environment_name === selectedEnv);

      if (editingProvider) {
        // UPDATE
        await updateProvider(editingProvider.id.toString(), {
          credentials: {
            ...providerFields,
            mode: modeFilter,
          },
        });
      } else {
        // CREATE
        const service = serviceData?.find(
          (s: any) =>
            s.name?.trim().toLowerCase() ===
            activeService.trim().toLowerCase() ||
            s.slug?.trim().toLowerCase() ===
            activeService.trim().toLowerCase()
        );

        console.log("SERVICE FOUND:", service);

        if (!service?.public_id) {
          showToast("Service mapping failed", "error");
          return;
        }
        const provider = providersList.find(
          (p: any) =>
            p.name?.trim().toLowerCase() ===
            selectedProvider?.trim().toLowerCase()
        );

        console.log("Selected Provider:", provider);

        if (!provider?.public_id) {
          showToast("Provider mapping failed", "error");
          return;
        }
        const payload = {
          environment_id: env?.public_id,
          service_type_id: service?.public_id,
          provider_id: provider?.public_id,
          provider_name: provider?.name,
          credentials: {
            ...providerFields,
            mode: modeFilter,
          },
          mode: modeFilter,
          endpoint: providerFields.endpoint || "",
        };

        await createProvider(payload);
      }

      // Refresh
      setTimeout(async () => {
        const refreshedEnv = environments.find(
          (e: any) => e.environment_name === selectedEnv
        );

        if (refreshedEnv) {
          await loadProvidersForEnv(refreshedEnv);
        }
      }, 500);

      setShowAddProviderModal(false);
      setEditingProvider(null);
      setSelectedProvider("");
      setProviderFields({});
      showToast(editingProvider ? "Provider updated successfully" : "Provider created successfully", "success");
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to save provider", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteProviderHandler = async () => {
    if (!showDeleteProviderModal) return;
    try {
      await deleteProvider(showDeleteProviderModal.id.toString());

      const env = environments.find((e: any) => e.environment_name === selectedEnv);
      if (env) await loadProvidersForEnv(env);

      setShowDeleteProviderModal(null);
      showToast("Provider deleted", "success");
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to delete provider", "error");
    }
  };

  const handleProviderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const providerName = e.target.value;
    setSelectedProvider(providerName);

    // Find the provider from the list
    const provider = providersList.find((p: any) => p.name === providerName);

    if (provider?.public_id) {
      try {
        // Fetch provider details to get credential schema
        const res = await getProviderById(provider.public_id);
        console.log("Provider details:", res);

        const schema = res.data?.required_credential_schema || [];

        const nf: Record<string, string> = {};
        schema.forEach((field: any) => {
          nf[field.key] = "";
        });
        nf["mode"] = modeFilter;

        setProviderFields(nf);
      } catch (error) {
        console.error("Failed to fetch provider schema:", error);
      }
    }
  };

  const handleFieldChange = (n: string, v: string) => setProviderFields(prev => ({ ...prev, [n]: v }));
  const togglePasswordVisibility = (n: string) => setShowPasswords(prev => ({ ...prev, [n]: !prev[n] }));

  // ---- TOKEN FUNCTIONS ----
  const saveToken = (pId: string, env: string, mode: string, token: ApiToken) => {
    localStorage.setItem(`token_${pId}_${env}_${mode}`, JSON.stringify(token));
  };
  // const getAllTokens = (pId: string): Record<string, ApiToken> => {
  //   const tokens: Record<string, ApiToken> = {};
  //   Object.keys(localStorage).forEach(key => {
  //     const match = key.match(new RegExp(`^token_${pId}_(.+)_(Sandbox|Live)$`));
  //     if (match) {
  //       const data = localStorage.getItem(key);
  //       if (data) try { tokens[`${match[1]}_${match[2]}`] = JSON.parse(data); } catch { }
  //     }
  //   });
  //   return tokens;
  // };
  const deleteToken = (pId: string, env: string, mode: string) => {
    localStorage.removeItem(`token_${pId}_${env}_${mode}`);
  };

  const handleTokenGenerate = async () => {
    if (!tokenName.trim() || !selectedEnv || !projectId || !tokenMode) return;

    try {
      const payload = {
        projectId: projectId || "",
        environment_name: selectedEnv,
        mode: tokenMode,
        name: tokenName.trim(),
        expires_in_days: getExpiryDays(
          tokenExpiration,
          tokenCustomDays
        ),
      };

      let res;

      // REGENERATE
      if (isRegenerating && currentToken?.id) {
        res = await regenerateApiKey(currentToken.id);
      } else {
        // CREATE
        res = await createApiKey(payload);
      }

      const tokenData = res.data;

      const token: ApiToken = {
        id: tokenData.public_id || "",
        name: tokenData.name || "",
        token: tokenData.api_key || "",
        projectId: projectId || "",
        environmentName: tokenData.environment_name || "",
        mode: tokenData.mode || "",
        created: tokenData.created_at || "",
        expires: tokenData.expires_at || "",
        expiresInDays: tokenData.expires_in_days || 0,
        revealed: false,
      };

      setAllTokens((prev) => ({
        ...prev,
        [`${selectedEnv}_${tokenMode}`]: token,
      }));

      setGeneratedToken(token);
      setShowTokenFormModal(false);

      showToast(
        `Token ${isRegenerating ? "regenerated" : "generated"
        } for ${selectedEnv}`,
        "success"
      );

      // RESET
      setTokenName("");
      setTokenExpiration("30");
      setTokenCustomDays("");
      setTokenCustomDate("");
      setIsRegenerating(false);
      setCurrentToken(null);

    } catch (error: any) {
      console.error("Token generation failed:", error);

      showToast(
        error?.response?.data?.message ||
        "Failed to generate token",
        "error"
      );
    }
  };

  const handleTokenDelete = async () => {
    if (!projectId || !selectedEnv || !currentToken?.mode) return;

    try {
      await deleteApiKey(currentToken.id);

      setAllTokens((prev) => {
        const updated = { ...prev };
        delete updated[`${selectedEnv}_${currentToken.mode}`];
        return updated;
      });

      setShowTokenDeleteModal(false);
      setSelectedEnv("");
      setCurrentToken(null);

      showToast("Token deleted", "error");

    } catch (error: any) {
      console.error("Delete token failed:", error);

      showToast(
        error?.response?.data?.message ||
        "Failed to delete token",
        "error"
      );
    }
  };

  const filteredTokens = environments.filter(env => {
    if (!tokenSearchTerm.trim()) return true;
    const q = tokenSearchTerm.toLowerCase();
    const envName = env.environment_name || env;
    return envName.toLowerCase().includes(q) ||
      allTokens[`${envName}_Sandbox`]?.name?.toLowerCase().includes(q) ||
      allTokens[`${envName}_Live`]?.name?.toLowerCase().includes(q);
  });

  // ---- DRAG & DROP ----
  const filteredProviders = providers.filter(
    p =>
      p.fields.mode?.toLowerCase() ===
      modeFilter.toLowerCase()
  );
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
    setProviders(newProviders); setDragIndex(null);
    // saveToLocalStorage(newProviders);
    showToast("Primary provider updated successfully", "success");
  };
  const handleDragEnd = () => setDragIndex(null);

  // ---- USER FUNCTIONS ----
  const getFilteredUsers = () => {
    const userList = userActiveTab === "assign" ? availableUsers : assignedUsers;
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
  // "Unassign User" tab = users from API (unassigned)
  // "Assign User" tab = users you've assigned

  const handleAssignUsers = async () => {
    if (!projectId || !selectedEnv) return;
    const env = environments.find((e: any) => e.environment_name === selectedEnv);
    if (!env?.public_id) return;

    const usersToAssign = assignedUsers.filter(u => selectedUsers.has(u.id));
    if (usersToAssign.length === 0) return;

    try {
      await assignUnassignEmployee({
        project_id: projectId,
        environment_id: env.public_id,
        user_id: usersToAssign.map(u => u.id),
        status: true,
      });

      setAvailableUsers(prev => [...usersToAssign, ...prev]);
      setAssignedUsers(prev => prev.filter(u => !selectedUsers.has(u.id)));
      setSelectedUsers(new Set());
      setSelectAll(false);
      showToast(`${usersToAssign.length} user(s) assigned`, "success");
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to assign users", "error");
    }
  };

  const handleUnassignUsers = async () => {
    if (!projectId || !selectedEnv) return;
    const env = environments.find((e: any) => e.environment_name === selectedEnv);
    if (!env?.public_id) return;

    const usersToUnassign = availableUsers.filter(u => selectedUsers.has(u.id));
    if (usersToUnassign.length === 0) return;

    try {
      await assignUnassignEmployee({
        project_id: projectId,
        environment_id: env.public_id,
        user_id: usersToUnassign.map(u => u.id),
        status: false,
      });

      setAssignedUsers(prev => [...usersToUnassign, ...prev]);
      setAvailableUsers(prev => prev.filter(u => !selectedUsers.has(u.id)));
      setSelectedUsers(new Set());
      setSelectAll(false);
      showToast(`${usersToUnassign.length} user(s) unassigned`, "success");
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to unassign users", "error");
    }
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

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await getAllServices();
        setServiceData(res.data);  //extracts data array
      } catch (error) {
        console.error("Failed to fetch services:", error);
      }
    };
    fetchServices();
  }, []);

  // Dropdown click outside - FIXED with ref
  useEffect(() => {
    if (!dropdownOpen) return;
    const hc = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as HTMLElement))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', hc);
    return () => document.removeEventListener('mousedown', hc);
  }, [dropdownOpen]);

  // Env menu click outside - FIXED with ref
  useEffect(() => {
    if (!openEnvMenu) return;
    const hc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      // Don't close if clicking inside the menu or the trigger button
      if (t.closest('[data-env-menu]')) return;
      setOpenEnvMenu(null);
    };
    document.addEventListener('mousedown', hc);
    return () => document.removeEventListener('mousedown', hc);
  }, [openEnvMenu]);


  // After setting environments:
  // useEffect(() => {
  //   if (environments.length > 0) {
  //     localStorage.setItem(`env_data_${projectId}`, JSON.stringify(environments));
  //   }
  // }, [environments, projectId]);

  // On load, check localStorage first:

  const loadApiKeys = async () => {
    if (!projectId) return;

    try {
      const res = await getApiKeys(projectId);

      const mapped: Record<string, ApiToken> = {};

      (res.data || []).forEach((token: any) => {
        mapped[`${token.environment_name}_${token.mode}`] = {
          id: token.public_id,
          name: token.name,
          token: token.api_key,
          projectId: projectId || "",
          environmentName: token.environment_name,
          mode: token.mode,
          created: token.created_at,
          expires: token.expires_at,
          expiresInDays: token.expires_in_days,
          revealed: false,
        };
      });

      setAllTokens(mapped);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, [projectId]);

  useEffect(() => { if (selectedEnv && activeMainTab === 'environments') loadProviders(); }, [selectedEnv, activeService, activeMainTab]);
  useEffect(() => { if (selectedEnv && activeMainTab === 'environments') updateAllServiceCounts(); }, [selectedEnv, activeService, modeFilter, activeMainTab]);


  useEffect(() => {
    if (selectedEnv && activeMainTab === 'environments' && serviceData) {
      const env = environments.find((e: any) => e.environment_name === selectedEnv);
      if (env) {
        loadProvidersForEnv(env);
      }
    }
  }, [selectedEnv, serviceData]);


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

  if (!project) return <div className={styles["loading"]}>Loading...</div>;

  return (
    <div className={styles["project-view-page"]}>

      {/* Project Details Card */}
      <div className={styles["project-details-card"]}>
        <div className={styles["project-details-content"]}>
          <div className={styles["project-logo-section"]}>
            {isEditing ? (
              <div className={styles["logo-edit-wrapper"]}>
                <label className={styles["logo-label"]}>Logo</label>
                <label className={`${styles["project-logo"]} ${styles["editable-logo"]}`} style={{ cursor: 'pointer' }}>
                  {project.logo ? <img src={project.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }} /> : <FolderOpen size={40} color="#818cf8" />}
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setProject({ ...project, logo: reader.result as string }); }; reader.readAsDataURL(file); } }} style={{ display: 'none' }} />
                  <div className={styles["image-overlay-edit"]}><span>Change</span></div>
                </label>
              </div>
            ) : (
              <div className={styles["project-logo"]}>{project.logo ? <img src={project.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }} /> : <FolderOpen size={40} color="#818cf8" />}</div>
            )}
          </div>
          <div className={styles["project-info-section"]}>
            {isEditing ? (
              <>
                <div className={styles["edit-inline-form"]}>
                  <div className={styles["edit-row"]}>
                    <div className={`${styles["form-group-inline"]} ${styles["flex-1"]}`}>
                      <label>Project Name</label>
                      <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={styles["inline-input"]} />
                    </div>
                    <div className={styles["form-group-inline"]} style={{ width: '160px' }}>
                      <label>Status</label>
                      <div className={styles["status-select-wrapper"]}>
                        <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "active" | "inactive" })} className={styles["inline-select-dark"]}>
                          <option value="active">Active</option><option value="inactive">Inactive</option>
                        </select>
                        <ChevronDown size={14} className={styles["select-arrow"]} />
                      </div>
                    </div>
                  </div>
                  <div className={styles["form-group-inline"]}><label>Description</label><textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={styles["inline-textarea"]} rows={2} /></div>
                </div>
                <div className={styles["edit-actions-inline"]}>
                  <button className={`${styles["action-btn"]} ${styles["cancel"]}`} onClick={handleCancelEdit}><X size={16} /> Cancel</button>
                  <button className={`${styles["action-btn"]} ${styles["save"]}`} onClick={handleSaveEdit}><Save size={16} /> Save</button>
                </div>
              </>
            ) : (
              <>
                <div className={styles["project-name-row"]}>
                  <div className={styles["project-name-left"]}>
                    <h2>{project.name}</h2>
                    <span className={`${styles["status-badge"]} ${styles[project.status]}`}>{project.status === "active" ? "Active" : "Inactive"}</span>
                    <button className={styles["edit-icon-inline"]} onClick={() => setIsEditing(true)}><Pencil size={15} /></button>
                  </div>
                  <span className={styles["project-date-text"]}>Created on: {project.created}</span>
                </div>
                <p className={styles["project-id-text"]}>#{project.id}</p>
                {project.description && <p className={styles["project-desc-text"]}>{project.description}</p>}


              </>
            )}
          </div>
        </div>
        {/* Main Tabs */}
        <div className={styles["main-tabs-wrapper"]}>
          <button className={`${styles["main-tab"]} ${activeMainTab === 'environments' ? styles["active"] : ''}`} onClick={() => setActiveMainTab('environments')}>
            <Globe size={16} /> Environments
          </button>
          <button className={`${styles["main-tab"]} ${activeMainTab === 'tokens' ? styles["active"] : ''}`} onClick={() => setActiveMainTab('tokens')}>
            <Key size={16} /> Manage Token
          </button>
        </div>
      </div>

      {/* Content Section */}
      {activeMainTab === 'environments' ? (
        <div className={styles["environment-section-new"]}>
          {environments.length === 0 ? (
            <div className={styles["pc-simple-first-time"]}>
              <div className={styles["pc-simple-card"]}>
                <div className={styles["pc-card-icon"]}><Globe size={40} color="#6366f1" /></div>
                <h2>Configure Your Environment</h2>
                <p>Get started by creating an environment to manage SMS, Email & WhatsApp providers</p>
                <div className={styles["pc-card-steps"]}>
                  <div className={styles["pc-card-step"]}><span className={styles["pc-step-dot"]}>1</span><span>Choose an environment type</span></div>
                  <div className={styles["pc-card-step"]}><span className={styles["pc-step-dot"]}>2</span><span>Add providers for each service</span></div>
                  <div className={styles["pc-card-step"]}><span className={styles["pc-step-dot"]}>3</span><span>Start sending notifications</span></div>
                </div>
                <div className={styles["pc-simple-select-row"]}>
                  <div className={styles["custom-dropdown-wrapper"]} ref={dropdownRef}>
                    <div className={`${styles["custom-dropdown-trigger"]} ${dropdownOpen ? styles["open"] : ''}`} onClick={() => setDropdownOpen(!dropdownOpen)}>
                      <span className={newEnvName || isCustomEnv ? styles["selected-text"] : styles["placeholder-text"]}>{isCustomEnv ? 'Custom' : newEnvName || '-- Select Environment --'}</span>
                      <ChevronDown size={16} />
                    </div>
                    {dropdownOpen && (
                      <div className={styles["custom-dropdown-menu"]}>
                        {['Local', 'Dev', 'Staging', 'Live'].map(env => (
                          <div key={env} className={`${styles["custom-dropdown-item"]} ${newEnvName === env && !isCustomEnv ? styles["selected"] : ''}`} onClick={() => { setNewEnvName(env); setIsCustomEnv(false); setDropdownOpen(false); }}>
                            {getEnvIcon(env)} {env}{newEnvName === env && !isCustomEnv && <Check size={14} style={{ marginLeft: 'auto' }} />}
                          </div>
                        ))}
                        <div className={styles["custom-dropdown-divider"]}></div>
                        <div className={`${styles["custom-dropdown-item"]} ${isCustomEnv ? styles["selected"] : ''}`} onClick={() => { setIsCustomEnv(true); setNewEnvName(""); setDropdownOpen(false); }}>
                          <Wrench size={14} /> Custom{isCustomEnv && <Check size={14} />}
                        </div>
                      </div>
                    )}
                  </div>
                  {isCustomEnv && <input type="text" placeholder="Enter environment name" value={customEnvInput} onChange={e => setCustomEnvInput(e.target.value)} className={styles["pc-input"]} autoFocus />}
                  <button className={styles["pc-create-first-env-btn"]} onClick={handleAddEnvironment} disabled={(!isCustomEnv && !newEnvName) || (isCustomEnv && !customEnvInput.trim())}>
                    Create Environment <Rocket size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Environment Tabs with Sticky Add Button */}
              <div className={styles["env-tabs-container"]}>
                <div className={styles["env-tabs-wrapper"]}>
                  <div className={styles["env-tabs"]} ref={envTabsRef}>
                    {environments.map((env) => (
                      <div
                        key={env.public_id}
                        className={`${styles["env-tab"]} ${selectedEnv === env.environment_name ? styles["active"] : ''}`}
                        onClick={() => {
                          console.log("Clicked env:", env.environment_name);
                          console.log("env.public_id:", env.public_id);
                          setSelectedEnv(env.environment_name);
                          setProviders([]);
                          console.log("Calling loadProviders...");
                          loadProvidersForEnv(env);
                        }}
                      >
                        {editingTabEnv === env ? (
                          <div className={styles["env-tab-editing"]} onClick={e => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingTabName}
                              onChange={(e) => setEditingTabName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveTabEdit();
                                if (e.key === 'Escape') cancelTabEdit();
                              }}
                              className={styles["env-tab-edit-input"]}
                              autoFocus
                              style={{ width: `${Math.max(editingTabName.length * 10, 60)}px` }}
                            />
                            <button className={styles["env-tab-save-btn"]} onClick={saveTabEdit}>
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className={styles["env-tab-name"]} onDoubleClick={(e) => startEditingTab(env, e)}>
                              {env.environment_name}
                            </span>
                            <div className={styles["env-tab-menu"]} onClick={(e) => e.stopPropagation()}>
                              <button className={styles["env-menu-trigger"]} data-env-menu onClick={() => setOpenEnvMenu(openEnvMenu === env ? null : env)}>
                                <Settings size={14} />
                              </button>
                              {openEnvMenu === env && (
                                <div className={styles["env-menu-dropdown"]} ref={envMenuRef} data-env-menu>
                                  <button onClick={() => {
                                    setEditingTabEnv(env);
                                    setEditingTabName(env.environment_name);
                                    setOpenEnvMenu(null);
                                  }}>
                                    <Pencil size={14} /><span className={styles["env-menu-tooltip"]}>Edit</span>
                                  </button>
                                  <button onClick={() => { setCloneTarget(""); setCloneCustomMode(false); setShowCloneModal(true); setOpenEnvMenu(null); }}>
                                    <Copy size={14} /><span className={styles["env-menu-tooltip"]}>Clone</span>
                                  </button>
                                  <button onClick={() => { setShowUserPanel(true); setOpenEnvMenu(null); setUserSearchTerm(""); setSelectedUsers(new Set()); setSelectAll(false); setUserFilter("all"); fetchUsersForEnvironment(); }}>
                                    <User size={14} /><span className={styles["env-menu-tooltip"]}>Users</span>
                                  </button>
                                  <button onClick={() => {
                                    const sms = JSON.parse(localStorage.getItem(`env_${projectId}_${env.environment_name}_sms_providers`) || '{"providers":[]}');
                                    const email = JSON.parse(localStorage.getItem(`env_${projectId}_${env.environment_name}_email_providers`) || '{"providers":[]}');
                                    const wa = JSON.parse(localStorage.getItem(`env_${projectId}_${env.environment_name}_whatsapp_providers`) || '{"providers":[]}');
                                    const total = (sms.providers?.length || 0) + (email.providers?.length || 0) + (wa.providers?.length || 0);
                                    setDeletingEnvName(env);
                                    if (total > 0) setBlockedDeleteCounts({ sms: sms.providers?.length || 0, email: email.providers?.length || 0, whatsapp: wa.providers?.length || 0 });
                                    else setShowDeleteEnvModal(true);
                                    setOpenEnvMenu(null);
                                  }}>
                                    <Trash2 size={14} /><span className={styles["env-menu-tooltip"]}>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <button className={`${styles["pc-add-env-btn"]} ${styles["sticky-add-env"]}`} onClick={() => { setNewEnvName(""); setIsCustomEnv(false); setCustomEnvInput(""); setShowAddEnvModal(true); }}>
                    <Plus size={14} /> New Environment
                  </button>
                </div>
              </div>

              {/* Environment Content Container */}
              <div className={styles["env-content-container"]}>
                {/* Token Status Strip */}
                <div className={styles["token-status-strip"]}>
                  <span className={styles["token-status-title"]}><strong>{selectedEnv}</strong> Token Details -</span>

                  {/* Sandbox */}
                  <div className={styles["token-status-item"]}>
                    {(() => {
                      const sandboxToken = allTokens[`${selectedEnv}_Sandbox`];
                      const isExpiring = sandboxToken?.expiresInDays != null && sandboxToken.expiresInDays <= 7;
                      if (sandboxToken) {
                        return isExpiring ? (
                          <span className={`${styles["token-status-dot"]} ${styles["expiring"]}`}></span>
                        ) : (
                          <span className={`${styles["token-status-dot"]} ${styles["active"]}`}></span>
                        );
                      }
                      return <span className={`${styles["token-status-dot"]} ${styles["inactive"]}`}></span>;
                    })()}
                    <Wrench size={14} />
                    <span className={styles["token-status-name"]}>Sandbox</span>
                    {(() => {
                      const sandboxToken = allTokens[`${selectedEnv}_Sandbox`];
                      if (sandboxToken) {
                        return (
                          <span className={styles["token-status-expiry"]}>
                            {sandboxToken.name} · {calculateExpiryLabel(sandboxToken.expires, sandboxToken.expiresInDays)}
                          </span>
                        );
                      }
                      return (
                        <span className={styles["token-status-expiry"]} style={{ color: '#94a3b8' }}>Not generated yet</span>
                      );
                    })()}
                  </div>

                  <span className={styles["token-status-divider"]}>|</span>

                  {/* Live */}
                  <div className={styles["token-status-item"]}>
                    {(() => {
                      const liveToken = allTokens[`${selectedEnv}_Live`];
                      const isExpiring = liveToken?.expiresInDays != null && liveToken.expiresInDays <= 7;
                      if (liveToken) {
                        return isExpiring ? (
                          <span className={`${styles["token-status-dot"]} ${styles["expiring"]}`}></span>
                        ) : (
                          <span className={`${styles["token-status-dot"]} ${styles["active"]}`}></span>
                        );
                      }
                      return <span className={`${styles["token-status-dot"]} ${styles["inactive"]}`}></span>;
                    })()}
                    <Rocket size={14} />
                    <span className={styles["token-status-name"]}>Live</span>
                    {(() => {
                      const liveToken = allTokens[`${selectedEnv}_Live`];
                      if (liveToken) {
                        return (
                          <span className={styles["token-status-expiry"]}>
                            {liveToken.name} · {calculateExpiryLabel(liveToken.expires, liveToken.expiresInDays)}
                          </span>
                        );
                      }
                      return (
                        <span className={styles["token-status-expiry"]} style={{ color: '#94a3b8' }}>Not generated yet</span>
                      );
                    })()}
                  </div>
                  {/* Vertical Separator */}
                  <span className={styles["token-section-separator"]}></span>

                  {/* Active/Inactive Toggle */}
                  {/* Environment Status Toggle */}
                  <div className={styles["env-status-wrapper"]}>
                    <span className={styles["env-status-label"]}><strong>{selectedEnv}</strong> Environment is:</span>
                    <button
                      className={`${styles["env-status-toggle"]} ${(envStatus[selectedEnv] || 'active') === 'active' ? styles["status-active"] : styles["status-inactive"]}`}
                      onClick={() => {
                        const newStatus = (envStatus[selectedEnv] || 'active') === 'active' ? 'inactive' : 'active';
                        setPendingStatusChange({ env: selectedEnv, newStatus });
                        setShowStatusModal(true);
                      }}
                    >
                      <span className={styles["toggle-text"]}>{(envStatus[selectedEnv] || 'active').toUpperCase()}</span>
                      <span className={styles["toggle-icon"]}>
                        <svg viewBox="0 0 24 24">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>







                {/* Services Sidebar + Providers Panel */}
                <div className={styles["pc-main-content"]} style={{ padding: '0' }}>
                  <div className={styles["pc-sidebar-wrapper"]} style={{ padding: '16px 0 16px 16px' }}>
                    <div className={styles["pc-service-env-info"]}>

                      <span>Services</span>
                      <span className={styles["pc-separator-dash"]}>-</span>
                      <span className={styles["pc-service-label"]}>{activeService}</span>


                    </div>
                    <div className={styles["pc-sidebar"]}>
                      {SERVICE_TYPES.map((service) => (
                        <div
                          key={service}
                          className={`${styles["pc-sidebar-item"]} ${activeService === service ? styles["active"] : ''}`}
                          onClick={() => {
                            setActiveService(service);
                            setmodeFilter("Sandbox");
                            setProviders([]);
                            const env = environments.find((e: any) => e.environment_name === selectedEnv);
                            if (env && serviceData) {
                              const svc = serviceData.find((s: any) => s.name === service);
                              if (svc?.public_id && env?.public_id) {
                                getProvidersByEnvironmentId(env.public_id, svc.public_id)
                                  .then(res => {
                                    const data = res.data || {};
                                    const allProviders = [...(data.sandbox || []), ...(data.live || [])];
                                    const providerList = allProviders.map((p: any) => ({
                                      id: p.public_id || p.id,
                                      name: p.provider_name || p.name,
                                      fields: { ...(p.credentials || {}), mode: p.mode, endpoint: p.endpoint },
                                    }));
                                    setProviders(providerList);
                                    setServiceProviderCounts(prev => ({ ...prev, [service]: providerList.length }));
                                  })
                                  .catch(() => { });
                              }
                            }
                          }}
                          style={{
                            borderLeftColor: activeService === service ? SERVICE_COLORS[service] : 'transparent',
                            backgroundColor: activeService === service ? `${SERVICE_COLORS[service]}10` : 'transparent'
                          }}
                        >
                          <span className={styles["pc-sidebar-icon"]}>{SERVICE_ICONS[service]}</span>
                          <div className={styles["pc-sidebar-info"]}>
                            <div className={styles["pc-sidebar-name"]}>{service}</div>
                            <div className={styles["pc-sidebar-count"]}>{serviceProviderCounts[service] || 0} providers</div>
                          </div>
                          {activeService === service && (
                            <div className={styles["pc-sidebar-active-indicator"]} style={{ background: SERVICE_COLORS[service] }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles["pc-sidebar-wrapper"]} style={{ flex: 1, padding: '16px 16px 16px 0' }}>
                    <h4 className={`${styles["pc-column-label"]} ${styles["pc-column-label-providers"]}`}>Providers</h4>
                    <div className={styles["pc-providers-panel"]} style={{ borderTop: `3px solid ${SERVICE_COLORS[activeService]}` }}>
                      <div className={styles["pc-panel-header"]}>
                        <div className={styles["pc-panel-title"]}>{SERVICE_ICONS[activeService]}<h3>{activeService} Providers</h3></div>
                        <button
                          className={styles["pc-add-btn"]}
                          style={{ backgroundColor: SERVICE_COLORS[activeService] }}
                          onClick={async () => {
                            setEditingProvider(null);
                            setSelectedProvider("");
                            setProviderFields({});
                            setShowAddProviderModal(true);
                          }}
                        >
                          <Plus size={14} /> Add Provider
                        </button>
                      </div>
                      <div className={styles["pc-mode-tabs"]}>
                        <button className={`${styles["pc-mode-tab"]} ${modeFilter === 'Sandbox' ? `${styles["active"]} ${styles["sandbox"]}` : ''}`} onClick={() => setmodeFilter('Sandbox')}>
                          <Wrench size={14} /> Sandbox <span className={styles["pc-mode-tab-count"]}>{providers.filter(p => p.fields.mode === 'Sandbox').length}</span>
                        </button>
                        <button className={`${styles["pc-mode-tab"]} ${modeFilter === 'Live' ? `${styles["active"]} ${styles["live"]}` : ''}`} onClick={() => setmodeFilter('Live')}>
                          <Rocket size={14} /> Live <span className={styles["pc-mode-tab-count"]}>{providers.filter(p => p.fields.mode === 'Live').length}</span>
                        </button>
                      </div>
                      <div className={styles["pc-providers-list"]}>
                        {providersLoading && (
                          <div style={{ textAlign: 'center', padding: '12px', opacity: 0.7 }}>
                            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
                          </div>
                        )}
                        {!providersLoading && filteredProviders.length === 0 ? (
                          <div className={styles["pc-empty-state"]}>
                            <Server size={44} color="#cbd5e1" />
                            <h4>No {modeFilter} {activeService} providers yet</h4>
                            <p>Add your first {modeFilter.toLowerCase()} provider to start configuring services</p>
                          </div>
                        ) : (
                          filteredProviders.map((provider, index) => (
                            <div key={provider.id} className={`${styles["pc-provider-card"]} ${dragIndex === index ? styles["dragging"] : ''}`} style={{ borderLeftColor: SERVICE_COLORS[activeService] }}
                              draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, index)} onDragEnd={handleDragEnd}>
                              <div className={styles["pc-provider-card-header"]} onClick={() => setExpandedProviders(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}>
                                <div className={styles["pc-provider-title"]}>
                                  <Plug size={14} /><span>{provider.name.replace(/_/g, ' ')}</span>
                                  {index === 0 && <span className={styles["pc-primary-badge"]}><Rocket size={10} /> Primary</span>}
                                  <span className={styles["pc-configured-badge"]} style={{ background: `${SERVICE_COLORS[activeService]}15`, color: SERVICE_COLORS[activeService] }}><Check size={10} /> Configured</span>
                                </div>
                                <div className={styles["pc-provider-header-right"]}>
                                  <div className={styles["pc-endpoint-inline"]}>
                                    <code className={styles["pc-endpoint-text"]}>
                                      Endpoint URL : {provider.fields.endpoint || "------------------"}
                                    </code>
                                    {provider.fields.endpoint && (
                                      <button
                                        className={styles["pc-endpoint-copy-mini"]}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(provider.fields.endpoint);
                                          showToast("Endpoint copied!", "success");
                                        }}
                                      >
                                        <Copy size={12} />
                                      </button>
                                    )}
                                  </div>
                                  <div className={styles["pc-provider-actions"]} onClick={(e) => e.stopPropagation()}>
                                    <button
                                      className={styles["pc-edit-btn"]}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingProvider(provider);
                                        setSelectedProvider(provider.name);
                                        setProviderFields({ ...provider.fields });
                                        setShowAddProviderModal(true);
                                      }}
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button className={styles["pc-delete-btn"]} onClick={() => setShowDeleteProviderModal({ id: provider.id, name: provider.name })}><Trash2 size={14} /></button>
                                  </div>
                                </div>
                              </div>
                              {expandedProviders[provider.id] && (
                                <div className={styles["pc-provider-card-body"]}>
                                  {Object.entries(provider.fields)
                                    .filter(([key]) => key !== 'endpoint' && key !== 'id')
                                    .sort(([a], [b]) => a === 'mode' ? -1 : b === 'mode' ? 1 : 0)
                                    .map(([key, value]) => {
                                      const fc = PROVIDER_FIELDS_MAP[provider.name]?.find((f: any) => f.name === key);
                                      const isPwd = fc?.type === "password" || key.includes("Key") || key.includes("Token");
                                      const ismode = fc?.type === "select";
                                      const pk = `${provider.id}_${key}`;
                                      return (
                                        <div className={styles["pc-credential-row"]} key={key}>
                                          <span className={styles["pc-credential-label"]}>{ismode ? "Mode" : fc?.label || key}</span>
                                          {ismode ? (
                                            <span className={`${styles["pc-mode-badge"]} ${value === 'Live' ? styles["live"] : styles["sandbox"]}`}>{value === 'Live' ? <Rocket size={12} /> : <Wrench size={12} />}{value || "—"}</span>
                                          ) : (
                                            <>
                                              <span className={styles["pc-credential-value"]}>{isPwd ? (visiblePasswords[pk] ? value : "••••••••••") : value || "—"}</span>
                                              {isPwd && value && <button className={styles["pc-eye-btn-inline"]} onClick={() => setVisiblePasswords(prev => ({ ...prev, [pk]: !prev[pk] }))}>{visiblePasswords[pk] ? <FaEyeSlash size={14} /> : <FaEye size={14} />}</button>}
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
        <div className={styles["token-section-wrapper"]}>
          <div className={styles["form-card"]}>
            <div className={styles["form-header"]}><p>Manage API tokens for your environments</p><div className={styles["header-underline"]}></div></div>
            {environments.length > 0 && (
              <div className={styles["token-search-filter-row"]}>
                <div className={styles["token-search-bar"]}>
                  <div className={styles["search-input-group"]}>
                    <Search size={16} className={styles["search-icon"]} />
                    <input type="text" placeholder="Search environments..." value={tokenSearchTerm} onChange={(e) => setTokenSearchTerm(e.target.value)} className={styles["token-search-input"]} />
                    {tokenSearchTerm && <button className={styles["token-clear-btn"]} onClick={() => setTokenSearchTerm("")}><X size={14} />Clear</button>}
                  </div>
                </div>
              </div>
            )}
            <div className={styles["token-cards-grid"]}>
              {filteredTokens.length === 0 ? (
                <div className={styles["token-empty-illustration"]}>
                  {tokenSearchTerm.trim() ? (
                    <>
                      <img src={noDataIllustration} alt="No data" className={styles["empty-illustration-img"]} />
                      <h4>No results found</h4>
                      <p>Try adjusting your search term</p>
                    </>
                  ) : (
                    <>
                      <h4>No environments found</h4>
                      <p>Create an environment first to get started</p>
                      <button
                        className={styles["pc-create-first-env-btn"]}
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
                  const envName = env.environment_name || env;
                  const sandboxToken = allTokens[`${envName}_Sandbox`];
                  const liveToken = allTokens[`${envName}_Live`];
                  return (
                    <div key={env.public_id || envName} className={styles["token-env-card-full"]}>
                      <div className={styles["token-card-header"]}><Globe size={18} /><span className={styles["token-card-env-name"]}>{env.environment_name || env}</span></div>
                      <div className={styles["token-mode-buttons-row"]}>
                        <div className={styles["token-mode-card"]}>
                          {sandboxToken ? (
                            <div className={styles["mode-configured"]}>
                              <div className={styles["mode-configured-header"]}>
                                <div className={styles["mode-header-left"]}><Wrench size={16} /><span>Sandbox</span></div>
                                <div className={styles["mode-header-right"]}>
                                  <span className={`${styles["status-badge"]} ${styles["active"]}`}>Active</span>
                                  {sandboxToken.expiresInDays && sandboxToken.expiresInDays <= 7 && <span className={`${styles["status-badge"]} ${styles["expiring"]}`}>Expiring Soon</span>}
                                </div>
                              </div>
                              <div className={styles["mode-token-info"]}>
                                <div className={styles["mode-token-row"]}><Key size={12} /><span>{sandboxToken.name}</span></div>
                                <div className={styles["mode-token-row"]}><Calendar size={12} /><span>Created {formatDate(sandboxToken.created)}</span></div>
                                <div className={`${styles["mode-token-row"]} ${styles["token-expiry-row"]}`}>
                                  <div className={styles["expiry-left"]}><Clock size={12} /><span className={sandboxToken.expiresInDays && sandboxToken.expiresInDays <= 7 ? styles["expiring-soon"] : ''}>{calculateExpiryLabel(sandboxToken.expires, sandboxToken.expiresInDays)}</span></div>
                                  <div className={styles["mode-token-actions"]}>
                                    <button className={`${styles["token-action-btn"]} ${styles["regenerate"]}`} onClick={() => { setSelectedEnv(env.environment_name); setCurrentToken(sandboxToken); setShowRegenModal(true); }}><RefreshCw size={12} />Regenerate</button>
                                    <button className={`${styles["token-action-btn"]} ${styles["delete"]}`} onClick={() => { setSelectedEnv(env.environment_name); setCurrentToken(sandboxToken); setShowTokenDeleteModal(true); }}><Trash2 size={12} />Delete</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button className={`${styles["mode-generate-btn"]} ${styles["sandbox"]}`} onClick={() => { setSelectedEnv(env.environment_name); setTokenMode('Sandbox'); setTokenName(""); setTokenExpiration("30"); setTokenCustomDays(""); setTokenCustomDate(""); setIsRegenerating(false); setCurrentToken(null); setShowTokenFormModal(true); }}>
                              <Wrench size={18} /><span>Generate Sandbox Token</span><Plus size={16} />
                            </button>
                          )}
                        </div>
                        <div className={styles["token-mode-card"]}>
                          {liveToken ? (
                            <div className={styles["mode-configured"]}>
                              <div className={styles["mode-configured-header"]}>
                                <div className={styles["mode-header-left"]}><Globe size={16} /><span>Live</span></div>
                                <div className={styles["mode-header-right"]}>
                                  <span className={`${styles["status-badge"]} ${styles["active"]}`}>Active</span>
                                  {liveToken.expiresInDays && liveToken.expiresInDays <= 7 && <span className={`${styles["status-badge"]} ${styles["expiring"]}`}>Expiring Soon</span>}
                                </div>
                              </div>
                              <div className={styles["mode-token-info"]}>
                                <div className={styles["mode-token-row"]}><Key size={12} /><span>{liveToken.name}</span></div>
                                <div className={styles["mode-token-row"]}><Calendar size={12} /><span>Created {formatDate(liveToken.created)}</span></div>
                                <div className={`${styles["mode-token-row"]} ${styles["token-expiry-row"]}`}>
                                  <div className={styles["expiry-left"]}><Clock size={12} /><span className={liveToken.expiresInDays && liveToken.expiresInDays <= 7 ? styles["expiring-soon"] : ''}>{calculateExpiryLabel(liveToken.expires, liveToken.expiresInDays)}</span></div>
                                  <div className={styles["mode-token-actions"]}>
                                    <button className={`${styles["token-action-btn"]} ${styles["regenerate"]}`} onClick={() => { setSelectedEnv(env.environment_name); setCurrentToken(liveToken); setShowRegenModal(true); }}><RefreshCw size={12} />Regenerate</button>
                                    <button className={`${styles["token-action-btn"]} ${styles["delete"]}`} onClick={() => { setSelectedEnv(env.environment_name); setCurrentToken(liveToken); setShowTokenDeleteModal(true); }}><Trash2 size={12} />Delete</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button className={`${styles["mode-generate-btn"]} ${styles["live"]}`} onClick={() => { setSelectedEnv(env.environment_name); setTokenMode('Live'); setTokenName(""); setTokenExpiration("30"); setTokenCustomDays(""); setTokenCustomDate(""); setIsRegenerating(false); setCurrentToken(null); setShowTokenFormModal(true); }}>
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


      {/* Add Environment Modal */}
      {
        showAddEnvModal && (
          <div className={`${styles["pc-modal-overlay"]} ${styles["slide-panel"]}`}>
            <div className={styles["pc-modal"]} onClick={e => e.stopPropagation()}>
              <div className={styles["pc-modal-header"]}><h3><Plus size={18} /> Add Environment</h3><button className={styles["pc-modal-close"]} onClick={() => { setShowAddEnvModal(false); setNewEnvName(""); setIsCustomEnv(false); setCustomEnvInput(""); }}><X size={20} /></button></div>
              <div className={styles["pc-modal-body"]}>
                <p className={styles["pc-modal-desc"]}>Select an environment or create a custom one</p>
                <div className={styles["pc-env-options"]}>
                  {['Local', 'Dev', 'Staging', 'Live'].filter(
                    env =>
                      !environments.some(
                        (e: any) => e.environment_name === env
                      )
                  ).map(env => (
                    <div key={env} className={`${styles["pc-env-option"]} ${newEnvName === env && !isCustomEnv ? styles["selected"] : ''}`} onClick={() => { setNewEnvName(env); setIsCustomEnv(false); }}>
                      <span className={styles["pc-env-option-icon"]}>{getEnvIcon(env)}</span><span>{env}</span>{newEnvName === env && !isCustomEnv && <Check size={18} />}
                    </div>
                  ))}
                  <div className={`${styles["pc-env-option"]} ${styles["custom"]} ${isCustomEnv ? styles["selected"] : ''}`} onClick={() => { setIsCustomEnv(true); setNewEnvName(""); }}>
                    <span className={styles["pc-env-option-icon"]}><Wrench size={18} /></span><span>Custom Environment</span>{isCustomEnv && <Check size={18} />}
                  </div>
                </div>
                {isCustomEnv && <div className={styles["pc-form-group"]}><label>Environment Name *</label><input type="text" placeholder="e.g., Production" value={customEnvInput} onChange={(e) => setCustomEnvInput(e.target.value)} className={styles["pc-input"]} autoFocus /></div>}
              </div>
              <div className={styles["pc-modal-footer"]}>
                <button className={styles["pc-btn-cancel"]} onClick={() => {
                  setPendingCloseAction(() => () => { setShowAddProviderModal(false); setEditingProvider(null); });
                  setShowUnsavedModal(true);
                }}>
                  Cancel
                </button>
                <button
                  className={styles["pc-btn-primary"]}
                  onClick={saveProvider}
                  disabled={saving}
                  style={{ backgroundColor: SERVICE_COLORS[activeService], border: 'none' }}
                >
                  {saving ? 'Saving...' : editingProvider ? 'Update Provider' : 'Add Provider'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Environment Modal */}
      {
        showEditEnvModal && (
          <div className={`${styles["pc-modal-overlay"]} ${styles["slide-panel"]}`}>
            <div className={`${styles["pc-modal"]} ${styles["pc-modal-small"]}`} onClick={e => e.stopPropagation()}>
              <div className={styles["pc-modal-header"]}><h3>Edit Environment</h3><button className={styles["pc-modal-close"]} onClick={() => { setPendingCloseAction(() => () => setShowEditEnvModal(false)); setShowUnsavedModal(true); }}><X size={18} /></button></div>
              <div className={styles["pc-modal-body"]}><div className={styles["pc-form-group"]}><label>Environment Name</label><input type="text" className={styles["pc-input"]} value={editEnvName} onChange={(e) => setEditEnvName(e.target.value)} /></div></div>
              <div className={styles["pc-modal-footer"]}>
                <button className={styles["pc-btn-cancel"]} onClick={() => { setPendingCloseAction(() => () => setShowEditEnvModal(false)); setShowUnsavedModal(true); }}>Cancel</button>
                <button className={styles["pc-btn-primary"]} onClick={handleEditEnvironment}>Save Changes</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Clone Modal */}
      {
        showCloneModal && (
          <div className={`${styles["pc-modal-overlay"]} ${styles["slide-panel"]}`}>
            <div className={styles["pc-modal"]} onClick={e => e.stopPropagation()}>
              <div className={styles["pc-modal-header"]}><h3><Copy size={18} /> Clone Environment</h3><button className={styles["pc-modal-close"]} onClick={() => setShowCloneModal(false)}><X size={20} /></button></div>
              <div className={styles["pc-modal-body"]}>
                <div className={styles["clone-source-info"]}><label>Source Environment</label><div className={styles["clone-source-name"]}>{getEnvIcon(selectedEnv)} {selectedEnv}</div></div>
                <div className={styles["pc-form-group"]}><label>Select Target Environment</label>
                  <div className={styles["pc-env-options"]}>
                    {['Local', 'Dev', 'Staging', 'Live'].filter(env => env !== selectedEnv && !environments.includes(env)).map(env => (
                      <div key={env} className={`${styles["pc-env-option"]} ${cloneTarget === env && !cloneCustomMode ? styles["selected"] : ''}`} onClick={() => { setCloneTarget(env); setCloneCustomMode(false); }}>
                        <span className={styles["pc-env-option-icon"]}>{getEnvIcon(env)}</span><span>{env}</span>{cloneTarget === env && !cloneCustomMode && <Check size={18} />}
                      </div>
                    ))}
                    <div className={`${styles["pc-env-option"]} ${styles["custom"]} ${cloneCustomMode ? styles["selected"] : ''}`} onClick={() => { setCloneCustomMode(true); setCloneTarget(""); }}>
                      <span className={styles["pc-env-option-icon"]}><Wrench size={18} /></span><span>Custom Environment</span>{cloneCustomMode && <Check size={18} />}
                    </div>
                  </div>
                </div>
                {cloneCustomMode && <div className={styles["pc-form-group"]}><label>Custom Environment Name *</label><input type="text" placeholder="Enter environment name" value={cloneCustomName} onChange={(e) => setCloneCustomName(e.target.value)} className={styles["pc-input"]} autoFocus /></div>}
              </div>
              <div className={styles["pc-modal-footer"]}>
                <button className={styles["pc-btn-cancel"]} onClick={() => setShowCloneModal(false)}>Cancel</button>
                <button className={styles["pc-btn-primary"]} onClick={executeClone} disabled={(!cloneCustomMode && !cloneTarget) || (cloneCustomMode && !cloneCustomName.trim())}>Clone Environment</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Add/Edit Provider Modal */}
      {
        showAddProviderModal && (
          <div className={`${styles["pc-modal-overlay"]} ${styles["slide-panel"]}`}>
            <div className={`${styles["pc-modal"]} ${styles["pc-modal-provider"]}`} onClick={e => e.stopPropagation()}>
              <div className={styles["pc-modal-header"]}>
                <div className={styles["pc-modal-header-left"]}>
                  <span className={styles["pc-modal-service-badge"]} style={{ backgroundColor: `${SERVICE_COLORS[activeService]}15`, color: SERVICE_COLORS[activeService], border: `1px solid ${SERVICE_COLORS[activeService]}40` }}>{SERVICE_ICONS[activeService]}<span>{activeService}</span></span>
                  <h3>{editingProvider ? 'Edit Provider' : 'Add Provider'}</h3>
                </div>
                <button className={styles["pc-modal-close"]} onClick={() => { setPendingCloseAction(() => () => { setShowAddProviderModal(false); setEditingProvider(null); }); setShowUnsavedModal(true); }}><X size={20} /></button>
              </div>
              <div className={styles["pc-modal-env-info-row"]}>
                <div className={styles["pc-modal-env-info"]}>
                  <Globe size={14} />
                  <span>Environment: <strong>{selectedEnv}</strong></span>
                </div>
                {!editingProvider && (
                  <div className={styles["pc-modal-mode-info"]}>
                    <span className={`${styles["pc-mode-badge"]} ${modeFilter === 'Live' ? styles["live"] : styles["sandbox"]}`}>
                      {modeFilter === 'Live' ? <Rocket size={14} /> : <Wrench size={14} />}
                      {modeFilter} Mode
                    </span>
                  </div>
                )}
              </div>
              <div className={styles["pc-modal-body"]}>
                <div className={styles["pc-form-group"]}><label>Select Provider *</label>
                  <select value={selectedProvider} onChange={handleProviderChange} className={styles["pc-select"]} disabled={!!editingProvider}>
                    <option value="">-- Choose provider --</option>
                    {providersList
                      .filter((p: any) => {
                        // Always show if editing this provider
                        if (editingProvider?.name === p.name) return true;

                        // Check if this provider already exists in current mode
                        const existsInCurrentMode = providers.some(
                          (prov) => prov.name === p.name && prov.fields.mode === modeFilter
                        );

                        // Hide if already configured in this mode
                        if (existsInCurrentMode) return false;

                        return true;
                      })
                      .map((p: any) => (
                        <option key={p.public_id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
                {selectedProvider && (() => {
                  const shortName = selectedProvider.replace(" SMS", "").replace(" Email", "").replace(" WhatsApp", "");
                  const schema = PROVIDER_FIELDS_MAP[selectedProvider] || PROVIDER_FIELDS_MAP[shortName];

                  if (!schema) return null;

                  return (
                    <div className={styles["pc-credentials-section"]}>
                      <h4><Lock size={14} /> Credentials</h4>
                      {schema.filter((f: any) => f.type !== "select" && f.type !== "endpoint").map((field: any) => (
                        <div className={styles["pc-form-group"]} key={field.name}>
                          <label>{field.label}{field.required && " *"}</label>
                          <div className={styles["pc-input-wrapper"]}>
                            <input
                              type={field.type === "password" && !showPasswords[field.name] ? "password" : "text"}
                              value={providerFields[field.name] || ""}
                              onChange={(e) => handleFieldChange(field.name, e.target.value)}
                              placeholder={`Enter ${field.label}`}
                              className={styles["pc-input"]}
                            />
                            {field.type === "password" && (
                              <button type="button" className={styles["pc-eye-btn"]} onClick={() => togglePasswordVisibility(field.name)}>
                                {showPasswords[field.name] ? <FaEyeSlash /> : <FaEye />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <div className={styles["pc-modal-footer"]}>
                <button
                  className={styles["pc-btn-cancel"]}
                  onClick={() => {
                    setPendingCloseAction(() => () => { setShowAddProviderModal(false); setEditingProvider(null); });
                    setShowUnsavedModal(true);
                  }}
                >
                  Cancel
                </button>
                <button
                  className={styles["pc-btn-primary"]}
                  onClick={saveProvider}
                  disabled={saving}
                  style={{ backgroundColor: SERVICE_COLORS[activeService], border: 'none' }}
                >
                  {saving ? 'Saving...' : editingProvider ? 'Update Provider' : 'Add Provider'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Environment Modal */}
      {
        showDeleteEnvModal && (
          <div className={styles["pc-modal-overlay"]} onClick={() => setShowDeleteEnvModal(false)}>
            <div className={`${styles["pc-modal"]} ${styles["pc-modal-small"]}`} onClick={e => e.stopPropagation()}><div className={styles["pc-modal-header"]}><h3>Delete Environment</h3><button className={styles["pc-modal-close"]} onClick={() => setShowDeleteEnvModal(false)}><X size={18} /></button></div><div className={styles["pc-modal-body"]}><p>Are you sure you want to delete <strong>{deletingEnvName}</strong> environment?</p><div className={styles["warning-text"]}>This action cannot be undone.</div></div><div className={styles["pc-modal-footer"]}><button className={styles["pc-btn-cancel"]} onClick={() => setShowDeleteEnvModal(false)}>Cancel</button><button className={styles["pc-btn-danger"]} onClick={handleDeleteEnvironment}>Delete</button></div></div>
          </div>
        )
      }

      {/* Cannot Delete Modal */}
      {
        deletingEnvName && (blockedDeleteCounts.sms > 0 || blockedDeleteCounts.email > 0 || blockedDeleteCounts.whatsapp > 0) && (
          <div className={styles["pc-modal-overlay"]} onClick={() => { setDeletingEnvName(""); setBlockedDeleteCounts({ sms: 0, email: 0, whatsapp: 0 }); }}>
            <div className={`${styles["pc-modal"]} ${styles["pc-modal-small"]}`} onClick={e => e.stopPropagation()}><div className={styles["pc-modal-header"]}><h3><AlertTriangle size={18} /> Cannot Delete</h3><button className={styles["pc-modal-close"]} onClick={() => { setDeletingEnvName(""); setBlockedDeleteCounts({ sms: 0, email: 0, whatsapp: 0 }); }}><X size={18} /></button></div><div className={styles["pc-modal-body"]}><p>Environment <strong>"{deletingEnvName}"</strong> cannot be deleted because providers are still configured.</p><div className={styles["provider-summary"]}>{blockedDeleteCounts.sms > 0 && <div className={styles["summary-item"]}>SMS: {blockedDeleteCounts.sms}</div>}{blockedDeleteCounts.email > 0 && <div className={styles["summary-item"]}>Email: {blockedDeleteCounts.email}</div>}{blockedDeleteCounts.whatsapp > 0 && <div className={styles["summary-item"]}>WhatsApp: {blockedDeleteCounts.whatsapp}</div>}</div><p className={styles["warning-text"]}>Remove all providers before deleting this environment.</p></div><div className={styles["pc-modal-footer"]}><button className={styles["pc-btn-cancel"]} onClick={() => { setDeletingEnvName(""); setBlockedDeleteCounts({ sms: 0, email: 0, whatsapp: 0 }); }}>Close</button></div></div>
          </div>
        )
      }

      {/* Delete Provider Modal */}
      {
        showDeleteProviderModal && (
          <div className={styles["pc-modal-overlay"]} onClick={() => setShowDeleteProviderModal(null)}>
            <div className={`${styles["pc-modal"]} ${styles["pc-modal-small"]}`} onClick={e => e.stopPropagation()}><div className={styles["pc-modal-header"]}><h3><Trash2 size={18} /> Delete Provider</h3><button className={styles["pc-modal-close"]} onClick={() => setShowDeleteProviderModal(null)}><X size={20} /></button></div><div className={styles["pc-modal-body"]}><p>Are you sure you want to delete <strong>{showDeleteProviderModal.name.replace(/_/g, ' ')}</strong>?</p><p className={styles["pc-warning-text"]}>This action cannot be undone.</p></div><div className={styles["pc-modal-footer"]}><button className={styles["pc-btn-cancel"]} onClick={() => setShowDeleteProviderModal(null)}>Cancel</button><button className={styles["pc-btn-danger"]} onClick={deleteProviderHandler}>Delete</button></div></div>
          </div>
        )
      }

      {/* Unsaved Changes Modal */}
      {
        showUnsavedModal && (
          <div className={styles["pc-modal-overlay"]} onClick={() => setShowUnsavedModal(false)}>
            <div className={`${styles["pc-modal"]} ${styles["pc-modal-small"]}`} onClick={e => e.stopPropagation()}>
              <div className={styles["pc-modal-header"]}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AlertTriangle size={22} color="#f59e0b" />
                  <h3 style={{ margin: 0 }}>Discard Changes?</h3>
                </div>
              </div>
              <div className={styles["pc-modal-body"]}>
                <p>You have unsaved changes. If you leave now, your entered credentials will be lost.</p>
                <div className={styles["warning-text"]}><AlertTriangle size={14} /> This action cannot be undone.</div>
              </div>
              <div className={styles["pc-modal-footer"]}>
                <button className={styles["pc-btn-cancel"]} onClick={() => setShowUnsavedModal(false)}>Continue Editing</button>
                <button className={styles["pc-btn-danger"]} onClick={() => { setShowUnsavedModal(false); if (pendingCloseAction) pendingCloseAction(); setPendingCloseAction(null); }}><Trash2 size={16} /> Discard Changes</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Token Generate Form Modal */}
      {
        showTokenFormModal && (
          <div className={`${styles["pc-modal-overlay"]} ${styles["slide-panel"]}`}>
            <div className={`${styles["pc-modal"]} ${styles["token-form-modal"]}`} onClick={e => e.stopPropagation()}>
              <div className={styles["pc-modal-header"]}><h3>{isRegenerating ? 'Regenerate Token' : 'Generate Token'}</h3><button className={styles["pc-modal-close"]} onClick={() => setShowTokenFormModal(false)}><X size={20} /></button></div>
              <div className={styles["pc-modal-body"]}>
                <div className={styles["modal-token-info"]}>
                  <div><Globe size={14} /> Environment: <strong>{selectedEnv}</strong></div>
                  <div>{tokenMode === 'Sandbox' ? <Wrench size={14} /> : <Rocket size={14} />} Mode: <strong>{tokenMode}</strong></div>
                </div>
                <div className={styles["pc-form-group"]}><label>Note</label><input type="text" placeholder="What's this token for?" value={tokenName} onChange={(e) => setTokenName(e.target.value)} className={styles["pc-input"]} autoFocus /></div>
                <div className={styles["pc-form-group"]}><label>Expiration</label>
                  <div className={styles["expiration-options"]}>
                    {[{ value: "7", label: "7 Days" }, { value: "30", label: "30 Days" }, { value: "60", label: "60 Days" }, { value: "90", label: "90 Days" }, { value: "custom", label: "Custom" }, { value: "never", label: "Never" }].map(opt => (
                      <div key={opt.value} className={`${styles["expiration-option"]} ${tokenExpiration === opt.value ? styles["active"] : ''}`} onClick={() => setTokenExpiration(opt.value)}>
                        <div className={styles["expiration-label"]}>{opt.label}</div>
                        <div className={styles["expiration-date"]}>{opt.value === "never" ? "—" : opt.value === "custom" ? (tokenCustomDate ? formatDate(tokenCustomDate) : "Pick a date") : getExpiryDate(opt.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {tokenExpiration === "custom" && (
                  <div className={styles["pc-form-group"]}><label>Select Expiry Date</label>
                    <div className={styles["token-date-wrapper"]} onClick={() => { if (tokenDateRef.current) tokenDateRef.current.showPicker(); }}>
                      <input type="date" value={tokenCustomDate} onChange={(e) => { setTokenCustomDate(e.target.value); const now = new Date(); const expiry = new Date(e.target.value); const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)); setTokenCustomDays(String(diffDays > 0 ? diffDays : 1)); }} ref={tokenDateRef} className={`${styles["pc-input"]} ${styles["token-date-input"]}`} min={new Date().toISOString().split('T')[0]} />
                      <Calendar className={styles["token-date-icon"]} size={16} />
                    </div>
                  </div>
                )}
                <div className={styles["token-warning"]}><AlertTriangle size={16} /><span>The token will only be shown once after creation.</span></div>
              </div>
              <div className={styles["pc-modal-footer"]}>
                <button className={styles["pc-btn-cancel"]} onClick={() => setShowTokenFormModal(false)}>Cancel</button>
                <button className={styles["pc-btn-primary"]} onClick={handleTokenGenerate} disabled={!tokenName.trim() || !tokenMode}>{isRegenerating ? 'Regenerate Token' : 'Generate Token'}</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Token Reveal Modal */}
      {
        generatedToken && (
          <div className={styles["pc-modal-overlay"]}>
            <div className={`${styles["pc-modal"]} ${styles["token-reveal-modal"]}`} onClick={e => e.stopPropagation()}>
              <div className={styles["reveal-success"]}><Check size={20} /> Token Generated!</div>
              <div className={styles["reveal-warning-box"]}><AlertTriangle size={18} /><div><strong>SAVE THIS TOKEN NOW</strong><p>This token will NOT be shown again.</p></div></div>
              <div className={styles["reveal-token-box"]}>
                <div className={styles["reveal-token-row"]}>
                  <div className={styles["reveal-token-value"]}>{generatedToken.token}</div>
                  <button className={`${styles["btn-copy-inline"]} ${copied ? styles["copied"] : ''}`} onClick={() => { navigator.clipboard.writeText(generatedToken.token); setCopied(true); setTimeout(() => setCopied(false), 3000); }}>
                    {copied ? <><Check size={14} />Copied!</> : <><Copy size={14} />Copy</>}
                  </button>
                </div>
                <div className={styles["reveal-token-meta"]}>
                  <div><Globe size={14} />{generatedToken.environmentName}</div>
                  <div><Calendar size={14} />{generatedToken.name} · {formatDate(generatedToken.created)}</div>
                  <div><Clock size={14} />Expires: {formatDate(generatedToken.expires)}</div>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <button className={styles["pc-btn-primary"]} onClick={() => setShowTokenLeaveModal(true)}>
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
          <div className={styles["pc-modal-overlay"]} onClick={() => setShowRegenModal(false)}>
            <div className={`${styles["pc-modal"]} ${styles["pc-modal-small"]}`} onClick={e => e.stopPropagation()}><div className={styles["pc-modal-header"]}><RefreshCw size={22} color="#6366f1" /><h3>Regenerate Token?</h3></div><div className={styles["pc-modal-body"]}><div className={styles["modal-token-info"]}><div><Globe size={14} /> Environment: <strong>{selectedEnv}</strong></div>{currentToken && <><div><Key size={14} /> Token: <strong>{currentToken.name}</strong></div><div><Calendar size={14} /> Created: {formatDate(currentToken.created)}</div></>}</div><p className={styles["warning-text"]}>Regenerating will revoke the old token.</p></div><div className={styles["pc-modal-footer"]}><button className={styles["pc-btn-cancel"]} onClick={() => setShowRegenModal(false)}>Cancel</button><button className={styles["pc-btn-primary"]} onClick={async () => {
              try {
                if (!currentToken?.id) return;

                const res = await regenerateApiKey(currentToken.id);

                const tokenData = res.data;

                const token: ApiToken = {
                  id: tokenData.public_id,
                  name: tokenData.name,
                  token: tokenData.api_key,
                  projectId: projectId || "",
                  environmentName: tokenData.environment_name,
                  mode: tokenData.mode,
                  created: tokenData.created_at,
                  expires: tokenData.expires_at,
                  expiresInDays: tokenData.expires_in_days,
                  revealed: false,
                };

                setAllTokens((prev) => ({
                  ...prev,
                  [`${token.environmentName}_${token.mode}`]: token,
                }));

                setGeneratedToken(token);

                setShowRegenModal(false);

                showToast("Token regenerated successfully", "success");

              } catch (error) {
                console.error(error);

                showToast("Failed to regenerate token", "error");
              }
            }}>Continue</button></div></div>
          </div>
        )
      }

      {/* Delete Token Confirm Modal */}
      {
        showTokenDeleteModal && (
          <div className={styles["pc-modal-overlay"]} onClick={() => setShowTokenDeleteModal(false)}>
            <div className={`${styles["pc-modal"]} ${styles["pc-modal-small"]}`} onClick={e => e.stopPropagation()}><div className={styles["pc-modal-header"]}><Trash2 size={22} color="#ef4444" /><h3>Delete Token?</h3></div><div className={styles["pc-modal-body"]}><div className={styles["modal-token-info"]}><div><Globe size={14} /> Environment: <strong>{selectedEnv}</strong></div>{currentToken && <><div><Key size={14} /> Token: <strong>{currentToken.name}</strong></div><div><Calendar size={14} /> Created: {formatDate(currentToken.created)}</div></>}</div><p className={styles["warning-text"]}>This will permanently revoke API access.</p></div><div className={styles["pc-modal-footer"]}><button className={styles["pc-btn-cancel"]} onClick={() => setShowTokenDeleteModal(false)}>Cancel</button><button className={styles["pc-btn-primary"]} onClick={handleTokenDelete} style={{ background: '#ef4444' }}>Delete Token</button></div></div>
          </div>
        )
      }

      {/* User Assignment Panel */}
      {
        showUserPanel && (
          <div className={styles["user-panel-overlay"]} onClick={() => setShowUserPanel(false)}>
            <div className={styles["user-panel"]} onClick={e => e.stopPropagation()}>
              <div className={styles["user-panel-header"]}><div className={styles["user-panel-header-left"]}><User size={20} /><h3>Manage Users - {selectedEnv}</h3></div><button className={styles["user-panel-close"]} onClick={() => setShowUserPanel(false)}><X size={20} /></button></div>
              <div className={styles["user-panel-tabs"]}>
                <button className={`${styles["user-panel-tab"]} ${userActiveTab === 'assign' ? styles["active"] : ''}`} onClick={() => { setUserActiveTab('assign'); setSelectedUsers(new Set()); setSelectAll(false); }}><UserPlus size={14} /> Assign User</button>
                <button className={`${styles["user-panel-tab"]} ${userActiveTab === 'unassign' ? styles["active"] : ''}`} onClick={() => { setUserActiveTab('unassign'); setSelectedUsers(new Set()); setSelectAll(false); }}><UserMinus size={14} /> Unassign User</button>
              </div>
              <div className={styles["user-panel-search-row"]}>
                <div className={styles["user-panel-search"]}>
                  <Search size={16} className={styles["user-panel-search-icon"]} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className={styles["user-panel-search-input"]}
                  />
                  {userSearchTerm && (
                    <button className={styles["user-panel-search-clear"]} onClick={() => setUserSearchTerm("")}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Replace the select with this custom dropdown */}
                <div className={styles["user-panel-filter-wrapper"]} ref={userFilterRef}>
                  <div
                    className={`${styles["user-panel-filter-trigger"]} ${userFilterDropdownOpen ? styles["open"] : ''}`}
                    onClick={() => setUserFilterDropdownOpen(!userFilterDropdownOpen)}
                  >
                    <div className={styles["filter-trigger-left"]}>
                      <Filter size={14} className={styles["filter-icon"]} />
                      <span className={styles["filter-selected-text"]}>
                        {userFilter === 'all' ? 'All Status' : userFilter === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <ChevronDown size={16} className={styles["filter-chevron"]} />
                  </div>
                  {userFilterDropdownOpen && (
                    <div className={styles["user-panel-filter-menu"]}>
                      <div
                        className={`${styles["user-panel-filter-item"]} ${userFilter === 'all' ? styles["selected"] : ''}`}
                        onClick={() => {
                          setUserFilter('all');
                          setUserFilterDropdownOpen(false);
                        }}
                      >
                        <span>All Status</span>
                        {userFilter === 'all' && <Check size={14} />}
                      </div>
                      <div
                        className={`${styles["user-panel-filter-item"]} ${userFilter === 'active' ? styles["selected"] : ''}`}
                        onClick={() => {
                          setUserFilter('active');
                          setUserFilterDropdownOpen(false);
                        }}
                      >
                        <div className={`${styles["filter-item-dot"]} ${styles["active"]}`}></div>
                        <span>Active</span>
                        {userFilter === 'active' && <Check size={14} />}
                      </div>
                      <div
                        className={`${styles["user-panel-filter-item"]} ${userFilter === 'inactive' ? styles["selected"] : ''}`}
                        onClick={() => {
                          setUserFilter('inactive');
                          setUserFilterDropdownOpen(false);
                        }}
                      >
                        <div className={`${styles["filter-item-dot"]} ${styles["inactive"]}`}></div>
                        <span>Inactive</span>
                        {userFilter === 'inactive' && <Check size={14} />}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles["user-panel-table-wrapper"]}>
                <table className={styles["user-panel-table"]}><thead><tr><th className={styles["col-checkbox"]}><input type="checkbox" checked={selectAll} onChange={handleSelectAll} className={styles["user-checkbox"]} /></th><th className={styles["col-user"]} style={{ textAlign: 'center' }}>User</th><th className={styles["col-status"]}>Status</th></tr></thead>

                  <tbody>
                    {filteredUserList.length === 0 ? (
                      <tr>
                        <td colSpan={3} className={styles["user-empty-state"]}>
                          {userSearchTerm.trim() ? (
                            <>
                              <img
                                src={noDataIllustration}
                                alt="No data"
                                className={styles["user-empty-illustration-img"]}
                              />
                              <div className={styles["user-empty-message"]}>
                                <h4>No results found</h4>
                                <p>Try adjusting your search term</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <img
                                src={noDataIllustration}
                                alt="No data"
                                className={styles["user-empty-illustration-img"]}
                              />
                              <div className={styles["user-empty-message"]}>
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
                        <tr key={user.id} className={selectedUsers.has(user.id) ? styles["selected"] : ''}>
                          <td className={styles["col-checkbox"]}><input type="checkbox" checked={selectedUsers.has(user.id)} onChange={() => handleUserSelect(user.id)} className={styles["user-checkbox"]} /></td>
                          <td className={styles["col-user"]}><div className={styles["user-cell"]}><span className={styles["user-name"]}>{user.name}</span><span className={styles["user-email"]}>{user.email}</span></div></td>
                          <td className={styles["col-status"]}><span className={`${styles["user-status-badge"]} ${styles[user.status]}`}>
                            {user.status === 'active' ? <Check size={12} /> : <AlertCircle size={12} />}
                            {user.status}
                          </span></td>
                        </tr>
                      )))}
                  </tbody>
                </table>
              </div>
              <div className={styles["user-panel-footer"]}>
                <button
                  className={styles["user-panel-action-btn"]}
                  onClick={userActiveTab === 'assign' ? handleUnassignUsers : handleAssignUsers}
                  disabled={selectedUsers.size === 0}
                  style={{ background: userActiveTab === 'assign' ? '#ef4444' : '#6366f1' }}
                >
                  {userActiveTab === 'assign' ? (
                    <><UserMinus size={16} /> Unassign Selected ({selectedUsers.size})</>
                  ) : (
                    <><UserPlus size={16} /> Assign Selected ({selectedUsers.size})</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Token Leave Confirmation Modal */}
      {
        showTokenLeaveModal && (
          <div className={styles["pc-modal-overlay"]} onClick={() => setShowTokenLeaveModal(false)}>
            <div className={`${styles["pc-modal"]} ${styles["pc-modal-small"]}`} onClick={e => e.stopPropagation()}>
              <div className={styles["pc-modal-header"]}>
                <AlertTriangle size={22} color="#f59e0b" />
                <h3>Leave Token Page?</h3>
              </div>
              <div className={styles["pc-modal-body"]}>
                <p>Have you copied and saved this token?</p>
                <div className={styles["warning-text"]}>
                  <AlertTriangle size={14} /> This token will not be shown again after leaving this page.
                </div>
              </div>
              <div className={styles["pc-modal-footer"]}>
                <button className={styles["pc-btn-cancel"]} onClick={() => setShowTokenLeaveModal(false)}>Stay Here</button>
                <button className={styles["pc-btn-danger"]} onClick={() => {
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
        <div className={styles["pc-modal-overlay"]} onClick={() => setShowStatusModal(false)}>
          <div className={`${styles["pc-modal"]} ${styles["pc-modal-small"]}`} onClick={e => e.stopPropagation()}>
            <div className={styles["pc-modal-header"]}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={22} color="#f59e0b" />
                <h3 style={{ margin: 0 }}>
                  {pendingStatusChange.newStatus === 'active' ? 'Activate' : 'Deactivate'} Environment?
                </h3>
              </div>
            </div>
            <div className={styles["pc-modal-body"]}>
              <p>
                Are you sure you want to <strong>{pendingStatusChange.newStatus === 'active' ? 'activate' : 'deactivate'}</strong> the <strong>{pendingStatusChange.env}</strong> environment?
              </p>
              {pendingStatusChange.newStatus === 'inactive' && (
                <div className={styles["warning-text"]}>
                  <AlertTriangle size={14} /> Deactivating this environment may affect running services.
                </div>
              )}
            </div>
            <div className={styles["pc-modal-footer"]}>
              <button className={styles["pc-btn-cancel"]} onClick={() => {
                setShowStatusModal(false);
                setPendingStatusChange(null);
              }}>Cancel</button>
              <button
                className={pendingStatusChange.newStatus === 'active' ? styles["pc-btn-primary"] : styles["pc-btn-danger"]}
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