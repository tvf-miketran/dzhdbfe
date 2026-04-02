import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { TicketEntry } from "../types/index";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import ProjectSelect from "../components/ProjectSelect";
import {
  useAllProjects,
  useProjectRoles,
} from "../hooks/queries/useProjectsQueries";
import {
  useTickets,
  useTicketTypes,
  useTicketStatuses,
  useWeeks,
} from "../hooks/queries/useTicketsQueries";
import { useUserProfile } from "../hooks/queries/useUserQueries";
import {
  useBulkCreateTickets,
  useBulkDeleteTickets,
  useBulkUpdateTickets,
} from "../hooks/mutations/useTicketsMutations";
import { ExistingTicketsModal } from "../components/modal";
import { ConfirmActionModal } from "../components/modal/confirm";
import {
  ticketsService,
  type BulkTicketItem,
} from "../services/tickets.service";
import FilterDialog from "../components/FilterDialog";
import DraftSelect from "../components/DraftSelect";
import RoleSelect from "../components/RoleSelect";
import Pagination from "../components/pagination/Pagination";

const FALLBACK_TICKET_TYPES = [
  "Feature",
  "Bug Fix",
  "Refactor",
  "Hotfix",
  "Research",
];
const DEFAULT_JIRA_BASE_URL = "https://dzhintl.atlassian.net/browse";

// Sentinel values meaning "not chosen yet"
const NO_MONTH = 0;
const NO_TYPE = "";
const NO_STATUS = "";

type FinalSortKey =
  | "ticketId"
  | "projectName"
  | "employee"
  | "type"
  | "status"
  | "roles"
  | "week"
  | "month";

type SortDirection = "asc" | "desc";

