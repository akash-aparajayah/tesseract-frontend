import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  SkipForward,
  Save,
  ChevronDown,
  FolderOpen,
  Server,
  Search,
  Layers3,
  CheckCircle2,
} from "lucide-react";

import Loader from "@/components/common/Loader";
import { useToast } from "../hooks/useToast";
import styles from "../styles/assignProjectsEnv.module.css";

import noData from "../assets/illustration/No-data.svg";

interface Environment {
  id: string;
  name: string;
  status?: "ACTIVE" | "INACTIVE";
}

interface Project {
  id: string;
  name: string;
  description?: string;
  environments: Environment[];
}

const dummyProjects: Project[] = [
  {
    id: "cmp_project_001",
    name: "Project Alpha",
    description: "Core banking management system",
    environments: [
      {
        id: "cmp_env_001",
        name: "Development",
        status: "ACTIVE",
      },
      {
        id: "cmp_env_002",
        name: "Testing",
        status: "ACTIVE",
      },
      {
        id: "cmp_env_003",
        name: "Production",
        status: "INACTIVE",
      },
    ],
  },
  {
    id: "cmp_project_002",
    name: "Project Beta",
    description: "E-commerce platform",
    environments: [
      {
        id: "cmp_env_004",
        name: "UAT",
        status: "ACTIVE",
      },
      {
        id: "cmp_env_005",
        name: "Staging",
        status: "ACTIVE",
      },
    ],
  },
  {
    id: "cmp_project_003",
    name: "Project Gamma",
    description: "Analytics dashboard",
    environments: [
      {
        id: "cmp_env_006",
        name: "Sandbox",
        status: "ACTIVE",
      },
      {
        id: "cmp_env_007",
        name: "QA",
        status: "ACTIVE",
      },
      {
        id: "cmp_env_008",
        name: "Preview",
        status: "INACTIVE",
      },
    ],
  },
];

