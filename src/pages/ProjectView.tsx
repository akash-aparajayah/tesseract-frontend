import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/ProjectView.css";
import {
  Pencil, FolderOpen,
  Plus, MessageSquare, Mail, MessageCircle, Plug, Check
} from 'lucide-react';

interface Project {
  id: number;
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

  // Inline editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    const loadProject = () => {
      const projectData = localStorage.getItem(`project_${projectId}`);
      const currentProject = localStorage.getItem('currentProject');

      let projectToLoad = null;

      if (projectData) {
        projectToLoad = JSON.parse(projectData);
      } else if (currentProject) {
        projectToLoad = JSON.parse(currentProject);
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
    if (selectedEnv) {
      loadProviders();
    }
  }, [selectedEnv, activeService]);

  const loadEnvironments = () => {
    const envNames = ['Local', 'Dev', 'Staging', 'Live'];
    const allKeys = Object.keys(localStorage);
    const customEnvs = new Set<string>();

    allKeys.forEach(key => {
      const match = key.match(/^env_(.+)_(sms|email|whatsapp)_providers$/);
      if (match && !envNames.includes(match[1])) {
        const data = JSON.parse(localStorage.getItem(key) || '{"providers":[]}');
        if (data.providers?.length > 0) {
          customEnvs.add(match[1]);
        }
      }
    });

    const configuredEnvs = envNames.filter(env => {
      const smsKey = `env_${env}_sms_providers`;
      const emailKey = `env_${env}_email_providers`;
      const whatsappKey = `env_${env}_whatsapp_providers`;
      const sms = JSON.parse(localStorage.getItem(smsKey) || '{"providers":[]}');
      const email = JSON.parse(localStorage.getItem(emailKey) || '{"providers":[]}');
      const whatsapp = JSON.parse(localStorage.getItem(whatsappKey) || '{"providers":[]}');
      return (sms.providers?.length || 0) + (email.providers?.length || 0) + (whatsapp.providers?.length || 0) > 0;
    });

    const allEnvs = [...configuredEnvs, ...Array.from(customEnvs)];
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
    localStorage.setItem('currentProject', JSON.stringify(project));
    navigate("/dashboard/provider-config", { state: { project, environmentName: '' } });
  };

  const handleNavigateToProviderConfig = () => {
    if (selectedEnv) {
      navigate(`/dashboard/provider-config/${selectedEnv}`, {
        state: { project, environmentName: selectedEnv, activeService }
      });
    }
  };

  const getEnvIcon = (name: string) => {
    const icons: Record<string, string> = {
      'Local': '', 'Dev': '', 'Staging': '', 'Live': ''
    };
    return icons[name] || '';
  };

  if (!project) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="project-view-page">
      {/* Top Bar with Heading and Breadcrumbs */}
      <div className="view-top-bar">
        <div className="page-header">
          <h1>Project Details</h1>
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
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
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
                    style={{ display: 'none' }}
                  />
                  <div className="image-overlay-edit">
                    <span>Click to Change</span>
                  </div>
                </label>
              </div>
            ) : (
              <div className="project-logo">
                {project.logo ? (
                  <img src={project.logo} alt="Project logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }} />
                ) : '📁'}
              </div>
            )}
          </div>

          <div className="project-info-section">
            {isEditing ? (
              // EDIT MODE
              <>
                <div className="edit-inline-form">
                  <div className="edit-row">
                    <div className="form-group-inline flex-1">
                      <label>Project Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="inline-input"
                      />
                    </div>
                    <div className="form-group-inline" style={{ width: '200px' }}>
                      <label>Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "active" | "inactive" })}
                        className="inline-select"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group-inline">
                    <label>Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="inline-textarea"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="project-meta-grid">
                  <div className="meta-item">
                    <span className="meta-icon"></span>
                    <span className="meta-label">Project ID:</span>
                    <span className="meta-value">#{project.id}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon"></span>
                    <span className="meta-label">Created:</span>
                    <span className="meta-value">{project.created}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon"></span>
                    <span className="meta-label">Created By:</span>
                    <span className="meta-value">{project.createdBy || "Admin"}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon"></span>
                    <span className="meta-label">Last Updated:</span>
                    <span className="meta-value">{project.updatedAt || project.created}</span>
                  </div>
                </div>
              </>
            ) : (
              // VIEW MODE
              <>
                <div className="project-name-row">
                  <h2>{project.name}</h2>
                  <span className={`status-badge ${project.status}`}>
                    {project.status === "active" ? " Active" : " Inactive"}
                  </span>
                </div>

                <div className="project-details-grid">
                  {/* Left Column */}
                  <div className="details-left">
                    <div className="detail-item">
                      <span className="meta-icon"></span>
                      <div className="detail-content">
                        <span className="meta-label">Project ID</span>
                        <span className="meta-value">#{project.id}</span>
                      </div>
                    </div>

                    {/* Description under Project ID */}
                    <div className="detail-item description-item">
                      <span className="meta-icon"></span>
                      <div className="detail-content">
                        <span className="meta-label">Description</span>
                        <span className="meta-value desc-text">{project.description || "No description"}</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="meta-icon"></span>
                      <div className="detail-content">
                        <span className="meta-label">Created By</span>
                        <span className="meta-value">{project.createdBy || "Admin"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="details-right">
                    <div className="detail-item">
                      <span className="meta-icon"></span>
                      <div className="detail-content">
                        <span className="meta-label">Created At</span>
                        <span className="meta-value">{project.created}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <span className="meta-icon"></span>
                      <div className="detail-content">
                        <span className="meta-label">Updated At</span>
                        <span className="meta-value">{project.updatedAt || project.created}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <span className="meta-icon"></span>
                      <div className="detail-content">
                        <span className="meta-label">Last Updated By</span>
                        <span className="meta-value">{project.updatedBy || "Admin"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="project-actions">
            {isEditing ? (
              <>
                <button className="action-btn save" onClick={handleSaveEdit}>
                  Save Changes
                </button>
                <button className="action-btn cancel" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="action-btn edit" onClick={() => setIsEditing(true)}>
                <Pencil size={16} /> Edit Project
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Environment & Provider Section */}
      <div className="environment-section">
        <div className="environment-section-header">
          <div className="environment-section-title">
            <h3>Environment & Providers</h3>
          </div>

          {environments.length > 0 && (
            <div className="env-selector-row">
              <select
                className="env-select"
                value={selectedEnv}
                onChange={(e) => setSelectedEnv(e.target.value)}
              >
                {environments.map(env => (
                  <option key={env} value={env}>
                    {getEnvIcon(env)} {env}
                  </option>
                ))}
              </select>
              <button className="btn-new-env" onClick={handleCreateEnvironment}>
                <Plus size={16} /> New Environment
              </button>
            </div>
          )}
        </div>

        {environments.length === 0 ? (
          <div className="no-env-state">
            <FolderOpen size={48} color="#94a3b8" />
            <h4>No Environments Configured</h4>
            <p>Create your first environment and start configuring providers for SMS, Email & WhatsApp services.</p>
            <button className="btn-create-first-env" onClick={handleCreateEnvironment}>
              <Plus size={16} /> Create First Environment
            </button>
          </div>
        ) : (
          <div className="embedded-provider-config">
            <div className="services-sidebar-embedded">
              {SERVICE_TYPES.map((service) => (
                <div
                  key={service}
                  className={`service-sidebar-item ${activeService === service ? 'active' : ''}`}
                  onClick={() => setActiveService(service)}
                  style={{
                    borderLeftColor: activeService === service ? SERVICE_COLORS[service] : 'transparent',
                    backgroundColor: activeService === service ? `${SERVICE_COLORS[service]}10` : 'transparent'
                  }}
                >
                  <span className="service-sidebar-icon">
                    {service === "SMS" && <MessageSquare size={18} />}
                    {service === "EMAIL" && <Mail size={18} />}
                    {service === "WHATSAPP" && <MessageCircle size={18} />}
                  </span>
                  <div className="service-sidebar-info">
                    <div>{service}</div>
                    <div className="service-sidebar-count">
                      {serviceProviderCounts[service] || 0} provider(s)
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="providers-panel-embedded">
              <div className="providers-panel-header">
                <div className="providers-panel-title">
                  <span className="panel-service-icon">{SERVICE_ICONS[activeService]}</span>
                  {activeService} Providers
                </div>
                <button
                  className="btn-add-provider"
                  style={{ backgroundColor: SERVICE_COLORS[activeService] }}
                  onClick={handleNavigateToProviderConfig}
                >
                  <Plus size={16} /> Add Provider
                </button>
              </div>

              <div className="providers-list-embedded">
                {providers.length === 0 ? (
                  <div className="empty-state-embedded">
                    <FolderOpen size={40} color="#cbd5e1" />                    <h4>No {activeService} providers configured</h4>
                    <p>Add your first provider to get started</p>
                    <button
                      className="btn-empty-action"
                      onClick={handleNavigateToProviderConfig}
                    >
                      <Plus size={16} /> Add Provider
                    </button>
                  </div>
                ) : (
                  providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="provider-card-embedded"
                      style={{ borderTopColor: SERVICE_COLORS[activeService] }}
                      onClick={() => setExpandedProviders(prev => ({
                        ...prev,
                        [provider.id]: !prev[provider.id]
                      }))}
                    >
                      <div className="provider-card-header-embedded">
                        <div className="provider-card-title">
                          <Plug size={16} />
                          {provider.name.replace('_', ' ')}
                          <span className="configured-badge" style={{
                            background: `${SERVICE_COLORS[activeService]}20`,
                            color: SERVICE_COLORS[activeService]
                          }}>
                            <Check size={14} /> Configured
                          </span>
                        </div>
                        <div className="provider-card-actions">
                          <button className="btn-edit-small" onClick={(e) => { e.stopPropagation(); handleNavigateToProviderConfig(); }}>
                            <Pencil size={14} />
                          </button>
                        </div>
                      </div>

                      {expandedProviders[provider.id] && (
                        <div className="provider-card-body" onClick={(e) => e.stopPropagation()}>
                          <div className="credential-mini">
                            {Object.entries(provider.fields).map(([key, value]) => {
                              const fieldConfig = PROVIDER_FIELDS_MAP[provider.name]?.find((f: any) => f.name === key);
                              const isPassword = fieldConfig?.type === "password" || key.includes("Key") || key.includes("Token");
                              const passwordKey = `${provider.id}_${key}`;

                              return (
                                <div className="credential-mini-row" key={key}>
                                  <span className="credential-mini-label">
                                    {fieldConfig?.icon || "📝"} {fieldConfig?.label || key}:
                                  </span>
                                  <span className="credential-mini-value">
                                    {isPassword
                                      ? (visiblePasswords[passwordKey] ? value : "••••••••")
                                      : (value || "—")}
                                  </span>
                                  {isPassword && value && (
                                    <button
                                      className="eye-btn-mini"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setVisiblePasswords((prev: Record<string, boolean>) => ({
                                          ...prev,
                                          [passwordKey]: !prev[passwordKey]
                                        }));
                                      }}
                                    >
                                      {visiblePasswords[passwordKey] ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}