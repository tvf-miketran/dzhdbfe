import React, { useEffect, useRef, useState } from "react";
import { useAllProjects } from "../hooks/queries/useProjectsQueries";
import type { ProjectItem } from "../types/index";

interface ProjectFilterProps {
  /** Currently selected project id, or "All" */
  selectedProject: string;
  onChange: (projectId: string) => void;
}

const ProjectFilter: React.FC<ProjectFilterProps> = ({
  selectedProject,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useAllProjects();

  const projects: ProjectItem[] = data?.data ?? [];

  const selectedLabel =
    selectedProject === "All"
      ? "All"
      : (projects.find((p) => p.id === selectedProject)?.name ?? "All");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative filter-dropdown">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
      >
        <span className="text-slate-500 uppercase tracking-widest">
          Project:
        </span>
        <span className="text-slate-900 max-w-[120px] truncate">
          {selectedLabel}
        </span>
        <span className="material-symbols-outlined text-[14px] text-slate-500">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-20 min-w-[200px] max-h-60 overflow-y-auto custom-scrollbar">
          {/* All option */}
          <button
            key="All"
            onClick={() => {
              onChange("All");
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors first:rounded-t-lg ${
              selectedProject === "All"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-slate-700"
            }`}
          >
            All
          </button>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            </div>
          ) : projects.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">
              No projects found
            </p>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  onChange(project.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors last:rounded-b-lg ${
                  selectedProject === project.id
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-slate-700"
                }`}
              >
                <span className="block truncate">{project.name}</span>
                <span className="block text-[10px] text-slate-400">
                  {project.projectId} · {project.bankName}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectFilter;
