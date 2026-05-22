import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Server,
  Activity,
  Copy,
  CheckCircle,
  Search,
  Layers,
  Zap,
  Code,
  User,
  Boxes,
} from "lucide-react";

import styles from "../styles/Workspace.module.css";

// ======================================================
// TYPES
// ======================================================

interface Service {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: string;
  status: "active" | "inactive";
  lastDeployed: string;
}

interface Environment {
  public_id: string;
  environment_name: string;
  services?: Service[];
}

interface Project {
  public_id: string;
  project_name: string;
  environments: Environment[];
}

// ======================================================
// MOCK SERVICES
// ======================================================

const generateServicesForEnv = (
  envName: string
): Service[] => {
  return [
    {
      id: "1",
      name: "User API",
      description:
        "Manage users and authentication",
      endpoint: "/api/v1/users",
      method: "REST",
      status: "active",
      lastDeployed: "2026-05-20",
    },
    {
      id: "2",
      name: "Payment Gateway",
      description:
        "Handle billing and payments",
      endpoint: "/api/v1/payments",
      method: "REST",
      status: "active",
      lastDeployed: "2026-05-18",
    },
    {
      id: "3",
      name: "Notification Service",
      description:
        "Email and push notifications",
      endpoint: "/api/v1/notifications",
      method: "REST",
      status: "active",
      lastDeployed: "2026-05-17",
    },
  ];
};

// ======================================================
// MOCK DATA
// ======================================================

const mockProjects: Project[] = [
  {
    public_id: "1",
    project_name: "Tesseract",
    environments: [
      {
        public_id: "11",
        environment_name: "Development",
        services: generateServicesForEnv(
          "Development"
        ),
      },
      {
        public_id: "12",
        environment_name: "Staging",
        services:
          generateServicesForEnv("Staging"),
      },
      {
        public_id: "13",
        environment_name: "Production",
        services:
          generateServicesForEnv("Production"),
      },
    ],
  },

  {
    public_id: "2",
    project_name: "Internal CRM",
    environments: [
      {
        public_id: "21",
        environment_name: "Development",
        services: generateServicesForEnv(
          "Development"
        ),
      },
    ],
  },
];

// ======================================================
// COMPONENT
// ======================================================

