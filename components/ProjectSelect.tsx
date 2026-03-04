import React from "react";
import { useProjectsPaginated } from "../hooks/queries/useProjectsQueries";

interface ProjectSelectProps {
  value: string;
  onChange: (projectId: string, projectName?: string) => void;
  placeholder?: string;
  className?: string;
  hasError?: boolean;
  disabled?: boolean;
  bankId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

const ProjectSelect: React.FC<ProjectSelectProps> = ({
  value,
  onChange,
  placeholder = "Select a project...",
  className = "",
  hasError = false,
  disabled = false,
  bankId,
  search,
  sortBy = "name",
  sortOrder = "asc",
  page = 1,
  perPage = 100,
}) => {
  const { data: projectsData, isLoading } = useProjectsPaginated({
    page,
    per_page: perPage,
    bank_id: bankId,
    search,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const projects = projectsData?.data?.items ?? [];

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => {
          const selectedId = e.target.value;
          const selectedProject = projects.find((p) => p.id === selectedId);
          onChange(selectedId, selectedProject?.name);
        }}
        disabled={disabled || isLoading}
        className={`h-10 w-full rounded-md border border-border-light bg-surface-light px-3 pr-9 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        <option value="">{placeholder}</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">
        expand_more
      </span>
    </div>
  );
};

export default ProjectSelect;
