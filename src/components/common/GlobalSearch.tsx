import { useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import styles from "../../componentStyles/Topbar.module.css";

interface SearchItem {
    type:
    | "project"
    | "environment"
    | "provider"
    | "user";

    label: string;

    subtitle?: string;

    route: string;
}

interface Props {
    projects?: any[];
    environments?: any[];
    providers?: any[];
    users?: any[];
}

export default function GlobalSearch({
    projects = [],
    environments = [],
    providers = [],
    users = [],
}: Props) {

    const navigate = useNavigate();

    const [search, setSearch] =
        useState("");

    const [showDropdown, setShowDropdown] =
        useState(false);

    // BUILD SEARCHABLE ITEMS
    const searchableItems =
        useMemo<SearchItem[]>(() => {

            return [

                // PROJECTS
                ...projects.map((p: any) => ({
                    type: "project" as const,

                    label:
                        p.project_name ||
                        p.name,

                    subtitle: "Project",

                    route:
                        `/dashboard/project/${p.public_id || p.id}/view`,
                })),

                // ENVIRONMENTS
                ...environments.map((e: any) => ({
                    type: "environment" as const,

                    label:
                        e.name ||
                        e.env_name,

                    subtitle:
                        `Environment`,

                    route:
                        `/dashboard/project/${e.project_id}/view`,
                })),

                // PROVIDERS
                ...providers.map((p: any) => ({
                    type: "provider" as const,

                    label:
                        p.provider_name ||
                        p.name ||
                        p.provider?.name,

                    subtitle:
                        `${p.mode || ""} Provider`,

                    route:
                        `/dashboard/project/${p.project_id}/view`,
                })),

                // USERS
                ...users.map((u: any) => ({
                    type: "user" as const,

                    label:
                        u.user_name ||
                        u.name ||
                        u.email,

                    subtitle:
                        u.role || "User",

                    route:
                        `/dashboard/user/${u.public_id || u.id}`,
                })),

            ];

        }, [
            projects,
            environments,
            providers,
            users,
        ]);

    // FILTER RESULTS
    const filteredResults =
        useMemo(() => {

            if (!search.trim()) {
                return [];
            }

            return searchableItems
                .filter(
                    (item) =>
                        item.label &&
                        item.label.trim() !== ""
                )
                .filter(
                    (item) => {

                        const label =
                            item.label || "";

                        return label
                            .toLowerCase()
                            .includes(
                                search.toLowerCase()
                            );

                    }
                );

        }, [
            search,
            searchableItems,
        ]);

    return (
        <div className={styles.searchWrapper}>

            {/* SEARCH INPUT */}
            <div className={styles.searchForm}>

                <FaSearch
                    className={styles.searchIcon}
                />

                <input
                    type="text"
                    placeholder="Search projects, providers, users..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setShowDropdown(true);
                    }}
                    onFocus={() =>
                        setShowDropdown(true)
                    }
                />

            </div>

            {/* DROPDOWN */}
            {showDropdown &&
                search.trim() && (

                    <div
                        className={
                            styles.searchDropdown
                        }
                    >

                        {filteredResults.length > 0 ? (

                            filteredResults.map(
                                (item, index) => (

                                    <div
                                        key={index}
                                        className={
                                            styles.searchResultItem
                                        }
                                        onClick={() => {

                                            navigate(item.route);

                                            setShowDropdown(false);

                                            setSearch("");

                                        }}
                                    >

                                        <div
                                            className={
                                                styles.searchResultLabel
                                            }
                                        >
                                            {item.label}
                                        </div>

                                        <div
                                            className={
                                                styles.searchResultSubtitle
                                            }
                                        >
                                            {item.subtitle}
                                        </div>

                                    </div>
                                )
                            )

                        ) : (

                            <div
                                className={
                                    styles.noSearchResults
                                }
                            >
                                No results found
                            </div>

                        )}

                    </div>
                )}

        </div>
    );
}