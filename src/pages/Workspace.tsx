import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Server,
  Search,
  Zap,
  Code2,
  Database,
  Layers3,
} from "lucide-react";

import styles from "../styles/Workspace.module.css";

/* ==============================
   TYPES
============================== */
interface Service {
  id: string;
  name: string;
}

interface Environment {
  public_id: string;
  environment_name: string;
  services: Service[];
}

interface Project {
  public_id: string;
  project_name: string;
  environments: Environment[];
}

/* ==============================
   MOCK DATA
============================== */
const projectsData: Project[] = [
  {
    public_id: "1",
    project_name: "Internal CRM",
    environments: [
      {
        public_id: "e1",
        environment_name: "Development",
        services: [
          { id: "s1", name: "User API" },
          { id: "s2", name: "Payment API" },
          { id: "s3", name: "Notification API" },
        ],
      },
      {
        public_id: "e2",
        environment_name: "Staging",
        services: [
          { id: "s4", name: "Auth Service" },
          { id: "s5", name: "Gateway API" },
        ],
      },
      {
        public_id: "e3",
        environment_name: "Production",
        services: [
          { id: "s6", name: "Billing API" },
          { id: "s7", name: "Analytics API" },
        ],
      },
    ],
  },

  {
    public_id: "2",
    project_name: "E-Commerce",
    environments: [
      {
        public_id: "e4",
        environment_name: "Production",
        services: [
          { id: "s8", name: "Checkout API" },
          { id: "s9", name: "Orders API" },
        ],
      },
    ],
  },
];

/* ==============================
   COMPONENT
============================== */
const Workspace = () => {
  const [projects, setProjects] =
    useState<Project[]>([]);

  const [expandedProjects, setExpandedProjects] =
    useState<Set<string>>(new Set());

  const [selectedEnvironment, setSelectedEnvironment] =
    useState<{
      project: Project;
      environment: Environment;
    } | null>(null);

  const [selectedService, setSelectedService] =
    useState<Service | null>(null);

  const [search, setSearch] = useState("");

  /* ==============================
     LOAD DATA
  ============================== */
  useEffect(() => {
    setProjects(projectsData);

    const firstProject = projectsData[0];
    const firstEnvironment =
      firstProject.environments[0];

    setExpandedProjects(
      new Set([firstProject.public_id])
    );

    setSelectedEnvironment({
      project: firstProject,
      environment: firstEnvironment,
    });

    setSelectedService(
      firstEnvironment.services[0]
    );
  }, []);

  /* ==============================
     TOGGLE PROJECT
  ============================== */
  const toggleProject = (id: string) => {
    setExpandedProjects((prev) => {
      const updated = new Set(prev);

      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }

      return updated;
    });
  };

  /* ==============================
     SELECT ENVIRONMENT
  ============================== */
  const handleSelectEnvironment = (
    project: Project,
    environment: Environment
  ) => {
    setSelectedEnvironment({
      project,
      environment,
    });

    setSelectedService(
      environment.services[0]
    );
  };

  /* ==============================
     FILTER PROJECTS
  ============================== */
  const filteredProjects = projects.filter(
    (project) =>
      project.project_name
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {/* ==============================
          SIDEBAR
      ============================== */}
      <aside className={styles.sidebar}>
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
        <div className={styles.projectWrapper}>
          {filteredProjects.map((project) => {
            const expanded =
              expandedProjects.has(
                project.public_id
              );

            return (
              <div
                key={project.public_id}
                className={styles.projectCard}
              >
                {/* PROJECT HEADER */}
                <button
                  className={styles.projectHeader}
                  onClick={() =>
                    toggleProject(
                      project.public_id
                    )
                  }
                >
                  <div
                    className={
                      styles.projectLeft
                    }
                  >
                    <Folder size={18} />

                    <span>
                      {project.project_name}
                    </span>
                  </div>

                  {expanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>

                {/* ENVIRONMENTS */}
                {expanded && (
                  <div
                    className={
                      styles.environmentList
                    }
                  >
                    {project.environments.map(
                      (environment) => (
                        <button
                          key={
                            environment.public_id
                          }
                          className={`${styles.environmentButton} ${
                            selectedEnvironment
                              ?.environment
                              .public_id ===
                            environment.public_id
                              ? styles.activeEnvironment
                              : ""
                          }`}
                          onClick={() =>
                            handleSelectEnvironment(
                              project,
                              environment
                            )
                          }
                        >
                          <Server size={15} />

                          <span>
                            {
                              environment.environment_name
                            }
                          </span>
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

      {/* ==============================
          RIGHT SECTION
      ============================== */}
      <div className={styles.rightSection}>
        {/* TOPBAR */}
        <header className={styles.topbar}>
          {/* LEFT */}
          <div className={styles.topbarLeft}>
            <div
              className={styles.breadcrumb}
            >
              <span>
                {
                  selectedEnvironment?.project
                    .project_name
                }
              </span>

              <ChevronRight size={14} />

              <span
                className={
                  styles.activeBreadcrumb
                }
              >
                {
                  selectedEnvironment
                    ?.environment
                    .environment_name
                }
              </span>
            </div>

            {/* SERVICES */}
            <div
              className={
                styles.servicesWrapper
              }
            >
              {selectedEnvironment?.environment.services.map(
                (service) => (
                  <button
                    key={service.id}
                    className={`${styles.serviceButton} ${
                      selectedService?.id ===
                      service.id
                        ? styles.activeService
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedService(
                        service
                      )
                    }
                  >
                    <Zap size={13} />

                    <span>
                      {service.name}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </header>

        {/* CENTER AREA */}
        <main className={styles.mainContent}>
          <div className={styles.centerCard}>
            <div className={styles.serviceIcon}>
              <Code2 size={34} />
            </div>

            <div className={styles.serviceContent}>
              <h1>
                {selectedService?.name}
              </h1>

              <p>
                Service configuration and
                environment details.
              </p>
            </div>
          </div>

          {/* STATS */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <Layers3 size={20} />

              <div>
                <span>Total Services</span>

                <h3>
                  {
                    selectedEnvironment
                      ?.environment.services
                      .length
                  }
                </h3>
              </div>
            </div>

            <div className={styles.statCard}>
              <Database size={20} />

              <div>
                <span>Environment</span>

                <h3>
                  {
                    selectedEnvironment
                      ?.environment
                      .environment_name
                  }
                </h3>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Workspace;