const AssignProjectsEnv: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();

  const navigate = useNavigate();

  const { showToast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");

  const [expandedProject, setExpandedProject] =
    useState<string | null>(null);

  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        await new Promise((resolve) =>
          setTimeout(resolve, 700)
        );

        setProjects(dummyProjects);

        setExpandedProject(dummyProjects[0]?.id || null);
      } catch (error:unknown) {
        showToast(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred",
        "error"
      );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [showToast]);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;

    return projects.filter((project) =>
      project.name
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [projects, search]);

  const toggleExpand = (projectId: string) => {
    setExpandedProject((prev) =>
      prev === projectId ? null : projectId
    );
  };

  const handleEnvToggle = (
    projectId: string,
    envId: string
  ) => {
    const key = `${projectId}|${envId}`;

    setSelectedPairs((prev) =>
      prev.includes(key)
        ? prev.filter((item) => item !== key)
        : [...prev, key]
    );
  };

  const handleSelectAll = (project: Project) => {
    const envKeys = project.environments.map(
      (env) => `${project.id}|${env.id}`
    );

    const allSelected = envKeys.every((key) =>
      selectedPairs.includes(key)
    );

    if (allSelected) {
      setSelectedPairs((prev) =>
        prev.filter((item) => !envKeys.includes(item))
      );
    } else {
      setSelectedPairs((prev) => [
        ...new Set([...prev, ...envKeys]),
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!userId) return;

    if (selectedPairs.length === 0) {
      showToast(
        "Please select at least one environment",
        "error"
      );

      return;
    }

    try {
      setSubmitting(true);

      const payload = selectedPairs.map((pair) => {
        const [projectId, envId] = pair.split("|");

        return {
          project_id: projectId,
          env_id: envId,
        };
      });

      console.log(payload);

      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      );

      showToast(
        "Projects assigned successfully",
        "success"
      );

      navigate(`/dashboard/user/${userId}`);
    } catch (error: unknown) {
      showToast(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate(`/dashboard/user/${userId}`);
  };

  if (loading) return <Loader />;

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div className={styles.headerTop}>
          <p className={styles.subTitle}>
            Select environments under each project
            for this user.
          </p>

          <button
            className={styles.skipBtn}
            onClick={handleSkip}
          >
            <SkipForward size={16} />
            Skip
          </button>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <Search
              size={16}
              className={styles.searchIcon}
            />

            <input
              type="text"
              placeholder="Search project..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className={styles.searchInput}
            />
          </div>

          <div className={styles.toolbarRight}>
            <div className={styles.statsSection}>
              <div className={styles.statCard}>
                <div className={styles.statTop}>
                  <span className={styles.statLabel}>
                    Projects
                  </span>

                  <div className={styles.statIcon}>
                    <Layers3 size={14} />
                  </div>
                </div>

                <span className={styles.statValue}>
                  {projects.length}
                </span>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statTop}>
                  <span className={styles.statLabel}>
                    Selected
                  </span>

                  <div className={styles.statIcon}>
                    <CheckCircle2 size={14} />
                  </div>
                </div>

                <span className={styles.statValue}>
                  {selectedPairs.length}
                </span>
              </div>
            </div>

            <button
              className={styles.assignBtn}
              onClick={handleSubmit}
              disabled={
                submitting ||
                selectedPairs.length === 0
              }
            >
              <Save size={16} />

              {submitting
                ? "Saving..."
                : "Assign Environments"}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.projectList}>
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const expanded =
              expandedProject === project.id;

            const envKeys =
              project.environments.map(
                (env) =>
                  `${project.id}|${env.id}`
              );

            const selectedCount =
              envKeys.filter((key) =>
                selectedPairs.includes(key)
              ).length;

            const allSelected =
              selectedCount ===
              project.environments.length;

            return (
              <div
                className={styles.projectCard}
                key={project.id}
              >
                <div
                  className={styles.projectHeader}
                >
                  <div
                    className={styles.projectInfo}
                    onClick={() =>
                      toggleExpand(project.id)
                    }
                  >
                    <div
                      className={styles.folderIcon}
                    >
                      <FolderOpen size={20} />
                    </div>

                    <div>
                      <h3>{project.name}</h3>

                      <p>
                        {project.description}
                      </p>
                    </div>
                  </div>

                  <div
                    className={
                      styles.projectActions
                    }
                  >
                    <button
                      className={
                        styles.selectAllBtn
                      }
                      onClick={() =>
                        handleSelectAll(project)
                      }
                    >
                      {allSelected
                        ? "Unselect All"
                        : "Select All"}
                    </button>

                    <div
                      className={
                        styles.selectedBadge
                      }
                    >
                      {selectedCount}/
                      {
                        project.environments
                          .length
                      }
                    </div>

                    <button
                      className={`${styles.expandBtn} ${
                        expanded
                          ? styles.rotate
                          : ""
                      }`}
                      onClick={() =>
                        toggleExpand(project.id)
                      }
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>
                </div>

                <div
                  className={`${styles.environmentWrapper} ${
                    expanded
                      ? styles.expanded
                      : ""
                  }`}
                >
                  <div
                    className={
                      styles.environmentList
                    }
                  >
                    {project.environments.map(
                      (env) => {
                        const key = `${project.id}|${env.id}`;

                        const checked =
                          selectedPairs.includes(
                            key
                          );

                        return (
                          <label
                            key={env.id}
                            className={`${
                              styles.envCard
                            } ${
                              checked
                                ? styles.envSelected
                                : ""
                            }`}
                          >
                            <div
                              className={
                                styles.envLeft
                              }
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  handleEnvToggle(
                                    project.id,
                                    env.id
                                  )
                                }
                              />

                              <div
                                className={
                                  styles.serverIcon
                                }
                              >
                                <Server
                                  size={16}
                                />
                              </div>

                              <div
                                className={
                                  styles.envInfo
                                }
                              >
                                <div
                                  className={
                                    styles.envName
                                  }
                                >
                                  {env.name}
                                </div>

                                <div
                                  className={`${
                                    styles.statusBadge
                                  } ${
                                    env.status ===
                                    "ACTIVE"
                                      ? styles.active
                                      : styles.inactive
                                  }`}
                                >
                                  {env.status}
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <img
              src={noData}
              alt="No Data"
              className={styles.emptyImage}
            />

            <h3>No Projects Found</h3>

            <p>
              Try searching with a different
              project name.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignProjectsEnv;