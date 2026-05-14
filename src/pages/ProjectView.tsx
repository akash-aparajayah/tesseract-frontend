import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/ProjectView.css";
import {
  Pencil, FolderOpen, Plus, MessageSquare, Mail, MessageCircle, Plug, Check,
  Save, X, ChevronDown, Server, Copy, Trash2, Globe, Rocket, Wrench,
  Search, Lock, AlertTriangle, Home, Monitor, Key,
  User,
  UserMinus,
  UserPlus,
  AlertCircle,
} from 'lucide-react';

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

const PROVIDER_FIELDS_MAP: Record<string, { name: string; label: string; type: string; required?: boolean }[]> = {
  // SMS Providers
  MSG91: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "apiKey", label: "API Key", type: "password", required: true },
    { name: "endpoint", label: "Endpoint URL", type: "text", required: false },
    { name: "senderId", label: "Sender ID", type: "text", required: true },
    { name: "templateId", label: "Template ID (DLT)", type: "text", required: true },
  ],
  Twilio: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "accountSid", label: "Account SID", type: "text", required: true },
    { name: "authToken", label: "Auth Token", type: "password", required: true },
    { name: "phoneNumber", label: "Phone Number", type: "text", required: true },
  ],
  Gupshup: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "apiKey", label: "API Key", type: "password", required: true },
    { name: "appName", label: "App Name", type: "text", required: true },
    { name: "sourceNumber", label: "Source Number", type: "text", required: true },
  ],
  Vonage: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "apiKey", label: "API Key", type: "text", required: true },
    { name: "apiSecret", label: "API Secret", type: "password", required: true },
    { name: "fromNumber", label: "From Number", type: "text", required: true },
  ],
  Kaleyra: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "apiKey", label: "API Key", type: "password", required: true },
    { name: "sid", label: "SID", type: "text", required: true },
    { name: "senderId", label: "Sender ID", type: "text", required: true },
  ],
  Textlocal: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "apiKey", label: "API Key", type: "password", required: true },
    { name: "senderId", label: "Sender ID", type: "text", required: true },
  ],
  TrueDialog: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "apiKey", label: "API Key", type: "password", required: true },
    { name: "accountId", label: "Account ID", type: "text", required: true },
    { name: "fromNumber", label: "From Number", type: "text", required: true },
  ],

  // Email Providers
  SendGrid: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "apiKey", label: "API Key", type: "password", required: true },
    { name: "fromEmail", label: "From Email", type: "email", required: true },
    { name: "fromName", label: "From Name", type: "text", required: false },
  ],
  AWS_SES: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "accessKeyId", label: "Access Key ID", type: "text", required: true },
    { name: "secretAccessKey", label: "Secret Access Key", type: "password", required: true },
    { name: "region", label: "Region", type: "text", required: true },
    { name: "fromEmail", label: "From Email", type: "email", required: true },
    { name: "fromName", label: "From Name", type: "text", required: false },
  ],
  Mailgun: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "apiKey", label: "API Key", type: "password", required: true },
    { name: "domain", label: "Domain", type: "text", required: true },
    { name: "fromEmail", label: "From Email", type: "email", required: true },
  ],
  SMTP: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "host", label: "SMTP Host", type: "text", required: true },
    { name: "port", label: "SMTP Port", type: "text", required: true },
    { name: "username", label: "Username", type: "text", required: true },
    { name: "password", label: "Password", type: "password", required: true },
    { name: "fromEmail", label: "From Email", type: "email", required: true },
    { name: "fromName", label: "From Name", type: "text", required: false },
    { name: "encryption", label: "Encryption", type: "text", required: false },
  ],
  Postmark: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "serverToken", label: "Server Token", type: "password", required: true },
    { name: "fromEmail", label: "From Email", type: "email", required: true },
    { name: "fromName", label: "From Name", type: "text", required: false },
  ],

  // WhatsApp Providers
  WhatsApp_Twilio: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "accountSid", label: "Account SID", type: "text", required: true },
    { name: "authToken", label: "Auth Token", type: "password", required: true },
    { name: "phoneNumber", label: "WhatsApp Number", type: "text", required: true },
  ],
  WhatsApp_Gupshup: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "apiKey", label: "API Key", type: "password", required: true },
    { name: "appName", label: "App Name", type: "text", required: true },
    { name: "phoneNumber", label: "WhatsApp Number", type: "text", required: true },
  ],
  Meta_Cloud: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "phoneNumberId", label: "Phone Number ID", type: "text", required: true },
    { name: "accessToken", label: "Access Token", type: "password", required: true },
    { name: "businessAccountId", label: "Business Account ID", type: "text", required: true },
  ],
  WhatsApp_Kaleyra: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "apiKey", label: "API Key", type: "password", required: true },
    { name: "sid", label: "SID", type: "text", required: true },
    { name: "phoneNumber", label: "WhatsApp Number", type: "text", required: true },
  ],
  WhatsApp_Vonage: [
    { name: "instance", label: "Select Instance", type: "select", required: true },
    { name: "apiKey", label: "API Key", type: "text", required: true },
    { name: "apiSecret", label: "API Secret", type: "password", required: true },
    { name: "phoneNumber", label: "WhatsApp Number", type: "text", required: true },
  ],
};

const SERVICE_TYPES = ["SMS", "EMAIL", "WHATSAPP"];
const SERVICE_COLORS: Record<string, string> = {
  SMS: "#10b981", EMAIL: "#6366f1", WHATSAPP: "#25D366"
};
const SERVICE_ICONS: Record<string, React.ReactNode> = {
  SMS: <MessageSquare size={18} />, EMAIL: <Mail size={18} />, WHATSAPP: <MessageCircle size={18} />
};

const PROVIDERS_BY_SERVICE: Record<string, string[]> = {
  SMS: ["MSG91", "Twilio", "Gupshup", "Vonage", "Kaleyra", "Textlocal", "TrueDialog"],
  EMAIL: ["SendGrid", "AWS_SES", "Mailgun", "SMTP", "Postmark"],
  WHATSAPP: ["WhatsApp_Twilio", "WhatsApp_Gupshup", "Meta_Cloud", "WhatsApp_Kaleyra", "WhatsApp_Vonage"]
};

