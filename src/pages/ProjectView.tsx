import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/ProjectView.css";
import {
  Pencil, FolderOpen,
  Plus, MessageSquare, Mail, MessageCircle, Plug, Check,
  Save,
  X,
  ChevronDown,
  Server,
  Copy,
  Trash2, Globe, Rocket, Wrench
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
}

// Provider fields map
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

const SERVICE_COLORS: Record<string, string> = {
  SMS: "#10b981",
  EMAIL: "#6366f1",
  WHATSAPP: "#25D366"
};

export default function ProjectView() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [project, setProject] = useState<Project | null>(null);
  const [environments, setEnvironments] = useState<string[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<string>("");
  const [activeService, setActiveService] = useState<string>("SMS");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [serviceProviderCounts, setServiceProviderCounts] = useState<Record<string, number>>({
    SMS: 0, EMAIL: 0, WHATSAPP: 0
  });
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [expandedProviders, setExpandedProviders] = useState<Record<number, boolean>>({});
  const [openEnvMenu, setOpenEnvMenu] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [newEnvName, setNewEnvName] = useState("");
  const [isCustomEnv, setIsCustomEnv] = useState(false);
  const [customEnvInput, setCustomEnvInput] = useState("");


  const [showSearchDropdown, setShowSearchDropdown] =
    useState(false);

  const [searchFilter, setSearchFilter] =
    useState("ALL");

  // Inline editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    const loadProject = () => {
      const allProjects = JSON.parse(
        localStorage.getItem('allProjects') || '[]'
      );

      const currentProject = JSON.parse(
        localStorage.getItem('currentProject') || 'null'
      );

      let projectToLoad = allProjects.find(
        (p: any) =>
          String(p.id) === String(projectId)
      );

      if (!projectToLoad && currentProject) {
        if (
          String(currentProject.id) ===
          String(projectId)
        ) {
          projectToLoad = currentProject;
        }
      }

      if (projectToLoad) {
        setProject({
          ...projectToLoad,
          createdBy: projectToLoad.createdBy || "Admin User",
          updatedAt: projectToLoad.updatedAt || projectToLoad.created,
          updatedBy: projectToLoad.updatedBy || "Admin User",
        });
        setEditForm({
          name: projectToLoad.name || "",
          description: projectToLoad.description || "",
          status: projectToLoad.status || "active",
        });
      }
    };

    loadProject();
    loadEnvironments();

    const handleProjectUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const updatedProject = customEvent.detail;
      setProject({
        ...updatedProject,
        createdBy: updatedProject.createdBy || "Admin User",
        updatedAt: updatedProject.updatedAt || updatedProject.created,
        updatedBy: updatedProject.updatedBy || "Admin User",
      });
      setEditForm({
        name: updatedProject.name || "",
        description: updatedProject.description || "",
        status: updatedProject.status || "active",
      });
    };

    window.addEventListener('projectUpdated', handleProjectUpdate);
    return () => window.removeEventListener('projectUpdated', handleProjectUpdate);
  }, [projectId]);

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
    if (selectedEnv) {
      loadProviders();
    }
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
      if (localStorage.getItem(`env_${env}_sms_providers`) ||
        localStorage.getItem(`env_${env}_email_providers`) ||
        localStorage.getItem(`env_${env}_whatsapp_providers`)) {
        envSet.add(env);
      }
    });

    const allEnvs = Array.from(envSet);
    setEnvironments(allEnvs);

    if (allEnvs.length > 0 && !selectedEnv) {
      setSelectedEnv(allEnvs[0]);
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

    updateAllServiceCounts();
  };

  const updateAllServiceCounts = () => {
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

  // Handle save edit
  const handleSaveEdit = () => {
    if (!project) return;

    if (!editForm.name.trim()) {
      alert("Project name is required");
      return;
    }

    const updatedProject = {
      ...project,
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      status: editForm.status,
      updatedAt: new Date().toISOString().split('T')[0],
      updatedBy: "Current User",
    };

    // Update state
    setProject(updatedProject);
    setIsEditing(false);

    // Save to localStorage
    localStorage.setItem(`project_${project.id}`, JSON.stringify(updatedProject));
    localStorage.setItem('currentProject', JSON.stringify(updatedProject));

    // Update in allProjects
    const allProjects = JSON.parse(localStorage.getItem('allProjects') || '[]');
    const updatedAllProjects = allProjects.map((p: Project) =>
      p.id === project.id ? updatedProject : p
    );
    localStorage.setItem('allProjects', JSON.stringify(updatedAllProjects));
    localStorage.setItem(
      `project_${projectId}`,
      JSON.stringify(project)
    );
    // Dispatch event
    window.dispatchEvent(new CustomEvent('projectUpdated', {
      detail: updatedProject
    }));
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    if (project) {
      setEditForm({
        name: project.name,
        description: project.description || "",
        status: project.status,
      });
    }
    setIsEditing(false);
  };

  const handleCreateEnvironment = () => {
    const envToCreate = isCustomEnv && customEnvInput.trim() ? customEnvInput.trim() : (newEnvName || 'Local');
    ['sms', 'email', 'whatsapp'].forEach(service => {
      const key = `env_${envToCreate}_${service}_providers`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify({ providers: [], timestamp: Date.now() }));
      }
    });
    localStorage.setItem('currentProject', JSON.stringify(project));

    // Reload environments so it shows when coming back
    loadEnvironments();
    setSelectedEnv(envToCreate);

    navigate("/dashboard/provider-config", { state: { project, environmentName: envToCreate } });
  };

  const getEnvIcon = (name: string) => {
    const icons: Record<string, string> = {
      'Local': '', 'Dev': '', 'Staging': '', 'Live': ''
    };
    return icons[name] || '';
  };

  const searchResults = (() => {

    if (!globalSearch.trim()) return [];

    const query = globalSearch.toLowerCase();

    const results: any[] = [];

    environments.forEach(env => {

      // ENVIRONMENTS
      if (
        env.toLowerCase().includes(query)
      ) {

        if (
          searchFilter === "ALL" ||
          searchFilter === "ENVIRONMENTS"
        ) {
          results.push({
            type: "environment",
            label: env,
            environment: env
          });
        }
      }

      SERVICE_TYPES.forEach(service => {

        // SERVICES
        if (
          service.toLowerCase().includes(query)
        ) {

          if (
            searchFilter === "ALL" ||
            searchFilter === "SERVICES"
          ) {
            results.push({
              type: "service",
              label: service,
              environment: env,
              service
            });
          }
        }

        // PROVIDERS
        const data = JSON.parse(
          localStorage.getItem(
            `env_${env}_${service.toLowerCase()}_providers`
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
              searchFilter === "PROVIDERS"
            ) {
              results.push({
                type: "provider",
                label: provider.name.replace(/_/g, ' '),
                environment: env,
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

  if (!project) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="project-view-page">
      {/* Top Bar with Heading and Breadcrumbs */}
      <div className="view-top-bar">
        <div className="page-header">
          <h1>View Project</h1>
        </div>
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
                  {project.logo ? (
                    <img src={project.logo} alt="Project logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }} />
                  ) : <FolderOpen size={40} color="#818cf8" />}
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64 = reader.result as string;
                          setProject({ ...project, logo: base64 });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: 'none' }} />
                  <div className="image-overlay-edit"><span>Change</span></div>
                </label>
              </div>
            ) : (
              <div className="project-logo">
                {project.logo ? (
                  <img src={project.logo} alt="Project logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }} />
                ) : <FolderOpen size={40} color="#818cf8" />}
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
                      <input type="text" value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="inline-input" />
                    </div>
                    <div className="form-group-inline" style={{ width: '160px' }}>
                      <label>Status</label>
                      <div className="status-select-wrapper">
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "active" | "inactive" })}
                          className="inline-select-dark"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        <ChevronDown size={14} className="select-arrow" />
                      </div>
                    </div>
                  </div>
                  <div className="form-group-inline">
                    <label>Description</label>
                    <textarea value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="inline-textarea" rows={2} />
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
                    <span className={`status-badge ${project.status}`}>
                      {project.status === "active" ? "Active" : "Inactive"}
                    </span>
                    <button className="edit-icon-inline" onClick={() => setIsEditing(true)} title="Edit project">
                      <Pencil size={15} />
                    </button>
                  </div>

                  <span className="project-date-text">Created on: {project.created}</span>
                </div>
                <p className="project-id-text">#{project.id}</p>
                {project.description && <p className="project-desc-text">{project.description}</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Environment & Provider Section */}
      <div className="environment-section-new">
        {environments.length === 0 ? (
          <div className="pc-fullpage-illustrator" style={{ borderRadius: '16px', marginTop: '0', minHeight: '60vh' }}>
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
                  <div className={`pc-env-option custom ${isCustomEnv ? 'selected' : ''}`}
                    onClick={() => { setIsCustomEnv(true); setNewEnvName(""); }}>
                    <span className="pc-env-option-icon"><Wrench size={18} /></span><span>Custom</span>
                    {isCustomEnv && <Check size={16} />}
                  </div>
                </div>
                {isCustomEnv && <input type="text" placeholder="Enter environment name" value={customEnvInput} onChange={e => setCustomEnvInput(e.target.value)} className="pc-input" autoFocus />}
                <button className="pc-create-first-env-btn" onClick={handleCreateEnvironment}
                  disabled={(!isCustomEnv && !newEnvName) || (isCustomEnv && !customEnvInput.trim())}>
                  Create Environment <Rocket size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Environment Header */}
            <div className="env-header-row">

              <h3 className="env-heading">
                Environments
              </h3>

              <div className="env-header-right">

                {/* SEARCH */}
                <div className="global-search-wrapper">

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
                    navigate("/dashboard/provider-config", {
                      state: {
                        project,
                        action: "ADD_ENVIRONMENT"
                      }
                    });
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
                {environments.map((env) => (
                  <div
                    key={env}
                    className={`env-tab ${selectedEnv === env ? 'active' : ''}`}
                    onClick={() => setSelectedEnv(env)}
                  >
                    <span className="env-tab-name">{env}</span>
                    <div className="env-tab-menu" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="env-menu-trigger"
                        onClick={() => setOpenEnvMenu(openEnvMenu === env ? null : env)}
                      >
                        ⋯
                      </button>
                      {openEnvMenu === env && (
                        <div className="env-menu-dropdown">
                          <button
                            onClick={() => {
                              navigate("/dashboard/provider-config", {
                                state: {
                                  project,
                                  action: "EDIT_ENVIRONMENT",
                                  environmentName: env
                                }
                              });
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              navigate("/dashboard/provider-config", {
                                state: {
                                  project,
                                  action: "CLONE_ENVIRONMENT",
                                  environmentName: env
                                }
                              });
                            }}
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            className="env-menu-item delete"
                            onClick={() => {
                              navigate("/dashboard/provider-config", {
                                state: {
                                  project,
                                  action: "DELETE_ENVIRONMENT",
                                  environmentName: env
                                }
                              });
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

            {/* Service & Environment Info */}


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
                  {SERVICE_TYPES.map((service) => (
                    <div
                      key={service}
                      className={`pc-sidebar-item ${activeService === service ? 'active' : ''}`}
                      onClick={() => setActiveService(service)}
                      style={{
                        borderLeftColor: activeService === service ? SERVICE_COLORS[service] : 'transparent',
                        backgroundColor: activeService === service ? `${SERVICE_COLORS[service]}10` : 'transparent'
                      }}
                    >
                      <span className="pc-sidebar-icon">
                        {service === "SMS" && <MessageSquare size={18} />}
                        {service === "EMAIL" && <Mail size={18} />}
                        {service === "WHATSAPP" && <MessageCircle size={18} />}
                      </span>
                      <div className="pc-sidebar-info">
                        <div className="pc-sidebar-name">{service}</div>
                        <div className="pc-sidebar-count">{serviceProviderCounts[service] || 0} providers</div>
                      </div>
                      {activeService === service && (
                        <div className="pc-sidebar-active-indicator" style={{ background: SERVICE_COLORS[service] }}></div>
                      )}
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
                      {activeService === "SMS" && <MessageSquare size={20} />}
                      {activeService === "EMAIL" && <Mail size={20} />}
                      {activeService === "WHATSAPP" && <MessageCircle size={20} />}
                      <h3>{activeService} Providers</h3>
                      <span className="pc-panel-count">{serviceProviderCounts[activeService] || 0}</span>
                    </div>
                    <button
                      className="pc-add-btn"
                      style={{ backgroundColor: SERVICE_COLORS[activeService] }}
                      onClick={() => {
                        navigate("/dashboard/provider-config", {
                          state: {
                            project,
                            action: "ADD_PROVIDER",
                            environmentName: selectedEnv,
                            service: activeService
                          }
                        });
                      }}
                    >
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
                      providers.map((provider) => (
                        <div
                          key={provider.id}
                          className="pc-provider-card"
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
                              <Plug size={14} />
                              <span>{provider.name.replace(/_/g, ' ')}</span>
                              <span className="pc-configured-badge" style={{
                                background: `${SERVICE_COLORS[activeService]}15`,
                                color: SERVICE_COLORS[activeService]
                              }}>
                                <Check size={10} /> Configured
                              </span>
                            </div>
                            <div className="pc-provider-actions" onClick={(e) => e.stopPropagation()}>
                              <button className="pc-edit-btn" onClick={() => {
                                navigate("/dashboard/provider-config", {
                                  state: {
                                    project,
                                    action: "EDIT_PROVIDER",
                                    environmentName: selectedEnv,
                                    service: activeService,
                                    provider
                                  }
                                });
                              }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                className="pc-delete-btn"
                                onClick={() => {
                                  navigate("/dashboard/provider-config", {
                                    state: {
                                      project,
                                      action: "DELETE_PROVIDER",
                                      environmentName: selectedEnv,
                                      service: activeService,
                                      provider
                                    }
                                  });
                                }}
                              >
                                <Trash2 size={16} />
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
                                    <span className="pc-credential-label">{fieldConfig?.label || key}</span>
                                    <span className="pc-credential-value">
                                      {isPassword
                                        ? (visiblePasswords[passwordKey] ? value : "••••••••••")
                                        : (value || "—")}
                                    </span>
                                    {isPassword && value && (
                                      <button
                                        className="pc-eye-btn-inline"
                                        onClick={() => setVisiblePasswords(prev => ({
                                          ...prev,
                                          [passwordKey]: !prev[passwordKey]
                                        }))}
                                      >
                                        {visiblePasswords[passwordKey] ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
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
      </div>
    </div>
  );
}