const Workspace = () => {
  const [projects, setProjects] = useState<
    Project[]
  >([]);

  const [expanded, setExpanded] = useState<
    Set<string>
  >(new Set());

  const [selectedEnv, setSelectedEnv] =
    useState<{
      project: Project;
      env: Environment;
    } | null>(null);

  const [selectedService, setSelectedService] =
    useState<Service | null>(null);

  const [search, setSearch] = useState("");

  const [copiedId, setCopiedId] = useState<
    string | null
  >(null);

  // ======================================================
  // INIT
  // ======================================================

  useEffect(() => {
    setProjects(mockProjects);

    const firstProject = mockProjects[0];

    setExpanded(new Set([firstProject.public_id]));

    const firstEnv =
      firstProject.environments[0];

    setSelectedEnv({
      project: firstProject,
      env: firstEnv,
    });

    setSelectedService(
      firstEnv.services?.[0] || null
    );
  }, []);

  // ======================================================
  // FILTER PROJECTS
  // ======================================================

  const filteredProjects = projects.filter(
    (project) =>
      project.project_name
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  // ======================================================
  // TOGGLE PROJECT
  // ======================================================

  const toggleProject = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  // ======================================================
  // SELECT ENVIRONMENT
  // ======================================================

  const selectEnvironment = (
    project: Project,
    env: Environment
  ) => {
    setSelectedEnv({ project, env });

    setSelectedService(
      env.services?.[0] || null
    );
  };

  // ======================================================
  // COPY
  // ======================================================

  const copyToClipboard = async (
    text: string,
    id: string
  ) => {
    await navigator.clipboard.writeText(
      text
    );

    setCopiedId(id);

    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // ======================================================
  // CURRENT SERVICES
  // ======================================================

  const currentServices =
    selectedEnv?.env.services || [];

  return (
    <div className={styles.container}>
      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className={styles.sidebar}>
        {/* LOGO */}

        <div className={styles.workspaceLogo}>
          <Layers size={20} />

          <span>Tesseract</span>
        </div>

        {/* SEARCH */}

        <div className={styles.sidebarSearch}>
          <Search size={16} />

          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        {/* PROJECTS */}

        <div className={styles.projectList}>
          {filteredProjects.map((project) => {
            const isExpanded =
              expanded.has(project.public_id);

            return (
              <div
                key={project.public_id}
                className={styles.projectGroup}
              >
                <div
                  className={styles.projectHeader}
                  onClick={() =>
                    toggleProject(
                      project.public_id
                    )
                  }
                >
                  <FolderOpen
                    size={18}
                    className={styles.folderIcon}
                  />

                  <span
                    className={styles.projectName}
                  >
                    {project.project_name}
                  </span>

                  <span className={styles.chevron}>
                    {isExpanded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </span>
                </div>

                {isExpanded && (
                  <div
                    className={
                      styles.environmentList
                    }
                  >
                    {project.environments.map(
                      (env) => (
                        <button
                          key={env.public_id}
                          className={`${
                            styles.envButton
                          } ${
                            selectedEnv?.env
                              .public_id ===
                            env.public_id
                              ? styles.activeEnv
                              : ""
                          }`}
                          onClick={() =>
                            selectEnvironment(
                              project,
                              env
                            )
                          }
                        >
                          <Server size={14} />

                          {env.environment_name}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ======================================================
          RIGHT AREA
      ====================================================== */}

      <div className={styles.rightArea}>
        {/* ======================================================
            TOP BAR
        ====================================================== */}

        <div className={styles.topBar}>
          <div className={styles.envIndicator}>
            {selectedEnv
              ? `${selectedEnv.project.project_name} / ${selectedEnv.env.environment_name}`
              : "No Environment"}
          </div>

          <div className={styles.topBarServices}>
            {currentServices.map((service) => (
              <button
                key={service.id}
                className={`${
                  styles.servicePill
                } ${
                  selectedService?.id ===
                  service.id
                    ? styles.activeService
                    : ""
                }`}
                onClick={() =>
                  setSelectedService(service)
                }
              >
                <Zap size={14} />

                {service.name}
              </button>
            ))}
          </div>
        </div>

        {/* ======================================================
            MAIN CONTENT
        ====================================================== */}

        <main className={styles.mainContent}>
          {selectedService && (
            <div className={styles.contentCard}>
              {/* HEADER */}

              <div className={styles.serviceHeader}>
                <div
                  className={styles.serviceTitle}
                >
                  <div
                    className={styles.serviceIcon}
                  >
                    <Code size={28} />
                  </div>

                  <div>
                    <h1>
                      {selectedService.name}
                    </h1>

                    <p>
                      {
                        selectedService.description
                      }
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.serviceStatus
                  }
                >
                  <Activity size={14} />

                  Operational
                </div>
              </div>

              {/* DETAILS */}

              <div className={styles.detailsGrid}>
                {/* ENDPOINT */}

                <div
                  className={styles.detailCard}
                >
                  <label>Endpoint</label>

                  <div
                    className={styles.copyRow}
                  >
                    <code>
                      {
                        selectedService.endpoint
                      }
                    </code>

                    <button
                      className={
                        styles.copyBtn
                      }
                      onClick={() =>
                        copyToClipboard(
                          selectedService.endpoint,
                          "endpoint"
                        )
                      }
                    >
                      {copiedId ===
                      "endpoint" ? (
                        <CheckCircle
                          size={16}
                        />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* METHOD */}

                <div
                  className={styles.detailCard}
                >
                  <label>Method</label>

                  <div
                    className={
                      styles.methodBadge
                    }
                  >
                    {selectedService.method}
                  </div>
                </div>

                {/* DEPLOYED */}

                <div
                  className={styles.detailCard}
                >
                  <label>
                    Last Deployed
                  </label>

                  <div
                    className={
                      styles.valueWithIcon
                    }
                  >
                    <Boxes size={15} />

                    {
                      selectedService.lastDeployed
                    }
                  </div>
                </div>

                {/* OWNER */}

                <div
                  className={styles.detailCard}
                >
                  <label>Owner</label>

                  <div
                    className={
                      styles.valueWithIcon
                    }
                  >
                    <User size={15} />

                    Platform Team
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}

              <div
                className={styles.descriptionBox}
              >
                <h3>
                  Service Documentation
                </h3>

                <p>
                  This service belongs to{" "}
                  <strong>
                    {
                      selectedEnv?.env
                        .environment_name
                    }
                  </strong>{" "}
                  environment in{" "}
                  <strong>
                    {
                      selectedEnv?.project
                        .project_name
                    }
                  </strong>
                  . Use endpoint{" "}
                  <code>
                    {
                      selectedService.endpoint
                    }
                  </code>{" "}
                  for integration and API
                  operations.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Workspace;