export default function ProjectView() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [project, setProject] = useState<Project | null>(null);
  const [environments, setEnvironments] = useState<string[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<string>("");
  const [activeService, setActiveService] = useState<string>("SMS");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [serviceProviderCounts, setServiceProviderCounts] = useState<Record<string, number>>({ SMS: 0, EMAIL: 0, WHATSAPP: 0 });
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [expandedProviders, setExpandedProviders] = useState<Record<number, boolean>>({});
  const [openEnvMenu, setOpenEnvMenu] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [newEnvName, setNewEnvName] = useState("");
  const [isCustomEnv, setIsCustomEnv] = useState(false);
  const [customEnvInput, setCustomEnvInput] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchFilter, setSearchFilter] = useState("ALL");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", status: "active" as "active" | "inactive" });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Provider modal states
  const [showAddProviderModal, setShowAddProviderModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [providerFields, setProviderFields] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteProviderModal, setShowDeleteProviderModal] = useState<{ id: number; name: string } | null>(null);

  // Environment modal states
  const [showAddEnvModal, setShowAddEnvModal] = useState(false);
  const [showEditEnvModal, setShowEditEnvModal] = useState(false);
  const [editingEnvName, setEditingEnvName] = useState("");
  const [editEnvName, setEditEnvName] = useState("");
  const [showDeleteEnvModal, setShowDeleteEnvModal] = useState(false);
  const [deletingEnvName, setDeletingEnvName] = useState("");
  const [blockedDeleteCounts, setBlockedDeleteCounts] = useState({ sms: 0, email: 0, whatsapp: 0 });

  // Clone modal states
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneTarget, setCloneTarget] = useState("");
  const [cloneCustomMode, setCloneCustomMode] = useState(false);
  const [cloneCustomName, setCloneCustomName] = useState("");

  const [instanceFilter, setInstanceFilter] = useState<string>("Live");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  // User Assignment Panel states
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [userActiveTab, setUserActiveTab] = useState<"assign" | "unassign">("assign");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [userFilter, setUserFilter] = useState("all");

  // Mock user data - Replace with actual API calls
  const availableUsers = [
    { id: "u1", name: "John Doe", email: "john@example.com", role: "Developer", status: "active", assignedAt: "2026-05-14" },
    { id: "u2", name: "Jane Smith", email: "jane@example.com", role: "Admin", status: "active", assignedAt: "2026-05-13" },
    { id: "u3", name: "Mike Johnson", email: "mike@example.com", role: "Viewer", status: "inactive", assignedAt: "2026-05-12" },
    { id: "u4", name: "Sarah Wilson", email: "sarah@example.com", role: "Developer", status: "active", assignedAt: "2026-05-11" },
    { id: "u5", name: "Tom Brown", email: "tom@example.com", role: "Viewer", status: "active", assignedAt: "2026-05-10" },
    { id: "u6", name: "Alice Cooper", email: "alice@example.com", role: "Developer", status: "active", assignedAt: "2026-05-09" },
    { id: "u7", name: "Bob Marley", email: "bob@example.com", role: "Admin", status: "active", assignedAt: "2026-05-08" },
  ];

  // Assigned users for this environment
  const [assignedUsers, setAssignedUsers] = useState<any[]>([
    { id: "u6", name: "Alice Cooper", email: "alice@example.com", role: "Developer", status: "active", assignedAt: "2026-05-14" },
    { id: "u7", name: "Bob Marley", email: "bob@example.com", role: "Admin", status: "active", assignedAt: "2026-05-13" },
  ]);

  // Get unassigned users (available but not assigned)
  const unassignedUsers = availableUsers.filter(u => !assignedUsers.some(au => au.id === u.id));

  // Filter users based on search and tab
  const getFilteredUsers = () => {
    const userList = userActiveTab === "assign" ? unassignedUsers : assignedUsers;
    let filtered = userList;

    if (userSearchTerm.trim()) {
      const query = userSearchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    }

    if (userFilter !== "all") {
      filtered = filtered.filter(user => user.status === userFilter);
    }

    // Sort by most recent first for unassign tab
    if (userActiveTab === "unassign") {
      filtered = [...filtered].sort((a, b) =>
        new Date(b.assignedAt || "").getTime() - new Date(a.assignedAt || "").getTime()
      );
    }

    return filtered;
  };

  const filteredUserList = getFilteredUsers();

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUserList.map(u => u.id)));
    }
    setSelectAll(!selectAll);
  };

  // Handle individual select
  const handleUserSelect = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === filteredUserList.length);
  };

  // Handle assign users
  const handleAssignUsers = () => {
    const usersToAssign = unassignedUsers
      .filter(u => selectedUsers.has(u.id))
      .map(u => ({ ...u, assignedAt: new Date().toISOString().split('T')[0] }));
    setAssignedUsers(prev => [...usersToAssign, ...prev]);
    setSelectedUsers(new Set());
    setSelectAll(false);
  };

  // Handle unassign users
  const handleUnassignUsers = () => {
    setAssignedUsers(prev => prev.filter(u => !selectedUsers.has(u.id)));
    setSelectedUsers(new Set());
    setSelectAll(false);
  };

  useEffect(() => {
    const loadProject = () => {
      const allProjects = JSON.parse(localStorage.getItem('allProjects') || '[]');
      const currentProject = JSON.parse(localStorage.getItem('currentProject') || 'null');
      let projectToLoad = allProjects.find((p: any) => String(p.id) === String(projectId));
      if (!projectToLoad && currentProject && String(currentProject.id) === String(projectId)) {
        projectToLoad = currentProject;
      }
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
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.global-search-wrapper')) setShowSearchDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.custom-dropdown-wrapper')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);
  useEffect(() => {
    if (!openEnvMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.env-menu-dropdown') || target.closest('.env-menu-trigger')) return;
      setOpenEnvMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openEnvMenu]);

  useEffect(() => {
    if (selectedEnv) loadProviders();
  }, [selectedEnv, activeService]);

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
    const allEnvs = Array.from(envSet);
    setEnvironments(allEnvs);
    if (allEnvs.length > 0 && !selectedEnv) setSelectedEnv(allEnvs[0]);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    const provider = filteredProviders[index];
    const realIndex = providers.findIndex(p => p.id === provider.id);
    setDragIndex(realIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null) return;

    const dropProvider = filteredProviders[dropIndex];
    const realDropIndex = providers.findIndex(p => p.id === dropProvider.id);

    if (dragIndex === realDropIndex) {
      setDragIndex(null);
      return;
    }

    const newProviders = [...providers];
    const draggedItem = newProviders[dragIndex];
    newProviders.splice(dragIndex, 1);
    newProviders.splice(realDropIndex, 0, draggedItem);

    setProviders(newProviders);
    setDragIndex(null);
    saveToLocalStorage(newProviders);

    setToastMessage("Order changed successfully");
    setTimeout(() => setToastMessage(""), 2000);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const filteredProviders = providers.filter(provider => {
    return provider.fields.instance === instanceFilter;
  });

  const loadProviders = () => {
    if (!selectedEnv) return;
    const key = `env_${selectedEnv}_${activeService.toLowerCase()}_providers`;
    const data = localStorage.getItem(key);
    setProviders(data ? JSON.parse(data).providers || [] : []);
    updateAllServiceCounts();
  };

  useEffect(() => {
    if (selectedEnv) {
      updateAllServiceCounts();
    }
  }, [selectedEnv, activeService, instanceFilter]);

  const updateAllServiceCounts = () => {
    if (!selectedEnv) return;
    const counts: Record<string, number> = {};
    SERVICE_TYPES.forEach(service => {
      const key = `env_${selectedEnv}_${service.toLowerCase()}_providers`;
      const data = localStorage.getItem(key);
      const providers = data ? JSON.parse(data).providers || [] : [];
      // Count by current instance filter
      counts[service] = providers.filter((p: Provider) => p.fields.instance === instanceFilter).length;
    });
    setServiceProviderCounts(counts);
  };

  const saveToLocalStorage = (p: Provider[]) => {
    localStorage.setItem(`env_${selectedEnv}_${activeService.toLowerCase()}_providers`, JSON.stringify({ providers: p, timestamp: Date.now() }));
  };

  // Project edit handlers
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

  const handleCancelEdit = () => {
    if (project) setEditForm({ name: project.name, description: project.description || "", status: project.status });
    setIsEditing(false);
  };

  // Environment handlers
  const handleCreateEnvironment = () => {
    const envToCreate = isCustomEnv && customEnvInput.trim() ? customEnvInput.trim() : (newEnvName || 'Local');
    ['sms', 'email', 'whatsapp'].forEach(service => {
      const key = `env_${envToCreate}_${service}_providers`;
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ providers: [], timestamp: Date.now() }));
    });
    loadEnvironments();
    setSelectedEnv(envToCreate);
    setNewEnvName(""); setIsCustomEnv(false); setCustomEnvInput("");
  };

  const handleAddEnvironment = () => {
    let name = newEnvName;
    if (isCustomEnv && customEnvInput.trim()) name = customEnvInput.trim();
    if (!name) return;
    if (environments.some(e => e.toLowerCase() === name.toLowerCase())) return;
    ['sms', 'email', 'whatsapp'].forEach(s => {
      if (!localStorage.getItem(`env_${name}_${s}_providers`)) localStorage.setItem(`env_${name}_${s}_providers`, JSON.stringify({ providers: [], timestamp: Date.now() }));
    });
    setEnvironments(prev => [...prev, name]);
    setSelectedEnv(name); setProviders([]); setServiceProviderCounts({ SMS: 0, EMAIL: 0, WHATSAPP: 0 });
    setShowAddEnvModal(false); setNewEnvName(""); setIsCustomEnv(false); setCustomEnvInput("");
  };

  const handleEditEnvironment = () => {
    if (!editEnvName.trim()) return;
    ['sms', 'email', 'whatsapp'].forEach(s => {
      const old = `env_${editingEnvName}_${s}_providers`, nw = `env_${editEnvName}_${s}_providers`;
      const d = localStorage.getItem(old); if (d) { localStorage.setItem(nw, d); localStorage.removeItem(old); }
    });
    loadEnvironments(); if (selectedEnv === editingEnvName) setSelectedEnv(editEnvName);
    setShowEditEnvModal(false);
  };

  const handleDeleteEnvironment = () => {
    ['sms', 'email', 'whatsapp'].forEach(s => localStorage.removeItem(`env_${deletingEnvName}_${s}_providers`));
    const updated = environments.filter(e => e !== deletingEnvName);
    setEnvironments(updated); if (selectedEnv === deletingEnvName) setSelectedEnv(updated[0] || "");
    setShowDeleteEnvModal(false);
  };

  const executeClone = () => {
    let target = cloneCustomMode && cloneCustomName.trim() ? cloneCustomName.trim() : cloneTarget;
    if (!target) return;
    ['sms', 'email', 'whatsapp'].forEach(s => {
      const src = localStorage.getItem(`env_${selectedEnv}_${s}_providers`);
      if (src) localStorage.setItem(`env_${target}_${s}_providers`, JSON.stringify({ ...JSON.parse(src), timestamp: Date.now() }));
    });
    loadEnvironments(); setSelectedEnv(target); loadProviders();
    setShowCloneModal(false);
  };

  // Provider handlers
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
      setProviders(updated); saveToLocalStorage(updated); updateAllServiceCounts(); loadEnvironments();
      setShowAddProviderModal(false); setEditingProvider(null); setSelectedProvider(""); setProviderFields({}); setSaving(false);
    }, 500);
  };

  const editProvider = (p: Provider) => {
    setEditingProvider(p);
    setSelectedProvider(p.name);
    setProviderFields({ ...p.fields });
    setShowAddProviderModal(true);
  };

  const deleteProvider = () => {
    if (!showDeleteProviderModal) return;
    const updated = providers.filter(p => p.id !== showDeleteProviderModal.id);
    setProviders(updated); saveToLocalStorage(updated); updateAllServiceCounts(); loadEnvironments();
    setShowDeleteProviderModal(null);
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvider(e.target.value);
    const defs = PROVIDER_FIELDS_MAP[e.target.value] || [];
    const nf: Record<string, string> = {};
    defs.forEach(f => {
      // For select type fields, don't set a default value (leave as undefined)
      // so the placeholder "-- Choose instance --" shows
      if (f.type !== "select") {
        nf[f.name] = "";
      }
    });
    setProviderFields(nf);
  };

  const handleFieldChange = (n: string, v: string) => setProviderFields(prev => ({ ...prev, [n]: v }));
  const togglePasswordVisibility = (n: string) => setShowPasswords(prev => ({ ...prev, [n]: !prev[n] }));

  const getEnvIcon = (name: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      'Local': <Home size={16} />, 'Dev': <Monitor size={16} />, 'Staging': <Rocket size={16} />, 'Live': <Globe size={16} />
    };
    return icons[name] || <Wrench size={16} />;
  };

  const searchResults = (() => {
    if (!globalSearch.trim()) return [];
    const query = globalSearch.toLowerCase();
    const results: any[] = [];
    environments.forEach(env => {
      if (env.toLowerCase().includes(query) && (searchFilter === "ALL" || searchFilter === "ENVIRONMENTS")) {
        results.push({ type: "environment", label: env, environment: env });
      }
      SERVICE_TYPES.forEach(service => {
        if (service.toLowerCase().includes(query) && (searchFilter === "ALL" || searchFilter === "SERVICES")) {
          results.push({ type: "service", label: service, environment: env, service });
        }
        const data = JSON.parse(localStorage.getItem(`env_${env}_${service.toLowerCase()}_providers`) || '{"providers":[]}');
        data.providers?.forEach((provider: any) => {
          if (provider.name.toLowerCase().includes(query) && (searchFilter === "ALL" || searchFilter === "PROVIDERS")) {
            results.push({ type: "provider", label: provider.name.replace(/_/g, ' '), environment: env, service, providerId: provider.id });
          }
        });
      });
    });
    return results;
  })();


  if (!project) return <div className="loading">Loading...</div>;

  return (
    <div className="project-view-page">
      {/* Top Bar */}
      <div className="view-top-bar">
        <div className="page-header"><h1>View Project</h1></div>
        <div className="breadcrumbs-row">
          <button className="breadcrumb-link" onClick={() => navigate("/dashboard")}>Dashboard</button>
          <span className="breadcrumb-separator">›</span>
          <button className="breadcrumb-link" onClick={() => navigate("/dashboard/project")}>Projects</button>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">{project.name}</span>
        </div>
      </div>

      {/* Project Details Card */}
      <div className="project-details-card">
        <div className="project-details-content">
          <div className="project-logo-section">
            {isEditing ? (
              <div className="logo-edit-wrapper">
                <label className="logo-label">Logo</label>
                <label className="project-logo editable-logo" style={{ cursor: 'pointer' }}>
                  {project.logo ? <img src={project.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }} /> : <FolderOpen size={40} color="#818cf8" />}
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { const reader = new FileReader(); reader.onloadend = () => { setProject({ ...project, logo: reader.result as string }); }; reader.readAsDataURL(file); }
                  }} style={{ display: 'none' }} />
                  <div className="image-overlay-edit"><span>Change</span></div>
                </label>
              </div>
            ) : (
              <div className="project-logo">
                {project.logo ? <img src={project.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }} /> : <FolderOpen size={40} color="#818cf8" />}
              </div>
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
                  <div className="form-group-inline">
                    <label>Description</label>
                    <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="inline-textarea" rows={2} />
                  </div>
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

                {/* Token Section */}
                <div className="token-section-inline">

                  <div className="token-info-row">
                    <button
                      className="token-manage-btn"
                      onClick={() => {
                        if (environments.length > 0) {
                          navigate(`/dashboard/token-generate`, { state: { project } });
                        }
                      }}
                      disabled={environments.length === 0}
                      style={environments.length === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                      <Key size={16} /> Manage Token
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Environment & Provider Section */}
      <div className="environment-section-new">
        {environments.length === 0 ? (
          <div className="pc-simple-first-time">
            <div className="pc-simple-card">
              <div className="pc-card-icon">
                <Globe size={40} color="#6366f1" />
              </div>
              <h2>Configure Your Environment</h2>
              <p>Get started by creating an environment to manage SMS, Email & WhatsApp providers</p>

              <div className="pc-card-steps">
                <div className="pc-card-step"><span className="pc-step-dot">1</span><span>Choose an environment type</span></div>
                <div className="pc-card-step"><span className="pc-step-dot">2</span><span>Add providers for each service</span></div>
                <div className="pc-card-step"><span className="pc-step-dot">3</span><span>Start sending notifications</span></div>
              </div>

              <div className="pc-simple-select-row">
                {/* Custom Dropdown */}
                <div className="custom-dropdown-wrapper">
                  <div
                    className={`custom-dropdown-trigger ${dropdownOpen ? 'open' : ''}`}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <span className={newEnvName || isCustomEnv ? 'selected-text' : 'placeholder-text'}>
                      {isCustomEnv ? 'Custom' : newEnvName || '-- Select Environment --'}
                    </span>
                    <ChevronDown size={16} />
                  </div>

                  {dropdownOpen && (
                    <div className="custom-dropdown-menu">
                      {['Local', 'Dev', 'Staging', 'Live'].map(env => (
                        <div
                          key={env}
                          className={`custom-dropdown-item ${newEnvName === env && !isCustomEnv ? 'selected' : ''}`}
                          onClick={() => { setNewEnvName(env); setIsCustomEnv(false); setDropdownOpen(false); }}
                        >
                          {getEnvIcon(env)} {env}
                          {newEnvName === env && !isCustomEnv && <Check size={14} style={{ marginLeft: 'auto' }} />}
                        </div>
                      ))}
                      <div className="custom-dropdown-divider"></div>
                      <div
                        className={`custom-dropdown-item ${isCustomEnv ? 'selected' : ''}`}
                        onClick={() => { setIsCustomEnv(true); setNewEnvName(""); setDropdownOpen(false); }}
                      >
                        <Wrench size={14} /> Custom
                        {isCustomEnv && <Check size={14} />}
                      </div>
                    </div>
                  )}
                </div>

                {isCustomEnv && (
                  <input
                    type="text"
                    placeholder="Enter environment name"
                    value={customEnvInput}
                    onChange={e => setCustomEnvInput(e.target.value)}
                    className="pc-input"
                    autoFocus
                  />
                )}
                <button
                  className="pc-create-first-env-btn"
                  onClick={handleCreateEnvironment}
                  disabled={(!isCustomEnv && !newEnvName) || (isCustomEnv && !customEnvInput.trim())}
                >
                  Create Environment <Rocket size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Environment Header */}
            <div className="env-header-row">
              <h3 className="env-heading">Environments</h3>
              <div className="env-header-right">
                <div className="global-search-wrapper">
                  <Search size={14} className="global-search-icon" />
                  <input type="text" placeholder="Search environments, services, providers..." value={globalSearch}
                    onChange={(e) => { setGlobalSearch(e.target.value); setShowSearchDropdown(true); }}
                    onFocus={() => setShowSearchDropdown(true)} className="global-search-input" />
                  {showSearchDropdown && (
                    <div className="global-search-dropdown">
                      {searchResults.length === 0 ? <div className="search-no-results">No results found</div> : searchResults.map((result, index) => (
                        <button key={index} className="search-result-item" onClick={() => {
                          if (result.environment) setSelectedEnv(result.environment);
                          if (result.service) setActiveService(result.service);
                          if (result.providerId) setExpandedProviders(prev => ({ ...prev, [result.providerId]: true }));
                          setGlobalSearch(""); setShowSearchDropdown(false);
                        }}>
                          <div className="search-result-main">{result.label}</div>
                          <div className="search-result-meta">{result.environment}{result.service && ` • ${result.service}`}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <select className="global-search-filter" value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)}>
                  <option value="ALL">All</option><option value="ENVIRONMENTS">Environments</option>
                  <option value="SERVICES">Services</option><option value="PROVIDERS">Providers</option>
                </select>
                <button className="pc-add-env-btn" onClick={() => { setNewEnvName(""); setIsCustomEnv(false); setCustomEnvInput(""); setShowAddEnvModal(true); }}>
                  <Plus size={14} /> New Environment
                </button>
              </div>
            </div>

            {/* Environment Tabs */}
            <div className="env-tabs-container">
              <div className="env-tabs">
                {environments.map((env) => (
                  <div key={env} className={`env-tab ${selectedEnv === env ? 'active' : ''}`} onClick={() => setSelectedEnv(env)}>
                    <span className="env-tab-name">{env}</span>
                    <div className="env-tab-menu" onClick={(e) => e.stopPropagation()}>
                      <button className="env-menu-trigger" onClick={() => setOpenEnvMenu(openEnvMenu === env ? null : env)}>⋮</button>                      {openEnvMenu === env && (
                        <div className="env-menu-dropdown">
                          <button
                            onClick={() => { setEditingEnvName(env); setEditEnvName(env); setShowEditEnvModal(true); setOpenEnvMenu(null); }}

                          >
                            <Pencil size={14} />
                            <span className="env-menu-tooltip">Edit</span>
                          </button>
                          <button
                            onClick={() => { setCloneTarget(""); setCloneCustomMode(false); setShowCloneModal(true); setOpenEnvMenu(null); }}

                          >
                            <Copy size={14} />
                            <span className="env-menu-tooltip">Clone</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowUserPanel(true);
                              setOpenEnvMenu(null);
                              setUserSearchTerm("");
                              setSelectedUsers(new Set());
                              setSelectAll(false);
                              setUserFilter("all");
                            }}
                          >
                            <User size={14} />
                            <span className="env-menu-tooltip">Users</span>
                          </button>
                          <button
                            onClick={() => {
                              const sms = JSON.parse(localStorage.getItem(`env_${env}_sms_providers`) || '{"providers":[]}');
                              const email = JSON.parse(localStorage.getItem(`env_${env}_email_providers`) || '{"providers":[]}');
                              const wa = JSON.parse(localStorage.getItem(`env_${env}_whatsapp_providers`) || '{"providers":[]}');
                              const total = (sms.providers?.length || 0) + (email.providers?.length || 0) + (wa.providers?.length || 0);
                              setDeletingEnvName(env);
                              if (total > 0) setBlockedDeleteCounts({ sms: sms.providers?.length || 0, email: email.providers?.length || 0, whatsapp: wa.providers?.length || 0 });
                              else setShowDeleteEnvModal(true);
                              setOpenEnvMenu(null);
                            }}

                          >
                            <Trash2 size={14} />
                            <span className="env-menu-tooltip">Delete</span>
                          </button>
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
              <div className="pc-sidebar-wrapper">
                <div className="pc-service-env-info">
                  <span className="pc-service-label">{activeService}</span>
                  <span className="pc-separator-dash">-</span>
                  <span className="pc-env-label">{selectedEnv}</span>
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
              <div className="pc-sidebar-wrapper" style={{ flex: 1 }}>
                <h4 className="pc-column-label pc-column-label-providers">Providers</h4>
                <div className="pc-providers-panel" style={{ borderTop: `3px solid ${SERVICE_COLORS[activeService]}` }}>
                  <div className="pc-panel-header">
                    <div className="pc-panel-title">
                      {SERVICE_ICONS[activeService]}<h3>{activeService} Providers</h3>
                      <span className="pc-panel-count">{providers.length}</span>
                    </div>
                    <button className="pc-add-btn" style={{ backgroundColor: SERVICE_COLORS[activeService] }}
                      onClick={() => { setEditingProvider(null); setSelectedProvider(""); setProviderFields({}); setShowAddProviderModal(true); }}>
                      <Plus size={14} /> Add Provider
                    </button>
                  </div>

                  {/* Instance Tabs - BELOW the header */}
                  <div className="pc-instance-tabs">
                    <button
                      className={`pc-instance-tab ${instanceFilter === 'Live' ? 'active live' : ''}`}
                      onClick={() => setInstanceFilter('Live')}
                    >
                      <Rocket size={14} />
                      Live
                      <span className="pc-instance-tab-count">
                        {providers.filter(p => p.fields.instance === 'Live').length}
                      </span>
                    </button>
                    <button
                      className={`pc-instance-tab ${instanceFilter === 'Sandbox' ? 'active sandbox' : ''}`}
                      onClick={() => setInstanceFilter('Sandbox')}
                    >
                      <Wrench size={14} />
                      Sandbox
                      <span className="pc-instance-tab-count">
                        {providers.filter(p => p.fields.instance === 'Sandbox').length}
                      </span>
                    </button>
                  </div>


                  <div className="pc-providers-list">
                    {filteredProviders.length === 0 ? (
                      <div className="pc-empty-state">
                        <Server size={44} color="#cbd5e1" />
                        <h4>No {instanceFilter} {activeService} providers yet</h4>
                        <p>Add your first {instanceFilter.toLowerCase()} provider to start configuring services</p>
                      </div>
                    ) : (
                      filteredProviders.map((provider, index) => (
                        <div
                          key={provider.id}
                          className={`pc-provider-card ${dragIndex === index ? 'dragging' : ''}`}
                          style={{ borderLeftColor: SERVICE_COLORS[activeService] }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="pc-provider-card-header" onClick={() => setExpandedProviders(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}>
                            <div className="pc-provider-title">
                              <Plug size={14} /><span>{provider.name.replace(/_/g, ' ')}</span>
                              {/* Primary badge on first card */}
                              {index === 0 && (
                                <span className="pc-primary-badge">
                                  <Rocket size={10} /> Primary
                                </span>
                              )}
                              <span className="pc-configured-badge" style={{ background: `${SERVICE_COLORS[activeService]}15`, color: SERVICE_COLORS[activeService] }}><Check size={10} /> Configured</span>
                              <span className="pc-usage-badge" title={`${provider.usageCount || 0} ${activeService.toLowerCase()} sent`}>
                                <span className="pc-usage-count">{provider.usageCount || 0}</span>
                                <span className="pc-usage-label">sent</span>
                              </span>
                            </div>
                            <div className="pc-provider-actions" onClick={(e) => e.stopPropagation()}>
                              <button className="pc-edit-btn" onClick={() => editProvider(provider)}><Pencil size={14} /></button>
                              <button className="pc-delete-btn" onClick={() => setShowDeleteProviderModal({ id: provider.id, name: provider.name })}><Trash2 size={14} /></button>
                            </div>
                          </div>
                          {
                            expandedProviders[provider.id] && (
                              <div className="pc-provider-card-body">
                                {Object.entries(provider.fields)
                                  .sort(([a], [b]) => a === 'instance' ? -1 : b === 'instance' ? 1 : 0)
                                  .map(([key, value]) => {
                                    const fc = PROVIDER_FIELDS_MAP[provider.name]?.find((f: any) => f.name === key);
                                    const isPwd = fc?.type === "password" || key.includes("Key") || key.includes("Token");
                                    const isInstance = fc?.type === "select";
                                    const pk = `${provider.id}_${key}`;
                                    return (
                                      <div className="pc-credential-row" key={key}>
                                        <span className="pc-credential-label">{isInstance ? "Instance" : fc?.label || key}</span>
                                        {isInstance ? (
                                          <span className={`pc-instance-badge ${value === 'Live' ? 'live' : 'sandbox'}`}>
                                            {value === 'Live' ? <Rocket size={12} /> : <Wrench size={12} />}
                                            {value || "—"}
                                          </span>
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
                            )
                          }
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>

      {/* ===== ALL MODALS ===== */}

      {/* Add Environment Modal */}
      {
        showAddEnvModal && (
          <div className="pc-modal-overlay" onClick={() => setShowAddEnvModal(false)}>
            <div className="pc-modal" onClick={e => e.stopPropagation()}>
              <div className="pc-modal-header"><h3><Plus size={18} /> Add Environment</h3><button className="pc-modal-close" onClick={() => setShowAddEnvModal(false)}><X size={20} /></button></div>
              <div className="pc-modal-body">
                <p className="pc-modal-desc">Select an environment or create a custom one</p>
                <div className="pc-env-options">
                  {['Local', 'Dev', 'Staging', 'Live'].filter(env => !environments.includes(env)).map(env => (
                    <div key={env} className={`pc-env-option ${newEnvName === env && !isCustomEnv ? 'selected' : ''}`} onClick={() => { setNewEnvName(env); setIsCustomEnv(false); }}>
                      <span className="pc-env-option-icon">{getEnvIcon(env)}</span><span>{env}</span>
                      {newEnvName === env && !isCustomEnv && <Check size={18} />}
                    </div>
                  ))}
                  <div className={`pc-env-option custom ${isCustomEnv ? 'selected' : ''}`} onClick={() => { setIsCustomEnv(true); setNewEnvName(""); }}>
                    <span className="pc-env-option-icon"><Wrench size={18} /></span><span>Custom Environment</span>
                    {isCustomEnv && <Check size={18} />}
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
          <div className="pc-modal-overlay" onClick={() => setShowEditEnvModal(false)}>
            <div className="pc-modal pc-modal-small" onClick={e => e.stopPropagation()}>
              <div className="pc-modal-header"><h3>Edit Environment</h3><button className="pc-modal-close" onClick={() => setShowEditEnvModal(false)}><X size={18} /></button></div>
              <div className="pc-modal-body"><div className="pc-form-group"><label>Environment Name</label><input type="text" className="pc-input" value={editEnvName} onChange={(e) => setEditEnvName(e.target.value)} /></div></div>
              <div className="pc-modal-footer">
                <button className="pc-btn-cancel" onClick={() => setShowEditEnvModal(false)}>Cancel</button>
                <button className="pc-btn-primary" onClick={handleEditEnvironment}>Save Changes</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Environment Modal */}
      {
        showDeleteEnvModal && (
          <div className="pc-modal-overlay" onClick={() => setShowDeleteEnvModal(false)}>
            <div className="pc-modal pc-modal-small" onClick={e => e.stopPropagation()}>
              <div className="pc-modal-header"><h3>Delete Environment</h3><button className="pc-modal-close" onClick={() => setShowDeleteEnvModal(false)}><X size={18} /></button></div>
              <div className="pc-modal-body"><p>Are you sure you want to delete <strong>{deletingEnvName}</strong> environment?</p><div className="warning-text">This action cannot be undone.</div></div>
              <div className="pc-modal-footer">
                <button className="pc-btn-cancel" onClick={() => setShowDeleteEnvModal(false)}>Cancel</button>
                <button className="pc-btn-danger" onClick={handleDeleteEnvironment}>Delete</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Cannot Delete Modal */}
      {
        deletingEnvName && (blockedDeleteCounts.sms > 0 || blockedDeleteCounts.email > 0 || blockedDeleteCounts.whatsapp > 0) && (
          <div className="pc-modal-overlay" onClick={() => { setDeletingEnvName(""); setBlockedDeleteCounts({ sms: 0, email: 0, whatsapp: 0 }); }}>
            <div className="pc-modal pc-modal-small" onClick={e => e.stopPropagation()}>
              <div className="pc-modal-header"><h3><AlertTriangle size={18} /> Cannot Delete</h3><button className="pc-modal-close" onClick={() => { setDeletingEnvName(""); setBlockedDeleteCounts({ sms: 0, email: 0, whatsapp: 0 }); }}><X size={18} /></button></div>
              <div className="pc-modal-body">
                <p>Environment <strong>"{deletingEnvName}"</strong> cannot be deleted because providers are still configured.</p>
                <div className="provider-summary">
                  {blockedDeleteCounts.sms > 0 && <div className="summary-item">SMS: {blockedDeleteCounts.sms}</div>}
                  {blockedDeleteCounts.email > 0 && <div className="summary-item">Email: {blockedDeleteCounts.email}</div>}
                  {blockedDeleteCounts.whatsapp > 0 && <div className="summary-item">WhatsApp: {blockedDeleteCounts.whatsapp}</div>}
                </div>
                <p className="warning-text">Remove all providers before deleting this environment.</p>
              </div>
              <div className="pc-modal-footer"><button className="pc-btn-cancel" onClick={() => { setDeletingEnvName(""); setBlockedDeleteCounts({ sms: 0, email: 0, whatsapp: 0 }); }}>Close</button></div>
            </div>
          </div>
        )
      }

      {/* Clone Modal */}
      {
        showCloneModal && (
          <div className="pc-modal-overlay" onClick={() => setShowCloneModal(false)}>
            <div className="pc-modal" onClick={e => e.stopPropagation()}>
              <div className="pc-modal-header"><h3><Copy size={18} /> Clone Environment</h3><button className="pc-modal-close" onClick={() => setShowCloneModal(false)}><X size={20} /></button></div>
              <div className="pc-modal-body">
                <div className="clone-source-info"><label>Source Environment</label><div className="clone-source-name">{getEnvIcon(selectedEnv)} {selectedEnv}</div></div>
                <div className="pc-form-group"><label>Select Target Environment</label>
                  <div className="pc-env-options">
                    {['Local', 'Dev', 'Staging', 'Live'].filter(env => env !== selectedEnv && !environments.includes(env)).map(env => (
                      <div key={env} className={`pc-env-option ${cloneTarget === env && !cloneCustomMode ? 'selected' : ''}`} onClick={() => { setCloneTarget(env); setCloneCustomMode(false); }}>
                        <span className="pc-env-option-icon">{getEnvIcon(env)}</span><span>{env}</span>
                        {cloneTarget === env && !cloneCustomMode && <Check size={18} />}
                      </div>
                    ))}
                    <div className={`pc-env-option custom ${cloneCustomMode ? 'selected' : ''}`} onClick={() => { setCloneCustomMode(true); setCloneTarget(""); }}>
                      <span className="pc-env-option-icon"><Wrench size={18} /></span><span>Custom Environment</span>
                      {cloneCustomMode && <Check size={18} />}
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
      {showAddProviderModal && (
        <div className="pc-modal-overlay" onClick={() => { setShowAddProviderModal(false); setEditingProvider(null); }}>
          <div className="pc-modal pc-modal-provider" onClick={e => e.stopPropagation()}>
            <div className="pc-modal-header">
              <div className="pc-modal-header-left">
                <span className="pc-modal-service-badge" style={{ backgroundColor: `${SERVICE_COLORS[activeService]}15`, color: SERVICE_COLORS[activeService], border: `1px solid ${SERVICE_COLORS[activeService]}40` }}>
                  {SERVICE_ICONS[activeService]}<span>{activeService}</span>
                </span>
                <h3>{editingProvider ? 'Edit Provider' : 'Add Provider'}</h3>
              </div>
              <button className="pc-modal-close" onClick={() => { setShowAddProviderModal(false); setEditingProvider(null); }}><X size={20} /></button>
            </div>
            <div className="pc-modal-env-info"><Globe size={14} /><span>Environment: <strong>{selectedEnv}</strong></span></div>
            <div className="pc-modal-body">
              <div className="pc-form-group">
                <label>Select Provider *</label>
                <select value={selectedProvider} onChange={handleProviderChange} className="pc-select">
                  <option value="">-- Choose provider --</option>
                  {PROVIDERS_BY_SERVICE[activeService]?.filter(p => {
                    // Always show if editing this provider
                    if (editingProvider?.name === p) return true;
                    // Check if provider exists in ANY instance (Live OR Sandbox)
                    const providerExistsInLive = providers.some(prov => prov.name === p && prov.fields.instance === 'Live');
                    const providerExistsInSandbox = providers.some(prov => prov.name === p && prov.fields.instance === 'Sandbox');
                    // Hide only if it exists in BOTH instances
                    const existsInBoth = providerExistsInLive && providerExistsInSandbox;
                    return !existsInBoth;
                  }).map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              {selectedProvider && PROVIDER_FIELDS_MAP[selectedProvider] && (
                <>
                  {/* Instance field outside credentials */}
                  {PROVIDER_FIELDS_MAP[selectedProvider]
                    .filter((f: any) => f.type === "select")
                    .map((field: any) => (
                      <div className="pc-form-group" key={field.name}>
                        <label>{field.label}{field.required && " *"}</label>
                        <select
                          value={providerFields[field.name] || ""}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="pc-select"
                        >
                          <option value="">-- Choose instance --</option>
                          {(() => {
                            const liveExists = providers.some(p => p.name === selectedProvider && p.fields.instance === 'Live');
                            const sandboxExists = providers.some(p => p.name === selectedProvider && p.fields.instance === 'Sandbox');

                            // When editing, show both
                            if (editingProvider) {
                              return (
                                <>
                                  <option value="Sandbox">Sandbox</option>
                                  <option value="Live">Live</option>
                                </>
                              );
                            }

                            // When adding new, hide instances that already have this provider
                            return (
                              <>
                                {!sandboxExists && <option value="Sandbox">Sandbox</option>}
                                {!liveExists && <option value="Live">Live</option>}
                              </>
                            );
                          })()}
                        </select>
                      </div>
                    ))}
                  <div className="pc-credentials-section">
                    <h4><Lock size={14} /> Credentials</h4>
                    {PROVIDER_FIELDS_MAP[selectedProvider]
                      .filter((f: any) => f.type !== "select")
                      .map((field: any) => (
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
                            {field.type === "password" &&
                              <button type="button" className="pc-eye-btn" onClick={() => togglePasswordVisibility(field.name)}>
                                {showPasswords[field.name] ? <FaEyeSlash /> : <FaEye />}
                              </button>
                            }
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
            <div className="pc-modal-footer">
              <button className="pc-btn-cancel" onClick={() => { setShowAddProviderModal(false); setEditingProvider(null); }}>Cancel</button>
              <button className="pc-btn-primary" onClick={saveProvider} disabled={saving} style={{ backgroundColor: SERVICE_COLORS[activeService] }}>
                {saving ? 'Saving...' : editingProvider ? 'Update Provider' : 'Add Provider'}
              </button>
            </div>
          </div>
        </div>
      )
      }

      {/* Delete Provider Modal */}
      {
        showDeleteProviderModal && (
          <div className="pc-modal-overlay" onClick={() => setShowDeleteProviderModal(null)}>
            <div className="pc-modal pc-modal-small" onClick={e => e.stopPropagation()}>
              <div className="pc-modal-header"><h3><Trash2 size={18} /> Delete Provider</h3><button className="pc-modal-close" onClick={() => setShowDeleteProviderModal(null)}><X size={20} /></button></div>
              <div className="pc-modal-body"><p>Are you sure you want to delete <strong>{showDeleteProviderModal.name.replace(/_/g, ' ')}</strong>?</p><p className="pc-warning-text">This action cannot be undone.</p></div>
              <div className="pc-modal-footer">
                <button className="pc-btn-cancel" onClick={() => setShowDeleteProviderModal(null)}>Cancel</button>
                <button className="pc-btn-danger" onClick={deleteProvider}>Delete</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Toast Notification */}
      {
        toastMessage && (
          <div className="pc-toast">
            <Check size={16} />
            {toastMessage}
          </div>
        )
      }
      {/* User Assignment Panel */}
      {showUserPanel && (
        <div className="user-panel-overlay" onClick={() => setShowUserPanel(false)}>
          <div className="user-panel" onClick={e => e.stopPropagation()}>
            <div className="user-panel-header">
              <div className="user-panel-header-left">
                <User size={20} />
                <h3>Manage Users - {selectedEnv}</h3>
              </div>
              <button className="user-panel-close" onClick={() => setShowUserPanel(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            {/* Tabs */}
            <div className="user-panel-tabs">
              <button
                className={`user-panel-tab ${userActiveTab === 'assign' ? 'active' : ''}`}
                onClick={() => {
                  setUserActiveTab('assign');
                  setSelectedUsers(new Set());
                  setSelectAll(false);
                }}
              >
                <UserPlus size={14} />
                Assign User
              </button>
              <button
                className={`user-panel-tab ${userActiveTab === 'unassign' ? 'active' : ''}`}
                onClick={() => {
                  setUserActiveTab('unassign');
                  setSelectedUsers(new Set());
                  setSelectAll(false);
                }}
              >
                <UserMinus size={14} />
                Unassign User
              </button>
            </div>

            {/* Search and Filter */}
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
              <select
                className="user-panel-filter"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* User Table */}
            <div className="user-panel-table-wrapper">
              <table className="user-panel-table">
                <thead>
                  <tr>
                    <th className="col-checkbox">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="user-checkbox"
                      />
                    </th>
                    <th className="col-user">User</th>
                    <th className="col-status">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUserList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="user-empty-state">
                        {userSearchTerm.trim()
                          ? 'No users match your search'
                          : userActiveTab === 'assign'
                            ? 'No users available to assign'
                            : 'No users assigned yet'}
                      </td>
                    </tr>
                  ) : (
                    filteredUserList.map(user => (
                      <tr key={user.id} className={selectedUsers.has(user.id) ? 'selected' : ''}>
                        <td className="col-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => handleUserSelect(user.id)}
                            className="user-checkbox"
                          />
                        </td>
                        <td className="col-user">
                          <div className="user-cell">
                            <span className="user-name">{user.name}</span>
                            <span className="user-email">{user.email}</span>
                          </div>
                        </td>
                        <td className="col-status">
                          <span className={`user-status-badge ${user.status}`}>
                            {user.status === 'active' ? <Check size={12} /> : <AlertCircle size={12} />}
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Action Button */}
            <div className="user-panel-footer">
              <button
                className="user-panel-action-btn"
                onClick={userActiveTab === 'assign' ? handleAssignUsers : handleUnassignUsers}
                disabled={selectedUsers.size === 0}
                style={{
                  background: userActiveTab === 'assign' ? '#6366f1' : '#ef4444'
                }}
              >
                {userActiveTab === 'assign' ? (
                  <><UserPlus size={16} /> Unassign Selected ({selectedUsers.size})</>
                ) : (
                  <><UserMinus size={16} /> Assign Selected ({selectedUsers.size})</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}