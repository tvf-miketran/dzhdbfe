import React, { useMemo } from "react";
import * as theme from "../theme/colors";
import type { ClosedTicketProjectOverview } from "../services/formulas.service";

// --- Types ---

interface RoleMetrics {
  type: string;
  assigned: number;
  completed: number;
  percentage: string;
  loggedHours: number;
  efficiency: number;
}

interface ProjectData {
  id: string;
  projectName: string;
  resources: number;
  roles: RoleMetrics[];
}

// --- Helpers ---

const mapApiToProjectData = (
  apiData: ClosedTicketProjectOverview[],
): ProjectData[] =>
  apiData.map((p) => ({
    id: p.project_id,
    projectName: p.project_name,
    resources: p.resource_allocated,
    roles: p.roles.map((r) => ({
      type: r.role,
      assigned: r.total_assigned_ticket,
      completed: r.completed,
      percentage: `${r.completion.toFixed(1)}%`,
      loggedHours: r.total_logged_hours,
      efficiency: r.efficiency,
    })),
  }));

// --- Helpers ---

const getCompletionClass = (percentage: string): string => {
  const value = parseFloat(percentage);
  if (value >= 100) return theme.completionFull;
  if (value >= 80) return theme.completionHigh;
  if (value >= 60) return theme.completionMid;
  return theme.completionLow;
};

const getRoleBadgeClass = (role: string): string => {
  switch (role.toUpperCase()) {
    case "DEV":
      return theme.badgeDev;
    case "QA":
      return theme.badgeQA;
    case "BA":
      return theme.badgeBA;
    default:
      return theme.badgeDefault;
  }
};

// --- Main Component ---

interface ProjectPerformanceTableProps {
  data?: ClosedTicketProjectOverview[];
  isLoading?: boolean;
}

const ProjectPerformanceTable: React.FC<ProjectPerformanceTableProps> = ({
  data,
  isLoading = false,
}) => {
  const displayData: ProjectData[] = useMemo(
    () => (data ? mapApiToProjectData(data) : []),
    [data],
  );

  return (
    <div className={`mb-8 ${theme.card}`}>
      {/* Card Header */}
      <div className={theme.cardHeaderMuted}>
        <div>
          <h3 className={theme.heading}>Project Performance</h3>
          <p className={theme.subtitle}>
            Ticket completion and efficiency by project &amp; role
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className={theme.tableHead}>
              <th className={`text-left ${theme.thBordered}`}>
                Project's Name
              </th>
              <th className={theme.thBordered}>Resource Allocated</th>
              <th className={theme.thBordered}>Role</th>
              <th className={theme.thBordered}>Total Assigned Ticket</th>
              <th className={theme.thBordered}>Completed</th>
              <th className={theme.thBordered}>Completion (%)</th>
              <th className={theme.thBordered}>Total Logged Hours</th>
              <th className={theme.th}>Efficiency (Hrs / Assigned Ticket)</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr
                  key={`skel-${i}`}
                  className="border-b border-slate-100 animate-pulse"
                >
                  {Array.from({ length: 8 }).map((__, ci) => (
                    <td
                      key={ci}
                      className="px-4 py-3 border-r border-slate-100"
                    >
                      <div className="h-4 rounded bg-slate-200 w-full" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && displayData.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-8 text-center text-sm text-slate-400"
                >
                  No projects match the selected filter.
                </td>
              </tr>
            )}

            {!isLoading &&
              displayData.map((project) =>
                project.roles.map((role, roleIndex) => {
                  const isFirstRole = roleIndex === 0;
                  const isLastRole = roleIndex === project.roles.length - 1;
                  const rowSpan = project.roles.length;

                  return (
                    <tr
                      key={`${project.id}-${role.type}`}
                      className={`hover:bg-slate-50 transition-colors ${
                        isLastRole
                          ? "border-b border-slate-200"
                          : "border-b border-slate-100"
                      }`}
                    >
                      {/* Project Name — spans all role rows */}
                      {isFirstRole && (
                        <td
                          rowSpan={rowSpan}
                          className="px-5 py-3 font-semibold text-slate-900 whitespace-nowrap border-r border-slate-200 align-middle"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0 inline-block" />
                            {project.projectName}
                          </div>
                        </td>
                      )}

                      {/* Resource Allocated — spans all role rows */}
                      {isFirstRole && (
                        <td
                          rowSpan={rowSpan}
                          className="text-center px-4 py-3 border-r border-slate-200 align-middle"
                        >
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20">
                            {project.resources}
                          </span>
                        </td>
                      )}

                      {/* Role badge */}
                      <td className="text-center px-4 py-3 border-r border-slate-100">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wide ${getRoleBadgeClass(role.type)}`}
                        >
                          {role.type}
                        </span>
                      </td>

                      {/* Total Assigned Ticket */}
                      <td className="text-center px-4 py-3 text-slate-700 border-r border-slate-100">
                        {role.assigned}
                      </td>

                      {/* Completed */}
                      <td className="text-center px-4 py-3 text-slate-700 border-r border-slate-100">
                        {role.completed}
                      </td>

                      {/* Completion % */}
                      <td
                        className={`text-center px-4 py-3 border-r border-slate-100 ${getCompletionClass(role.percentage)}`}
                      >
                        {role.percentage}
                      </td>

                      {/* Total Logged Hours */}
                      <td className="text-center px-4 py-3 text-slate-700 border-r border-slate-100">
                        {role.loggedHours.toLocaleString()}
                      </td>

                      {/* Efficiency */}
                      <td className="text-center px-4 py-3 text-slate-700">
                        {role.efficiency.toFixed(2)}
                      </td>
                    </tr>
                  );
                }),
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectPerformanceTable;