const LogTickets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"draft" | "final">("draft");
  const [draftEntries, setDraftEntries] = useState<TicketEntry[]>(
    [] as TicketEntry[],
  );
  const [finalEntries, setFinalEntries] = useState<TicketEntry[]>([]);
  const [validationError, setValidationError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<{
    ticketId?: boolean;
    project?: boolean;
    roles?: boolean;
  }>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedProjectName, setSelectedProjectName] = useState<string>("");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const roleButtonRef = useRef<HTMLButtonElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const [roleMenuStyle, setRoleMenuStyle] = useState<React.CSSProperties>({});
  const lastSubmittedIdsRef = useRef<Set<string>>(new Set());
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const weekLoadingIdsRef = useRef<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [existingTickets, setExistingTickets] = useState<
    Array<{
      ticketId: string;
      ticket: BulkTicketItem;
    }>
  >([]);
  const [showExistingModal, setShowExistingModal] = useState(false);
  const [isUpdatingExisting, setIsUpdatingExisting] = useState(false);
  const [lastSubmittedPayload, setLastSubmittedPayload] = useState<any>(null);
  const [alreadyExistTickets, setAlreadyExistTickets] = useState<
    Array<{
      ticketId: string;
      entry: TicketEntry;
    }>
  >([]);
  const [showAlreadyExistModal, setShowAlreadyExistModal] = useState(false);
  const [isUpdatingAlreadyExist, setIsUpdatingAlreadyExist] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    open: boolean;
    ids: string[];
  }>({ open: false, ids: [] });
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedFinalIds, setSelectedFinalIds] = useState<Set<string>>(
    new Set(),
  );
  const [finalSort, setFinalSort] = useState<{
    key: FinalSortKey | null;
    direction: SortDirection;
  }>({ key: null, direction: "asc" });

  // Filter states for Final tab
  const [filters, setFilters] = useState({
    search: "",
    ticketTypeId: "",
    ticketStatusId: "",
    sortBy: "",
    sortOrder: "",
    weeks: [] as number[],
    month: 0,
  });

  // Fetch roles from API
  const { data: rolesData = [], isLoading: isLoadingRoles } = useProjectRoles();
  const { data: allProjectsData } = useAllProjects();
  const { data: ticketTypes = [], isLoading: isLoadingTicketTypes } =
    useTicketTypes();
  const { data: ticketStatuses = [], isLoading: isLoadingTicketStatuses } =
    useTicketStatuses();
  const { data: userProfile } = useUserProfile();
  const { mutateAsync: submitTicketsBulk, isPending: isSubmittingFinal } =
    useBulkCreateTickets();
  const { mutateAsync: deleteTicketsBulk, isPending: isDeletingFinal } =
    useBulkDeleteTickets();
  const { mutateAsync: bulkUpdateTickets } = useBulkUpdateTickets();

  // For Final tab: Fetch my own tickets with specific project IDs
  const [isLoadingFinalTab, setIsLoadingFinalTab] = useState(false);
  const [finalTabMyTickets, setFinalTabMyTickets] = useState<TicketEntry[]>([]);
  const [finalTabPage, setFinalTabPage] = useState(1);
  const [finalTabPerPage] = useState(10);
  const [finalTabTotal, setFinalTabTotal] = useState(0);
  const [finalTabTotalPages, setFinalTabTotalPages] = useState(0);

  const draftTypeOptions =
    ticketTypes.length > 0
      ? ticketTypes
          .map((ticketType) => ticketType.name || ticketType.code)
          .filter(Boolean)
      : FALLBACK_TICKET_TYPES;
  const draftStatusOptions = Array.from(
    new Set(
      ticketStatuses
        .map((ticketStatus) => ticketStatus.name || ticketStatus.code)
        .filter(Boolean),
    ),
  ) as string[];

  const findRoleBySelectedValue = (selectedValue: string) => {
    return rolesData.find(
      (role) =>
        role.roleUuid === selectedValue ||
        role.id === selectedValue ||
        role.name === selectedValue,
    );
  };

  const getRoleSubmitId = (selectedValue: string) => {
    const role = findRoleBySelectedValue(selectedValue);
    return role?.roleUuid || role?.id || selectedValue;
  };

  const getTicketTypeIdByName = (typeName: string) => {
    const ticketType = ticketTypes.find(
      (item) => item.name === typeName || item.code === typeName,
    );
    return ticketType?.id || "";
  };

  const getDefaultBugTicketTypeId = () => {
    const bugType = ticketTypes.find(
      (item) =>
        item.name?.toLowerCase() === "bug" ||
        item.code?.toLowerCase() === "bug" ||
        item.code === "BUG",
    );
    return bugType?.id || "";
  };

  const getTicketStatusIdByName = (statusName: string) => {
    const ticketStatus = ticketStatuses.find(
      (item) => item.name === statusName || item.code === statusName,
    );
    return ticketStatus?.id || "";
  };

  const buildTicketLink = (ticketId: string) => {
    return `${DEFAULT_JIRA_BASE_URL}/${ticketId}`;
  };

  const resolveProjectId = (entry: TicketEntry) => {
    if (entry.projectId) return entry.projectId;

    const projects = allProjectsData?.data || [];
    const matchedProject = projects.find(
      (project) =>
        project.name?.trim().toLowerCase() ===
        entry.projectName?.trim().toLowerCase(),
    );

    if (matchedProject?.id) {
      return matchedProject.id;
    }

    if (
      selectedProjectId &&
      selectedProjectName &&
      selectedProjectName.trim().toLowerCase() ===
        entry.projectName?.trim().toLowerCase()
    ) {
      return selectedProjectId;
    }

    return "";
  };

  const isValidUUID = (value: string): boolean => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  };

  const resolveEmployeeId = () => {
    const profile = userProfile as any;
    const candidates = [
      profile?.employeeId,
      profile?.employee_id,
      profile?.id,
      profile?.data?.employeeId,
      profile?.data?.employee_id,
      profile?.data?.id,
    ];

    for (const candidate of candidates) {
      if (candidate && isValidUUID(String(candidate))) {
        return String(candidate);
      }
    }

    return "";
  };

  const fetchMyTickets = async () => {
    setIsLoadingFinalTab(true);
    try {
      let response;

      if (filters.search && filters.search.trim()) {
        response = await ticketsService.searchTickets(filters.search.trim());
      } else {
        response = await ticketsService.getTicketsForMe({
          page: finalTabPage,
          perPage: finalTabPerPage,
          projectId: "",
          search: filters.search || "",
          ticketTypeId: filters.ticketTypeId || "",
          ticketStatusId: filters.ticketStatusId || "",
          week:
            filters.weeks && filters.weeks.length > 0
              ? filters.weeks
              : undefined,
          month: filters.month === 0 ? null : filters.month,
          sortBy: filters.sortBy || "",
          sortOrder: filters.sortOrder || "",
        });
      }

      if (response.success) {
        const rawData = response.data as any;
        const items = Array.isArray(rawData) ? rawData : rawData?.items || [];
        setFinalTabTotal(rawData?.total ?? (Array.isArray(rawData) ? rawData.length : 0));
        setFinalTabTotalPages(rawData?.pages ?? 1);
        const transformedEntries: TicketEntry[] = Array.isArray(items)
          ? items.map((ticket: any) => ({
              id: ticket.id || Math.random().toString(36).substr(2, 9),
              ticketId: ticket.ticketId || ticket.code || ticket.id,
              projectName: ticket.projectName || "Unknown Project",
              projectId: ticket.projectId || "",
              type: ticket.ticketTypeName || ticket.type || "",
              ticketTypeId: ticket.ticketTypeId || "",
              roles: Array.isArray(ticket.roleNames) ? ticket.roleNames : [],
              roleUuids: Array.isArray(ticket.roleUuids)
                ? ticket.roleUuids
                : [],
              status: ticket.ticketStatusName || ticket.status || "",
              ticketStatusId: ticket.ticketStatusId || "",
              timestamp:
                ticket.createdAt ||
                ticket.created_at ||
                new Date().toISOString().split("T")[0],
              week: ticket.week || 1,
              month: ticket.month || new Date().getMonth() + 1,
              length: 0,
              availableWeeks: null,
              weekLoading: false,
            }))
          : [];
        setFinalTabMyTickets(transformedEntries);
      } else {
        setFinalTabMyTickets([]);
        if (response.message) {
          Swal.fire({
            icon: "info",
            title: "No results",
            text: response.message,
            confirmButtonColor: "#64748b",
            timer: 3000,
            timerProgressBar: true,
          });
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch my tickets:", error);
      const msg = error?.message || "Failed to fetch your tickets";
      const isNoResults =
        msg.toLowerCase().includes("no tickets") ||
        msg.toLowerCase().includes("not found") ||
        error?.statusCode === 404;
      setFinalTabMyTickets([]);
      Swal.fire({
        icon: isNoResults ? "info" : "error",
        title: isNoResults ? "No results" : "Error",
        text: msg,
        confirmButtonColor: isNoResults ? "#64748b" : "#ef4444",
        ...(isNoResults ? { timer: 3000, timerProgressBar: true } : {}),
      });
    } finally {
      setIsLoadingFinalTab(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  useEffect(() => {
    if (activeTab !== "final") return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    fetchMyTickets();
  }, [
    activeTab,
    finalTabPage,
    filters.ticketTypeId,
    filters.ticketStatusId,
    filters.sortBy,
    filters.sortOrder,
    filters.weeks,
    filters.month,
  ]);

  useEffect(() => {
    if (activeTab !== "final") return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setFinalTabPage(1);
      fetchMyTickets();
    }, 800);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [filters.search]);

  useEffect(() => {
    setSelectedFinalIds((prev) => {
      let hasRemoved = false;
      const availableIds = new Set(finalTabMyTickets.map((entry) => entry.id));
      const next = new Set<string>();

      prev.forEach((id) => {
        if (availableIds.has(id)) {
          next.add(id);
        } else {
          hasRemoved = true;
        }
      });

      return hasRemoved ? next : prev;
    });
  }, [finalTabMyTickets]);

  const [formData, setFormData] = useState({
    ticketId: "",
    type: NO_TYPE,
    roles: [] as string[],
  });

  const toggleRole = (roleId: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter((r) => r !== roleId)
        : [...prev.roles, roleId],
    }));
    if (fieldErrors.roles) setFieldErrors({ ...fieldErrors, roles: false });
  };

  const computeRoleMenuStyle = useCallback(() => {
    if (!roleButtonRef.current) return;
    const rect = roleButtonRef.current.getBoundingClientRect();
    const menuHeight = 200; // max-h-[200px]
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < menuHeight + 8 && rect.top > spaceBelow;
    setRoleMenuStyle({
      position: "fixed",
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(target) &&
        roleMenuRef.current &&
        !roleMenuRef.current.contains(target)
      ) {
        setIsRoleDropdownOpen(false);
      }
    };

    if (isRoleDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isRoleDropdownOpen]);

  useEffect(() => {
    if (!isRoleDropdownOpen) return;
    const update = () => computeRoleMenuStyle();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [isRoleDropdownOpen, computeRoleMenuStyle]);

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: typeof fieldErrors = {};

    if (!formData.ticketId.trim()) {
      errors.ticketId = true;
      setValidationError("Please fill all required fields");
    }

    if (!selectedProjectId) {
      errors.project = true;
      setValidationError("Please fill all required fields");
    }

    if (formData.roles.length === 0) {
      errors.roles = true;
      setValidationError("Please fill all required fields");
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const ids = formData.ticketId
      .split(/[,;\s\n]+/)
      .map((s) => s.trim())
      .filter((s) => s);

    const ticketIdPattern = /^[a-zA-Z]+-\d+$/;
    const invalidIds = ids.filter((id) => !ticketIdPattern.test(id));

    if (invalidIds.length > 0) {
      setValidationError(
        `Invalid ticket ID format: ${invalidIds.join(", ")}. Expected format: project id-numbers (e.g., ocd-01)`,
      );
      setFieldErrors({ ticketId: true });
      return;
    }

    setValidationError("");
    setFieldErrors({});

    const newEntries: TicketEntry[] = ids.map((ticketId) => {
      const selectedRoles = formData.roles.map((selectedValue) => {
        const role = findRoleBySelectedValue(selectedValue);
        return {
          roleName: role?.name || selectedValue,
          roleSubmitId: getRoleSubmitId(selectedValue),
        };
      });
      const selectedRoleNames = selectedRoles.map((role) => role.roleName);
      const selectedRoleUuids = selectedRoles.map((role) => role.roleSubmitId);

      return {
        id: Math.random().toString(36).substr(2, 9),
        ticketId: ticketId,
        projectName: selectedProjectName || "Unknown Project",
        projectId: selectedProjectId,
        type: NO_TYPE,
        ticketTypeId: "", // user must choose in the draft table
        roles: selectedRoleNames,
        roleUuids: selectedRoleUuids,
        status: NO_STATUS,
        ticketStatusId: "", // user must choose in the draft table
        timestamp: new Date().toISOString().split("T")[0],
        // FIX: new tickets start with NO_MONTH (0) — "Choose month" placeholder
        week: undefined,
        weekLabel: "",
        month: NO_MONTH,
        length: 0,
        availableWeeks: null,
        weekLoading: false,
      };
    });

    setDraftEntries((prev) => [...prev, ...newEntries]);
    toast.success(
      `${newEntries.length} ticket${newEntries.length > 1 ? "s" : ""} added to draft!`,
    );
    setFormData({ ...formData, ticketId: "", roles: [] });
  };

  // ─── Validate draft entries before submitting to final ───────────────────────
  const validateDraftBeforeSubmit = (entries: TicketEntry[]): boolean => {
    const missingType = entries.filter((e) => !e.type || e.type === NO_TYPE);
    const missingStatus = entries.filter(
      (e) => !e.status || e.status === NO_STATUS,
    );
    const missingMonth = entries.filter(
      (e) => !e.month || e.month === NO_MONTH,
    );
    const missingWeek = entries.filter(
      (e) => e.month && e.month !== NO_MONTH && !e.week,
    );

    if (missingType.length > 0) {
      const ids = missingType.map((e) => e.ticketId).join(", ");
      toast.error(`Please select a type for: ${ids}`);
      return false;
    }

    if (missingStatus.length > 0) {
      const ids = missingStatus.map((e) => e.ticketId).join(", ");
      toast.error(`Please select a status for: ${ids}`);
      return false;
    }

    if (missingMonth.length > 0) {
      const ids = missingMonth.map((e) => e.ticketId).join(", ");
      toast.error(`Please select a month for: ${ids}`);
      return false;
    }

    if (missingWeek.length > 0) {
      const ids = missingWeek.map((e) => e.ticketId).join(", ");
      toast.error(`Please select a week for: ${ids}`);
      return false;
    }

    return true;
  };

  const handleSubmitDraft = () => {
    if (draftEntries.length === 0) return;

    const entriesToSubmit = draftEntries;

    if (!validateDraftBeforeSubmit(entriesToSubmit)) return;

    const employeeId = resolveEmployeeId();
    if (!employeeId) {
      toast.error(
        "Cannot resolve valid employeeId from profile. Please re-login and try again.",
      );
      return;
    }

    const normalizedWithMeta = entriesToSubmit.map((entry) => {
      const cleanTicketId = entry.ticketId;
      const resolvedRoleIds = (
        entry.roleUuids && entry.roleUuids.length > 0
          ? entry.roleUuids
          : entry.roles
      )
        .map((roleValue) => getRoleSubmitId(roleValue))
        .filter(Boolean);

      let resolvedTicketTypeId =
        entry.ticketTypeId || getTicketTypeIdByName(entry.type);
      if (!resolvedTicketTypeId) {
        resolvedTicketTypeId = getDefaultBugTicketTypeId();
      }

      const resolvedTicketStatusId =
        entry.ticketStatusId || getTicketStatusIdByName(entry.status);
      const resolvedWeekNumber = entry.week || 1;
      const resolvedMonth = entry.month || new Date().getMonth() + 1;
      const resolvedWeekLabel =
        entry.availableWeeks?.[resolvedWeekNumber - 1]?.name ||
        entry.weekLabel ||
        String(resolvedWeekNumber);

      const normalizedEntry = {
        ticketId: cleanTicketId,
        ticketLink: buildTicketLink(cleanTicketId),
        projectId: resolveProjectId(entry),
        roleIds: resolvedRoleIds,
        employeeId,
        ticketTypeId: resolvedTicketTypeId,
        ticketStatusId: resolvedTicketStatusId,
        week: resolvedWeekLabel,
        month: String(resolvedMonth),
      };

      return {
        ticket: normalizedEntry,
        isExisting: isValidUUID(entry.id),
        originalId: entry.id,
      };
    });

    const invalidEntries = normalizedWithMeta
      .map(({ ticket }) => {
        const errors: string[] = [];
        if (!ticket.projectId) errors.push("projectId");
        if (!ticket.ticketTypeId) errors.push("ticketTypeId");
        if (!ticket.ticketStatusId) errors.push("ticketStatusId");
        if (!ticket.roleIds || ticket.roleIds.length === 0)
          errors.push("roleIds");

        return errors.length > 0 ? { ticketId: ticket.ticketId, errors } : null;
      })
      .filter(Boolean);

    if (invalidEntries.length > 0) {
      console.error("Invalid entries:", invalidEntries);
      const firstError = invalidEntries[0];
      toast.error(
        `Some draft entries are missing required data (${invalidEntries.length}/${normalizedWithMeta.length}). Missing fields: ${firstError.errors.join(", ")}`,
      );
      return;
    }

    const submittedIds = new Set(entriesToSubmit.map((e) => e.id));
    lastSubmittedIdsRef.current = submittedIds;

    const createGroup = normalizedWithMeta
      .filter((x) => !x.isExisting)
      .map((x) => x.ticket);
    const updateGroup = normalizedWithMeta
      .filter((x) => x.isExisting)
      .map((x) => ({ ...x.ticket, id: x.originalId }));

    const clearSubmitted = () => {
      setDraftEntries((prev) => prev.filter((e) => !submittedIds.has(e.id)));
      setSelectedDraftIds((prev) => {
        const next = new Set(prev);
        submittedIds.forEach((id) => next.delete(id));
        return next;
      });
      setActiveTab("final");
      fetchMyTickets();
    };

    const promises: Promise<boolean>[] = [];
    let hasExistingModal = false;

    if (createGroup.length > 0) {
      const createPayload = { tickets: createGroup };
      promises.push(
        submitTicketsBulk(createPayload)
          .then((response) => {
            const responseData = (response as any)?.data ?? response;
            const responseSuccess =
              typeof (response as any)?.success === "boolean"
                ? (response as any).success
                : typeof responseData?.success === "boolean"
                  ? responseData.success
                  : true;
            const responseMessage =
              (response as any)?.message || responseData?.message || "";

            if (responseSuccess === false) {
              if (responseMessage.includes("already exist")) {
                const ticketIdMatch = responseMessage.match(
                  /Ticket IDs?\s+(.+?)\s+already exists?/i,
                );
                if (ticketIdMatch) {
                  const ticketIds = ticketIdMatch[1]
                    .split(",")
                    .map((id: string) => id.trim());

                  const existingEntries = entriesToSubmit.filter((entry) => {
                    const cleanId = entry.ticketId.replace(/ \(\d+\)$/, "");
                    return ticketIds.some(
                      (id: string) => cleanId === id || entry.ticketId === id,
                    );
                  });

                  if (existingEntries.length > 0) {
                    setAlreadyExistTickets(
                      existingEntries.map((entry) => ({
                        ticketId: entry.ticketId.replace(/ \(\d+\)$/, ""),
                        entry,
                      })),
                    );
                    setLastSubmittedPayload(createPayload);
                    setShowAlreadyExistModal(true);
                    hasExistingModal = true;
                    return false;
                  }
                }
              }

              toast.error(responseMessage || "Submit to final failed.");
              return false;
            }

            const data = responseData?.data || responseData;

            if (data.total_created > 0) {
              toast.success(
                `${data.total_created} ticket${data.total_created > 1 ? "s" : ""} created successfully!`,
              );
            }

            if (data.existing && data.existing.length > 0) {
              setExistingTickets(data.existing);
              setLastSubmittedPayload(createPayload);
              setShowExistingModal(true);
              hasExistingModal = true;
              return false;
            }

            return true;
          })
          .catch((error: any) => {
            const message =
              error?.response?.data?.message || "Submit to final failed.";

            if (message.includes("already exist")) {
              const ticketIdMatch = message.match(
                /Ticket IDs?\s+(.+?)\s+already exists?/i,
              );
              if (ticketIdMatch) {
                const ticketIds = ticketIdMatch[1]
                  .split(",")
                  .map((id: string) => id.trim());

                const existingEntries = entriesToSubmit.filter((entry) => {
                  const cleanId = entry.ticketId.replace(/ \(\d+\)$/, "");
                  return ticketIds.some(
                    (id: string) => cleanId === id || entry.ticketId === id,
                  );
                });

                if (existingEntries.length > 0) {
                  setAlreadyExistTickets(
                    existingEntries.map((entry) => ({
                      ticketId: entry.ticketId.replace(/ \(\d+\)$/, ""),
                      entry,
                    })),
                  );
                  setLastSubmittedPayload(createPayload);
                  setShowAlreadyExistModal(true);
                  hasExistingModal = true;
                  return false;
                }
              }
            }

            toast.error(message);
            return false;
          }),
      );
    }

    if (updateGroup.length > 0) {
      promises.push(
        bulkUpdateTickets({ tickets: updateGroup })
          .then((response) => {
            const responseData = (response as any)?.data ?? response;
            const responseSuccess =
              typeof (response as any)?.success === "boolean"
                ? (response as any).success
                : typeof responseData?.success === "boolean"
                  ? responseData.success
                  : true;
            if (responseSuccess === false) {
              const msg =
                (response as any)?.message ||
                responseData?.message ||
                "Update failed.";
              toast.error(msg);
              return false;
            }
            toast.success(
              `${updateGroup.length} ticket${updateGroup.length > 1 ? "s" : ""} updated successfully!`,
            );
            return true;
          })
          .catch((error: any) => {
            toast.error(
              error?.response?.data?.message || "Failed to update tickets.",
            );
            return false;
          }),
      );
    }

    Promise.all(promises).then((results) => {
      if (!hasExistingModal && results.every(Boolean)) {
        clearSubmitted();
      }
    });
  };

  const updateDraftType = (id: string, newType: string) => {
    const idsToUpdate = selectedDraftIds.has(id)
      ? selectedDraftIds
      : new Set([id]);
    setDraftEntries((prev) =>
      prev.map((entry) =>
        idsToUpdate.has(entry.id)
          ? {
              ...entry,
              type: newType,
              ticketTypeId: getTicketTypeIdByName(newType),
            }
          : entry,
      ),
    );
  };

  const updateDraftStatus = (id: string, newStatus: string) => {
    const idsToUpdate = selectedDraftIds.has(id)
      ? selectedDraftIds
      : new Set([id]);
    setDraftEntries((prev) =>
      prev.map((entry) =>
        idsToUpdate.has(entry.id)
          ? {
              ...entry,
              status: newStatus,
              ticketStatusId: getTicketStatusIdByName(newStatus),
            }
          : entry,
      ),
    );
  };

  const handleUpdateExistingTickets = async () => {
    setIsUpdatingExisting(true);

    try {
      const updatePromises = existingTickets.map(async (item) => {
        const existingTicket = item.ticket;

        const submittedTicket = lastSubmittedPayload?.tickets?.find(
          (t: any) => t.ticketId === item.ticketId,
        );

        if (submittedTicket) {
          const updatePayload = {
            ticketId: existingTicket.ticketId,
            ticketLink: submittedTicket.ticketLink,
            projectId: submittedTicket.projectId,
            roleIds: submittedTicket.roleIds,
            employeeId: submittedTicket.employeeId,
            ticketTypeId: submittedTicket.ticketTypeId,
            ticketStatusId: submittedTicket.ticketStatusId,
            week: submittedTicket.week,
            month: submittedTicket.month,
          };

          return ticketsService.bulkUpdateTicket(
            existingTicket.id,
            updatePayload,
          );
        }
      });

      await Promise.all(updatePromises);

      toast.success(
        `${existingTickets.length} existing ticket${existingTickets.length > 1 ? "s" : ""} updated successfully!`,
      );

      setShowExistingModal(false);
      setExistingTickets([]);
      setLastSubmittedPayload(null);
      setDraftEntries((prev) =>
        prev.filter((e) => !lastSubmittedIdsRef.current.has(e.id)),
      );
      setSelectedDraftIds((prev) => {
        const next = new Set(prev);
        lastSubmittedIdsRef.current.forEach((id) => next.delete(id));
        return next;
      });
      setActiveTab("final");
      fetchMyTickets();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to update existing tickets.";
      toast.error(message);
    } finally {
      setIsUpdatingExisting(false);
    }
  };

  const handleSkipExistingTickets = () => {
    setShowExistingModal(false);
    setExistingTickets([]);
    setLastSubmittedPayload(null);
    setDraftEntries((prev) =>
      prev.filter((e) => !lastSubmittedIdsRef.current.has(e.id)),
    );
    setSelectedDraftIds((prev) => {
      const next = new Set(prev);
      lastSubmittedIdsRef.current.forEach((id) => next.delete(id));
      return next;
    });
    setActiveTab("final");
    fetchMyTickets();
  };

  const handleUpdateAlreadyExistTickets = async () => {
    setIsUpdatingAlreadyExist(true);

    try {
      const updatePromises = alreadyExistTickets.map(async (item) => {
        const submittedTicket = lastSubmittedPayload?.tickets?.find(
          (t: any) => {
            const tId = t.ticketId.replace(/ \(\d+\)$/, "");
            return tId === item.ticketId;
          },
        );

        if (submittedTicket) {
          return ticketsService.bulkUpdateTicket(
            item.ticketId,
            submittedTicket,
          );
        }
      });

      await Promise.all(updatePromises);

      toast.success(
        `${alreadyExistTickets.length} existing ticket${alreadyExistTickets.length > 1 ? "s" : ""} updated successfully!`,
      );

      setShowAlreadyExistModal(false);
      setAlreadyExistTickets([]);
      setLastSubmittedPayload(null);
      setDraftEntries((prev) =>
        prev.filter((e) => !lastSubmittedIdsRef.current.has(e.id)),
      );
      setSelectedDraftIds((prev) => {
        const next = new Set(prev);
        lastSubmittedIdsRef.current.forEach((id) => next.delete(id));
        return next;
      });
      setActiveTab("final");
      fetchMyTickets();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to update existing tickets.";
      toast.error(message);
    } finally {
      setIsUpdatingAlreadyExist(false);
    }
  };

  const handleCancelAlreadyExistTickets = () => {
    setShowAlreadyExistModal(false);
    setAlreadyExistTickets([]);
    setLastSubmittedPayload(null);
    setDraftEntries((prev) =>
      prev.filter((e) => !lastSubmittedIdsRef.current.has(e.id)),
    );
    setSelectedDraftIds((prev) => {
      const next = new Set(prev);
      lastSubmittedIdsRef.current.forEach((id) => next.delete(id));
      return next;
    });
    setActiveTab("final");
    fetchMyTickets();
  };

  const updateDraftWeek = (id: string, newWeek: number) => {
    const entryIndex = draftEntries.findIndex((e: TicketEntry) => e.id === id);
    if (entryIndex === -1 || !draftEntries[entryIndex].availableWeeks) return;
    const entry = draftEntries[entryIndex];
    const selectedWeekLabel =
      entry.availableWeeks![newWeek - 1]?.name || String(newWeek);
    const idsToUpdate = selectedDraftIds.has(id)
      ? selectedDraftIds
      : new Set([id]);
    setDraftEntries((prev) =>
      prev.map((entry: TicketEntry) =>
        idsToUpdate.has(entry.id)
          ? {
              ...entry,
              week: newWeek,
              weekLabel: selectedWeekLabel,
            }
          : entry,
      ),
    );
  };

  const updateDraftMonth = (id: string, newMonth: number) => {
    const idsToUpdate = selectedDraftIds.has(id)
      ? selectedDraftIds
      : new Set([id]);
    setDraftEntries((prev) =>
      prev.map((entry: TicketEntry) =>
        idsToUpdate.has(entry.id)
          ? {
              ...entry,
              month: newMonth,
              week: undefined,
              weekLabel: "",
              availableWeeks: null,
              weekLoading: false,
            }
          : entry,
      ),
    );
    if (newMonth !== NO_MONTH) {
      // fetchWeeksForEntry(id, newMonth);
      idsToUpdate.forEach((entryId) => fetchWeeksForEntry(entryId, newMonth));
    }
  };

  const removeRoleFromDraft = (entryId: string, roleToRemove: string) => {
    setDraftEntries((prev) =>
      prev.map((entry) => {
        if (entry.id === entryId) {
          const removeIndex = entry.roles.findIndex(
            (role) => role === roleToRemove,
          );
          const updatedRoles = entry.roles.filter(
            (_, index) => index !== removeIndex,
          );
          const updatedRoleUuids = (entry.roleUuids || []).filter(
            (_, index) => index !== removeIndex,
          );
          return { ...entry, roles: updatedRoles, roleUuids: updatedRoleUuids };
        }
        return entry;
      }),
    );
  };

  const toggleDraftSelection = (id: string) => {
    setSelectedDraftIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAllDraftSelection = () => {
    if (selectedDraftIds.size === draftEntries.length) {
      setSelectedDraftIds(new Set());
    } else {
      setSelectedDraftIds(new Set(draftEntries.map((e) => e.id)));
    }
  };

  const toggleFinalSelection = (id: string) => {
    setSelectedFinalIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllFinalSelection = () => {
    setSelectedFinalIds((prev) => {
      const deletableIds = sortedFinalTabMyTickets
        .filter((entry) => isValidUUID(entry.id))
        .map((entry) => entry.id);

      if (deletableIds.length === 0) {
        return new Set();
      }

      const areAllSelected = deletableIds.every((id) => prev.has(id));
      const next = new Set(prev);

      if (areAllSelected) {
        deletableIds.forEach((id) => next.delete(id));
      } else {
        deletableIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  const confirmAndDeleteFinalTickets = async (ids: string[]) => {
    const validIds = ids.filter((id) => isValidUUID(id));

    if (validIds.length === 0) {
      toast.error("No valid ticket IDs selected for deletion.");
      return;
    }

    setDeleteConfirmModal({ open: true, ids: validIds });
  };

  const handleConfirmDeleteFinalTickets = async () => {
    const validIds = deleteConfirmModal.ids.filter((id) => isValidUUID(id));

    if (validIds.length === 0) {
      toast.error("No valid ticket IDs selected for deletion.");
      setDeleteConfirmModal({ open: false, ids: [] });
      return;
    }

    try {
      const response = await deleteTicketsBulk({ ids: validIds });
      const responseData = (response as any)?.data ?? response;
      const responseSuccess =
        typeof (response as any)?.success === "boolean"
          ? (response as any).success
          : typeof responseData?.success === "boolean"
            ? responseData.success
            : true;

      if (responseSuccess === false) {
        const responseMessage =
          (response as any)?.message ||
          responseData?.message ||
          "Delete tickets failed.";
        toast.error(responseMessage);
        return;
      }

      toast.success(
        `${validIds.length} ticket${validIds.length > 1 ? "s" : ""} deleted successfully!`,
      );

      setSelectedFinalIds((prev) => {
        const next = new Set(prev);
        validIds.forEach((id) => next.delete(id));
        return next;
      });

      setDeleteConfirmModal({ open: false, ids: [] });

      fetchMyTickets();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to delete ticket(s).";
      toast.error(message);
    }
  };

  const handleDeleteFinalTicket = (entry: TicketEntry) => {
    confirmAndDeleteFinalTickets([entry.id]);
  };

  const handleDeleteSelectedFinalTickets = () => {
    const selectedIds = finalTabMyTickets
      .filter((entry) => selectedFinalIds.has(entry.id))
      .map((entry) => entry.id)
      .filter((id) => isValidUUID(id));

    if (selectedIds.length === 0) {
      toast.error("Please select at least one ticket to delete.");
      return;
    }

    confirmAndDeleteFinalTickets(selectedIds);
  };

  const calculateSplits = (length: number): number => {
    if (!length || length < 1) return 1;
    if (length <= 2) return 1;
    if (length <= 5) return 2;
    if (length <= 8) return 3;
    if (length <= 11) return 4;
    if (length <= 14) return 5;
    if (length <= 29) return 6;
    return 7; // 30+
  };

  const fetchWeeksForEntry = async (entryId: string, month: number) => {
    if (weekLoadingIdsRef.current.has(entryId)) return;
    weekLoadingIdsRef.current.add(entryId);

    setDraftEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, weekLoading: true } : e)),
    );

    try {
      const weeksData = await ticketsService.getWeeks(month);
      setDraftEntries((prev) =>
        prev.map((e) => {
          if (e.id !== entryId) return e;
          const shouldAutoSelect = !e.week && weeksData && weeksData.length > 0;
          const autoWeek = shouldAutoSelect ? 1 : e.week;
          const autoWeekLabel = shouldAutoSelect
            ? weeksData[0]?.name || "1"
            : e.weekLabel;
          return {
            ...e,
            availableWeeks: weeksData,
            week: autoWeek,
            weekLabel: autoWeekLabel,
            weekLoading: false,
          };
        }),
      );
    } catch (error) {
      console.error("Failed to fetch weeks:", error);
      setDraftEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, weekLoading: false } : e)),
      );
    } finally {
      weekLoadingIdsRef.current.delete(entryId);
    }
  };

  // Stable debounced toast refs — created once, survive re-renders
  const toastAddRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastRemoveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAddCountRef = useRef(0);
  const pendingRemoveCountRef = useRef(0);

  const addRoleToDraft = (entryId: string, roleValue: string) => {
    const role = findRoleBySelectedValue(roleValue);
    const roleName = role?.name || roleValue;
    const roleUuid = role?.roleUuid || role?.id || roleValue;
    const idsToUpdate = selectedDraftIds.has(entryId)
      ? selectedDraftIds
      : new Set([entryId]);
    setDraftEntries((prev) =>
      prev.map((entry) => {
        if (!idsToUpdate.has(entry.id)) return entry;
        if (entry.roles.includes(roleName)) return entry;
        return {
          ...entry,
          roles: [...entry.roles, roleName],
          roleUuids: [...(entry.roleUuids || []), roleUuid],
        };
      }),
    );
  };

  const toggleRoleInDraft = (entryId: string, roleValue: string) => {
    const role = findRoleBySelectedValue(roleValue);
    const roleName = role?.name || roleValue;
    const roleUuid = role?.roleUuid || role?.id || roleValue;
    const idsToUpdate = selectedDraftIds.has(entryId)
      ? selectedDraftIds
      : new Set([entryId]);
    setDraftEntries((prev) =>
      prev.map((entry) => {
        if (!idsToUpdate.has(entry.id)) return entry;
        const removeIndex = entry.roles.findIndex((r) => r === roleName);
        if (removeIndex !== -1) {
          return {
            ...entry,
            roles: entry.roles.filter((_, i) => i !== removeIndex),
            roleUuids: (entry.roleUuids || []).filter(
              (_, i) => i !== removeIndex,
            ),
          };
        }
        return {
          ...entry,
          roles: [...entry.roles, roleName],
          roleUuids: [...(entry.roleUuids || []), roleUuid],
        };
      }),
    );
  };

  const handleMoveFinalToDraft = (entries: TicketEntry[]) => {
    if (entries.length === 0) return;
    const newDraftEntries = entries.map((entry) => ({
      ...entry,
      length: 0,
      availableWeeks: null,
      weekLoading: false,
    }));
    setDraftEntries((prev) => [...prev, ...newDraftEntries]);
    setFinalTabMyTickets((prev) =>
      prev.filter((e) => !entries.some((se) => se.id === e.id)),
    );
    setSelectedFinalIds((prev) => {
      const next = new Set(prev);
      entries.forEach((e) => next.delete(e.id));
      return next;
    });
    setActiveTab("draft");
    newDraftEntries.forEach((entry) => {
      if (entry.month && entry.month !== NO_MONTH) {
        fetchWeeksForEntry(entry.id, entry.month);
      }
    });
    toast.success(
      `${entries.length} ticket${
        entries.length > 1 ? "s" : ""
      } moved to draft for editing!`,
    );
  };
  const debouncedToastAdd = (count: number) => {
    pendingAddCountRef.current += count;
    if (toastAddRef.current) clearTimeout(toastAddRef.current);
    toastAddRef.current = setTimeout(() => {
      const n = pendingAddCountRef.current;
      pendingAddCountRef.current = 0;
      toast.success(`Added ${n} ticket${n > 1 ? "s" : ""}!`);
    }, 500);
  };

  const debouncedToastRemove = (count: number) => {
    pendingRemoveCountRef.current += count;
    if (toastRemoveRef.current) clearTimeout(toastRemoveRef.current);
    toastRemoveRef.current = setTimeout(() => {
      const n = pendingRemoveCountRef.current;
      pendingRemoveCountRef.current = 0;
      toast.success(`Removed ${n} ticket${n > 1 ? "s" : ""}!`);
    }, 500);
  };

  const updateDraftLength = (id: string, newLength: number) => {
    const idsToUpdate = selectedDraftIds.has(id)
      ? selectedDraftIds
      : new Set([id]);

    if (idsToUpdate.size > 1) {
      setDraftEntries((prev) =>
        prev.map((entry) =>
          idsToUpdate.has(entry.id) ? { ...entry, length: newLength } : entry,
        ),
      );
      return;
    }

    setDraftEntries((prev) => {
      const entryIndex = prev.findIndex((e) => e.id === id);
      if (entryIndex === -1) return prev;

      const entry = prev[entryIndex];
      const oldLength = entry.length || 0;

      const oldSplits = calculateSplits(oldLength);
      const newSplits = calculateSplits(newLength);
      const difference = newSplits - oldSplits;

      const baseName = entry.ticketId.replace(/ \(\d+\)$/, "");

      // Find the index of the FIRST entry in this ticket's group
      const groupStartIndex = prev.findIndex(
        (e) => e.ticketId.replace(/ \(\d+\)$/, "") === baseName,
      );

      const allSameTicketEntries = prev.filter(
        (e) => e.ticketId.replace(/ \(\d+\)$/, "") === baseName,
      );

      // Everything before the group
      const beforeGroup = prev.slice(0, groupStartIndex);
      // Everything after the group
      const afterGroup = prev.slice(
        groupStartIndex + allSameTicketEntries.length,
      );

      const resetMonthWeek = {
        month: NO_MONTH,
        week: undefined as number | undefined,
        weekLabel: "",
        availableWeeks: null,
        weekLoading: false,
      };

      if (difference === 0) {
        const updated = allSameTicketEntries.map((e) => ({
          ...e,
          length: newLength,
        }));
        return [...beforeGroup, ...updated, ...afterGroup];
      }

      const template = entry;

      if (difference > 0) {
        const updatedExisting = allSameTicketEntries.map((e, idx) => ({
          ...e,
          ticketId: `${baseName} (${idx + 1})`,
          length: newLength,
          ...resetMonthWeek,
        }));

        const newOnes: TicketEntry[] = [];
        for (let i = 0; i < difference; i++) {
          newOnes.push({
            ...template,
            id: Math.random().toString(36).substr(2, 9),
            ticketId: `${baseName} (${updatedExisting.length + newOnes.length + 1})`,
            length: newLength,
            ...resetMonthWeek,
          });
        }

        debouncedToastAdd(difference);
        return [...beforeGroup, ...updatedExisting, ...newOnes, ...afterGroup];
      } else {
        const keepCount = allSameTicketEntries.length + difference;
        const kept = allSameTicketEntries.slice(0, Math.max(keepCount, 1));

        const updatedKept = kept.map((e, idx) => ({
          ...e,
          ticketId: kept.length === 1 ? baseName : `${baseName} (${idx + 1})`,
          length: newLength,
          ...resetMonthWeek,
        }));

        debouncedToastRemove(Math.abs(difference));
        return [...beforeGroup, ...updatedKept, ...afterGroup];
      }
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      // Red family
      case "Bug Fix":
      case "Bug":
        return "bg-red-100 text-red-700 border-red-200";
      // Orange family
      case "Enquiry":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Incident":
        return "bg-rose-100 text-rose-700 border-rose-200";
      // Yellow family
      case "Improvement":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      // Green family
      case "Feature":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Task":
        return "bg-teal-100 text-teal-700 border-teal-200";
      // Cyan family
      case "Docs":
        return "bg-cyan-100 text-cyan-700 border-cyan-200";
      // Blue family
      case "Refactor":
        return "bg-blue-100 text-blue-700 border-blue-200";
      // case 'Enquiry':return 'bg-sky-100 text-sky-700 border-sky-200';
      // Purple family
      case "Sub-task":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Epic":
        return "bg-violet-100 text-violet-700 border-violet-200";
      case "Story":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      // Pink family
      case "Improvement":
        return "bg-pink-100 text-pink-700 border-pink-200";
      case "Miscellaneous":
        return "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200";
      // Unset / placeholder — no color emphasis
      default:
        return "bg-white text-slate-400 border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      // Not started / open
      case "Open":
      case "Backlog":
        return "bg-slate-100 text-slate-600 border-slate-300";
      // Analysis / planning
      case "Analysis Review":
      case "Design & Analysis":
        return "bg-purple-50 text-purple-700 border-purple-200";
      // Active development
      case "Development":
      case "In Progress":
      case "InProgress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      // Code / peer review
      case "Code Review":
      case "In Review":
      case "InReview":
      case "Review":
        return "bg-violet-50 text-violet-700 border-violet-200";
      // QA
      case "In QA":
      case "InQA":
      case "QA":
        return "bg-sky-50 text-sky-700 border-sky-200";
      // Deployment
      case "Deployment":
      case "Released":
      case "Deployed":
        return "bg-teal-50 text-teal-700 border-teal-200";
      // Blocked / waiting
      case "Blocked":
        return "bg-red-50 text-red-600 border-red-200";
      case "On Hold":
      case "Pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Waiting":
        return "bg-amber-50 text-amber-700 border-amber-200";
      // Done
      case "Done":
      case "Resolved":
      case "Closed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      // Cancelled / rejected
      case "Reject":
      case "Rejected":
      case "Cancelled":
      case "Canceled":
        return "bg-rose-50 text-rose-600 border-rose-200";
      // Unset / placeholder — no color emphasis
      default:
        return "bg-white text-slate-400 border-slate-200";
    }
  };

  const handleFinalSort = (key: FinalSortKey) => {
    setFinalSort((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });
  };

  const getFinalSortIcon = (key: FinalSortKey) => {
    if (finalSort.key !== key) return "unfold_more";
    return finalSort.direction === "asc" ? "arrow_upward" : "arrow_downward";
  };

  const sortedFinalTabMyTickets = useMemo(() => {
    if (!finalSort.key) {
      return finalTabMyTickets;
    }

    const getComparableValue = (entry: TicketEntry, key: FinalSortKey) => {
      switch (key) {
        case "ticketId":
          return entry.ticketId || "";
        case "projectName":
          return entry.projectName || "";
        case "employee":
          return entry.roles?.[0] || "";
        case "type":
          return entry.type || "";
        case "roles":
          return (entry.roles || []).join(", ");
        case "status":
          return entry.status || "";
        case "week":
          return entry.week || 0;
        case "month":
          return entry.month || 0;
        default:
          return "";
      }
    };

    const sorted = [...finalTabMyTickets].sort((a, b) => {
      const valueA = getComparableValue(a, finalSort.key!);
      const valueB = getComparableValue(b, finalSort.key!);

      let result = 0;

      if (typeof valueA === "number" && typeof valueB === "number") {
        result = valueA - valueB;
      } else {
        result = String(valueA).localeCompare(String(valueB), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }

      return finalSort.direction === "asc" ? result : -result;
    });

    return sorted;
  }, [finalSort, finalTabMyTickets]);

  const deletableFinalIds = useMemo(
    () =>
      sortedFinalTabMyTickets
        .filter((entry) => isValidUUID(entry.id))
        .map((entry) => entry.id),
    [sortedFinalTabMyTickets],
  );

  const selectedDeletableFinalIds = useMemo(
    () => deletableFinalIds.filter((id) => selectedFinalIds.has(id)),
    [deletableFinalIds, selectedFinalIds],
  );

  const areAllDeletableFinalSelected =
    deletableFinalIds.length > 0 &&
    selectedDeletableFinalIds.length === deletableFinalIds.length;

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 animate-in fade-in duration-500">
      {/* Existing Tickets Modal */}
      <ExistingTicketsModal
        isOpen={showExistingModal}
        existingTickets={existingTickets}
        onUpdate={handleUpdateExistingTickets}
        onSkip={handleSkipExistingTickets}
        isUpdating={isUpdatingExisting}
      />

      <ConfirmActionModal
        isOpen={deleteConfirmModal.open}
        title="Confirm Delete"
        message={
          deleteConfirmModal.ids.length === 1
            ? "Are you sure you want to delete this ticket? This action cannot be undone."
            : `Are you sure you want to delete ${deleteConfirmModal.ids.length} tickets? This action cannot be undone.`
        }
        icon="delete"
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isPending={isDeletingFinal}
        onCancel={() => setDeleteConfirmModal({ open: false, ids: [] })}
        onConfirm={handleConfirmDeleteFinalTickets}
      />

      {/* Already Exist Tickets Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
          showAlreadyExistModal
            ? "bg-black/50 opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() =>
          !isUpdatingAlreadyExist && handleCancelAlreadyExistTickets()
        }
      >
        <div
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-[24px]">
              warning
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                Tickets Already Exist
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                These tickets already exist in the system. Would you like to
                update them?
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            <div className="p-6 space-y-3">
              {alreadyExistTickets.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest">
                        Ticket ID
                      </p>
                      <p className="font-mono font-bold text-slate-900 mt-1">
                        {item.ticketId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest">
                        Project
                      </p>
                      <p className="text-slate-700 mt-1">
                        {item.entry.projectName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest">
                        Type
                      </p>
                      <p
                        className={`inline-flex px-2 py-1 rounded text-xs font-semibold uppercase ${getTypeColor(item.entry.type)}`}
                      >
                        {item.entry.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest">
                        Status
                      </p>
                      <p
                        className={`inline-flex px-2 py-1 rounded text-xs font-semibold uppercase ${getStatusColor(item.entry.status)}`}
                      >
                        {item.entry.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest">
                        Roles
                      </p>
                      <p className="text-slate-700 mt-1">
                        {item.entry.roles.join(", ") || "None"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest">
                        Length (days)
                      </p>
                      <p className="text-slate-700 mt-1">
                        {item.entry.length || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
            <button
              onClick={handleCancelAlreadyExistTickets}
              disabled={isUpdatingAlreadyExist}
              className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateAlreadyExistTickets}
              disabled={isUpdatingAlreadyExist}
              className="h-10 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white text-sm font-semibold transition-colors flex items-center gap-2"
            >
              {isUpdatingAlreadyExist ? (
                <>
                  <span className="inline-flex w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Updating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    update
                  </span>
                  Update Tickets
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("draft")}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-full transition-colors ${
              activeTab === "draft"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Draft ({draftEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("final")}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-full transition-colors ${
              activeTab === "final"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Final ({finalTabTotal})
          </button>
        </div>

        {activeTab === "draft" && (
          <button
            type="button"
            onClick={handleSubmitDraft}
            disabled={draftEntries.length === 0 || isSubmittingFinal}
            className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-semibold shadow-md transition-colors hover:bg-emerald-600 disabled:bg-slate-300 disabled:text-slate-500"
          >
            {isSubmittingFinal
              ? "Submitting..."
              : `Submit to Final (${draftEntries.length})`}
          </button>
        )}
      </div>

      {activeTab === "draft" && (
        <>
          <div className="bg-surface-light border border-border-light rounded-xl shadow-lg overflow-visible">
            <div className="px-6 py-4 border-b border-border-light bg-slate-50 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[18px]">
                add_task
              </span>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-widest">
                Draft Ticket Entry
              </h3>
            </div>

            <form
              onSubmit={handleAddTicket}
              className="p-6 flex flex-col gap-4"
            >
              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-600">
                  <span className="material-symbols-outlined text-[16px]">
                    error
                  </span>
                  {validationError}
                </div>
              )}

              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">
                    Ticket ID(s)
                  </label>
                  <input
                    type="text"
                    value={formData.ticketId}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        ticketId: e.target.value.toUpperCase(),
                      });
                      if (fieldErrors.ticketId)
                        setFieldErrors({ ...fieldErrors, ticketId: false });
                    }}
                    placeholder="e.g. ODC-123, ODC-124"
                    className={`h-10 px-3 rounded-lg border bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition-all ${
                      fieldErrors.ticketId
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-slate-300 focus:ring-primary focus:border-primary"
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-2 flex-1 min-w-[180px]">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">
                    Project
                  </label>
                  <ProjectSelect
                    value={selectedProjectId}
                    onChange={(projectId, projectName) => {
                      setSelectedProjectId(projectId);
                      setSelectedProjectName(projectName || "");
                      if (fieldErrors.project)
                        setFieldErrors({ ...fieldErrors, project: false });
                    }}
                    placeholder="Select a project..."
                    hasError={fieldErrors.project}
                  />
                </div>

                <div
                  className="flex flex-col gap-2 flex-1 min-w-[200px]"
                  ref={roleDropdownRef}
                >
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">
                    Roles
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      ref={roleButtonRef}
                      onClick={() => {
                        if (!isRoleDropdownOpen) computeRoleMenuStyle();
                        setIsRoleDropdownOpen(!isRoleDropdownOpen);
                      }}
                      disabled={isLoadingRoles || rolesData.length === 0}
                      className={`h-10 w-full px-3 rounded-lg border bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer transition-all disabled:bg-slate-100 disabled:text-slate-500 text-left flex items-center justify-between ${
                        fieldErrors.roles
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300"
                      }`}
                    >
                      <span className="truncate">
                        {formData.roles.length === 0
                          ? "Select roles..."
                          : formData.roles.length === 1
                            ? findRoleBySelectedValue(formData.roles[0])
                                ?.name || "Select roles..."
                            : `${formData.roles.length} roles selected`}
                      </span>
                      <span
                        className={`material-symbols-outlined text-slate-400 text-[16px] transition-transform ${isRoleDropdownOpen ? "rotate-180" : ""}`}
                      >
                        expand_more
                      </span>
                    </button>

                    {isRoleDropdownOpen && createPortal(
                      <div
                        ref={roleMenuRef}
                        style={roleMenuStyle}
                        className="bg-white border border-slate-300 rounded-lg shadow-2xl max-h-[200px] overflow-y-auto"
                      >
                        {isLoadingRoles ? (
                          <div className="p-3 text-sm text-slate-500">
                            Loading roles...
                          </div>
                        ) : rolesData.length === 0 ? (
                          <div className="p-3 text-sm text-red-500">
                            No roles available
                          </div>
                        ) : (
                          <div className="py-2">
                            {rolesData.map((role) => (
                              <label
                                key={role.roleUuid || role.id}
                                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.roles.includes(
                                    role.roleUuid || role.id,
                                  )}
                                  onChange={() =>
                                    toggleRole(role.roleUuid || role.id)
                                  }
                                  className="w-4 h-4 text-primary bg-white border border-slate-300 rounded cursor-pointer focus:ring-2 focus:ring-primary"
                                />
                                <span className="text-sm text-slate-900">
                                  {role.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>,
                      document.body,
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="h-10 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    add_circle
                  </span>
                  Add to Draft
                </button>
              </div>
            </form>
          </div>

          <div className="bg-surface-light border border-border-light rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border-light bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">
                Draft Tickets
              </h3>
              {/* <span className="text-xs font-semibold py-1 px-3 bg-primary/10 text-primary border border-primary/20 rounded-full">
                {draftEntries.length} {draftEntries.length === 1 ? 'Entry' : 'Entries'}
              </span> */}
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-border-light">
                  <tr>
                    <th className="py-4 px-4 text-center w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedDraftIds.size === draftEntries.length &&
                          draftEntries.length > 0
                        }
                        onChange={toggleAllDraftSelection}
                        className="w-4 h-4 text-primary bg-white border border-slate-300 rounded cursor-pointer focus:ring-2 focus:ring-primary"
                      />
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Ticket ID
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-left">
                      Project
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Type
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Role
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Status
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Week
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Month
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Length (days)
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {draftEntries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">
                            inbox
                          </span>
                          <p className="text-slate-500 font-medium">
                            No draft tickets yet
                          </p>
                          <p className="text-slate-400 text-sm">
                            Add a ticket entry to get started
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    draftEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="py-4 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedDraftIds.has(entry.id)}
                            onChange={() => toggleDraftSelection(entry.id)}
                            className="w-4 h-4 text-primary bg-white border border-slate-300 rounded cursor-pointer focus:ring-2 focus:ring-primary"
                          />
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="font-bold text-slate-900 text-sm">
                            {entry.ticketId}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-left">
                          <span className="text-sm font-medium text-slate-700">
                            {entry.projectName}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <DraftSelect
                            value={entry.type}
                            onChange={(val) => updateDraftType(entry.id, val)}
                            placeholder="Choose type"
                            options={draftTypeOptions.map((t) => ({
                              value: t,
                              label: t,
                            }))}
                            activeColorClass={getTypeColor(entry.type)}
                            disabled={
                              isLoadingTicketTypes && ticketTypes.length === 0
                            }
                            maxWidth="150px"
                          />
                        </td>
                        <td className="py-4 px-6 text-center">
                          <RoleSelect
                            selectedRoles={entry.roles}
                            options={rolesData.map((role) => ({
                              value: role.roleUuid || role.id,
                              label: role.name || "",
                            }))}
                            onToggle={(val) =>
                              val && toggleRoleInDraft(entry.id, val)
                            }
                            disabled={isLoadingRoles || rolesData.length === 0}
                            isLoading={isLoadingRoles}
                            maxWidth="160px"
                          />
                        </td>
                        <td className="py-4 px-6 text-center">
                          <DraftSelect
                            value={entry.status}
                            onChange={(val) => updateDraftStatus(entry.id, val)}
                            placeholder="Choose status"
                            options={draftStatusOptions.map((s) => ({
                              value: s,
                              label: s,
                            }))}
                            activeColorClass={getStatusColor(entry.status)}
                            disabled={
                              isLoadingTicketStatuses &&
                              ticketStatuses.length === 0
                            }
                            maxWidth="140px"
                          />
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="relative inline-block w-full max-w-[280px]">
                            <select
                              value={entry.week || ""}
                              onChange={(e) =>
                                updateDraftWeek(
                                  entry.id,
                                  parseInt(e.target.value),
                                )
                              }
                              disabled={
                                !entry.availableWeeks ||
                                entry.weekLoading ||
                                !entry.month ||
                                entry.month === NO_MONTH
                              }
                              className={`w-full h-8 pl-2 pr-7 rounded border text-xs font-semibold text-slate-700 appearance-none outline-none cursor-pointer transition-all ${
                                !entry.availableWeeks ||
                                entry.weekLoading ||
                                !entry.month ||
                                entry.month === NO_MONTH
                                  ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                              }`}
                            >
                              {(!entry.month ||
                                entry.month === NO_MONTH ||
                                entry.availableWeeks === null) && (
                                <option value="">Choose month first</option>
                              )}
                              {entry.availableWeeks &&
                                entry.availableWeeks.length === 0 && (
                                  <option value="">No weeks available</option>
                                )}
                              {entry.availableWeeks?.map((week, idx) => (
                                <option key={week.id || idx} value={idx + 1}>
                                  {week.name}
                                </option>
                              ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none text-slate-500">
                              expand_more
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <DraftSelect
                            value={entry.month || NO_MONTH}
                            onChange={(val) =>
                              updateDraftMonth(entry.id, parseInt(val))
                            }
                            placeholder="Choose month"
                            options={Array.from(
                              { length: 12 },
                              (_, i) => i + 1,
                            ).map((m) => ({
                              value: String(m),
                              label: new Date(2000, m - 1).toLocaleString(
                                "default",
                                { month: "long" },
                              ),
                            }))}
                            activeColorClass="border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                            maxWidth="130px"
                          />
                        </td>
                        <td className="py-4 px-6 text-center">
                          {(() => {
                            const splitMatch =
                              entry.ticketId.match(/ \((\d+)\)$/);
                            const isSplitChild =
                              splitMatch !== null &&
                              parseInt(splitMatch[1]) > 1;
                            return (
                              <input
                                type="number"
                                value={entry.length || 0}
                                onChange={(e) =>
                                  updateDraftLength(
                                    entry.id,
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                placeholder="1"
                                min="1"
                                step="0.5"
                                disabled={isSplitChild}
                                title={
                                  isSplitChild
                                    ? "Edit length on the first entry"
                                    : undefined
                                }
                                className={`w-16 h-7 px-2 rounded border text-xs outline-none transition-all ${
                                  isSplitChild
                                    ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary"
                                }`}
                              />
                            );
                          })()}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => {
                              setDraftEntries((prev) =>
                                prev.filter((e) => e.id !== entry.id),
                              );
                              toast.success("Draft ticket deleted!");
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete ticket"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "final" && (
        <div className="bg-surface-light border border-border-light rounded-xl shadow-lg overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border-light bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">
                Final Tickets
              </h3>
              {isLoadingFinalTab && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="inline-flex w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  Loading...
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">
                  tune
                </span>
                Filters
              </button>
              <button
                type="button"
                onClick={() => {
                  const selectedEntries = sortedFinalTabMyTickets.filter((e) =>
                    selectedFinalIds.has(e.id),
                  );
                  handleMoveFinalToDraft(selectedEntries);
                }}
                disabled={
                  selectedFinalIds.size === 0 ||
                  isDeletingFinal ||
                  isLoadingFinalTab
                }
                className="h-9 px-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">
                  edit
                </span>
                Move to Draft ({selectedFinalIds.size})
              </button>
              <button
                type="button"
                onClick={handleDeleteSelectedFinalTickets}
                disabled={
                  selectedDeletableFinalIds.length === 0 ||
                  isDeletingFinal ||
                  isLoadingFinalTab
                }
                className="h-9 px-3 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 transition-colors flex items-center gap-2"
              >
                {isDeletingFinal ? (
                  <>
                    <span className="inline-flex w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">
                      delete_sweep
                    </span>
                    Delete ({selectedDeletableFinalIds.length})
                  </>
                )}
              </button>
              <span className="text-xs font-semibold py-1 px-3 bg-primary/10 text-primary border border-primary/20 rounded-full">
                {finalTabMyTickets.length}{" "}
                {finalTabMyTickets.length === 1 ? "Entry" : "Entries"}
              </span>
            </div>
          </div>

          <FilterDialog
            isOpen={isFilterOpen}
            filters={filters}
            onFilterChange={(newFilters) => {
              setFilters(newFilters);
              setFinalTabPage(1);
            }}
            showSortBy={false}
            showSortOrder={false}
            showWeeks={false}
            onReset={() => {
              setFilters({
                search: "",
                ticketTypeId: "",
                ticketStatusId: "",
                sortBy: "",
                sortOrder: "",
                weeks: [],
                month: 0,
              });
              setFinalTabPage(1);
            }}
          />
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-border-light">
                <tr>
                  <th className="py-4 px-4 text-center w-10">
                    <input
                      type="checkbox"
                      checked={areAllDeletableFinalSelected}
                      onChange={toggleAllFinalSelection}
                      disabled={
                        deletableFinalIds.length === 0 || isDeletingFinal
                      }
                      className="w-4 h-4 text-primary bg-white border border-slate-300 rounded cursor-pointer disabled:cursor-not-allowed focus:ring-2 focus:ring-primary"
                    />
                  </th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                    <button
                      type="button"
                      onClick={() => handleFinalSort("ticketId")}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      Ticket ID
                      <span className="material-symbols-outlined text-[14px]">
                        {getFinalSortIcon("ticketId")}
                      </span>
                    </button>
                  </th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-left">
                    <button
                      type="button"
                      onClick={() => handleFinalSort("projectName")}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      Project
                      <span className="material-symbols-outlined text-[14px]">
                        {getFinalSortIcon("projectName")}
                      </span>
                    </button>
                  </th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-left">
                    <button
                      type="button"
                      onClick={() => handleFinalSort("employee")}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      Employee
                      <span className="material-symbols-outlined text-[14px]">
                        {getFinalSortIcon("employee")}
                      </span>
                    </button>
                  </th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                    <button
                      type="button"
                      onClick={() => handleFinalSort("type")}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      Type
                      <span className="material-symbols-outlined text-[14px]">
                        {getFinalSortIcon("type")}
                      </span>
                    </button>
                  </th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                    <button
                      type="button"
                      onClick={() => handleFinalSort("status")}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      Status
                      <span className="material-symbols-outlined text-[14px]">
                        {getFinalSortIcon("status")}
                      </span>
                    </button>
                  </th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                    <button
                      type="button"
                      onClick={() => handleFinalSort("roles")}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      Roles
                      <span className="material-symbols-outlined text-[14px]">
                        {getFinalSortIcon("roles")}
                      </span>
                    </button>
                  </th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                    <button
                      type="button"
                      onClick={() => handleFinalSort("week")}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      Week
                      <span className="material-symbols-outlined text-[14px]">
                        {getFinalSortIcon("week")}
                      </span>
                    </button>
                  </th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                    <button
                      type="button"
                      onClick={() => handleFinalSort("month")}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      Month
                      <span className="material-symbols-outlined text-[14px]">
                        {getFinalSortIcon("month")}
                      </span>
                    </button>
                  </th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {finalTabMyTickets.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">
                          inbox
                        </span>
                        <p className="text-slate-500 font-medium">
                          No final tickets yet
                        </p>
                        <p className="text-slate-400 text-sm">
                          You have no assigned tickets
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedFinalTabMyTickets.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedFinalIds.has(entry.id)}
                          onChange={() => toggleFinalSelection(entry.id)}
                          disabled={!isValidUUID(entry.id) || isDeletingFinal}
                          className="w-4 h-4 text-primary bg-white border border-slate-300 rounded cursor-pointer disabled:cursor-not-allowed focus:ring-2 focus:ring-primary"
                          title={
                            !isValidUUID(entry.id)
                              ? "Ticket ID is invalid for delete API"
                              : undefined
                          }
                        />
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="font-bold text-slate-900 text-sm">
                          {entry.ticketId}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-left">
                        <span className="text-sm font-medium text-slate-700">
                          {entry.projectName}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-left">
                        <span className="text-sm text-slate-600">
                          {entry.roles?.length > 0 ? entry.roles[0] : "-"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded border text-xs font-semibold uppercase tracking-tight ${getTypeColor(entry.type)}`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded border text-xs font-semibold uppercase tracking-tight ${getStatusColor(entry.status)}`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-wrap gap-1 justify-center items-center">
                          {entry.roles && entry.roles.length === 0 ? (
                            <span className="text-xs text-slate-400">
                              No roles
                            </span>
                          ) : (
                            entry.roles?.map((role, index) => (
                              <span
                                key={index}
                                className="inline-flex px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium"
                              >
                                {role}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-xs font-semibold text-slate-700">
                          {entry.week || "-"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-xs text-slate-700">
                          {entry.month
                            ? new Date(2000, entry.month - 1).toLocaleString(
                                "default",
                                { month: "long" },
                              )
                            : "-"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveFinalToDraft([entry])}
                            disabled={isDeletingFinal}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:text-slate-300 disabled:hover:bg-transparent"
                            title="Move to draft for editing"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              edit
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFinalTicket(entry)}
                            disabled={!isValidUUID(entry.id) || isDeletingFinal}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:text-slate-300 disabled:hover:bg-transparent"
                            title={
                              !isValidUUID(entry.id)
                                ? "Ticket ID is invalid for delete API"
                                : "Delete ticket"
                            }
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {finalTabTotalPages > 1 && (
            <Pagination
              currentPage={finalTabPage}
              totalPages={finalTabTotalPages}
              total={finalTabTotal}
              perPage={finalTabPerPage}
              onPageChange={setFinalTabPage}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default LogTickets;
