import React, { useState, useEffect } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateNewProject } from "../../hooks/mutations/useProjectsMutations";
import {
  useProjectWithMembers,
  useBanks,
} from "../../hooks/queries/useProjectsQueries";
import { queryKeys } from "../../hooks/queries/queryKeys";
import { createProjectSchema } from "../../utils/validations";
import DateInput from "../DateInput";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

interface EditFormState {
  bankId: string;
  projectName: string;
  projectCode: string;
  projectManager: string;
  startDate: string;
  endDate: string;
  projectLink: string;
}

const emptyForm: EditFormState = {
  bankId: "",
  projectName: "",
  projectCode: "",
  projectManager: "",
  startDate: "",
  endDate: "",
  projectLink: "",
};

/** Convert "YYYY-MM-DD" → "DDMMYYYY" as required by the API */
const toApiDate = (iso: string): string => {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}${month}${year}`;
};

/** Convert ISO datetime string (e.g. "2026-02-19T00:00:00+07:00") → "YYYY-MM-DD" for input[type=date] */
const fromApiDate = (isoString: string): string => {
  if (!isoString) return "";
  // Just take the date portion before the T
  return isoString.split("T")[0] ?? "";
};

const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const [formState, setFormState] = useState<EditFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [hasBeenPreFilled, setHasBeenPreFilled] = useState(false);

  const { data: banksData } = useBanks();
  const bankList = banksData?.data ?? [];

  const { data: projectDetail, isLoading: isDetailLoading } =
    useProjectWithMembers(isOpen ? projectId : "");

  const queryClient = useQueryClient();
  const { mutateAsync: updateProject, isPending: isSaving } =
    useUpdateNewProject();

  // Pre-fill form when project detail loads
  useEffect(() => {
    if (projectDetail?.data && !hasBeenPreFilled) {
      const detail = projectDetail.data;
      setFormState({
        bankId: detail.bankId ?? "",
        projectName: detail.name ?? "",
        projectCode: detail.projectId ?? "",
        projectManager: detail.pmName ?? "",
        startDate: detail.startDate ? fromApiDate(detail.startDate) : "",
        endDate: detail.endDate ? fromApiDate(detail.endDate) : "",
        projectLink: detail.projectLink ?? "",
      });
      setHasBeenPreFilled(true);
    }
  }, [projectDetail, hasBeenPreFilled]);

  const handleClose = () => {
    setFormState(emptyForm);
    setFormErrors({});
    setIsConfirmOpen(false);
    setHasBeenPreFilled(false);
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setFormErrors({});

      const rawData = {
        projectManager: formState.projectManager.trim(),
        projectRows: [
          {
            name: formState.projectName.trim(),
            code: formState.projectCode.trim(),
          },
        ],
        bankId: formState.bankId || undefined,
        projectLink: formState.projectLink.trim() || undefined,
        startDate: formState.startDate || undefined,
        endDate: formState.endDate || undefined,
      };

      createProjectSchema.parse(rawData);
      setIsConfirmOpen(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          const field = issue.path[0]?.toString();
          const subField = issue.path[1]?.toString();
          // Map projectRows[0].name → projectName, etc.
          if (field === "projectRows") {
            if (subField === "name" || issue.path[2] === "name") {
              if (!errors.projectName) errors.projectName = issue.message;
            } else if (subField === "code" || issue.path[2] === "code") {
              if (!errors.projectCode) errors.projectCode = issue.message;
            } else if (!errors.projectRows) {
              errors.projectRows = issue.message;
            }
          } else if (field && !errors[field]) {
            errors[field] = issue.message;
          }
        });
        setFormErrors(errors);
        toast.error("Please fix the validation errors");
      }
    }
  };

  const handleConfirmSave = async () => {
    try {
      await updateProject({
        id: projectId,
        payload: {
          name: formState.projectName.trim(),
          pmName: formState.projectManager.trim(),
          projectId: formState.projectCode.trim(),
          bankId: formState.bankId || undefined,
          projectLink: formState.projectLink.trim() || undefined,
          startDate: formState.startDate
            ? toApiDate(formState.startDate)
            : undefined,
          endDate: formState.endDate ? toApiDate(formState.endDate) : undefined,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.projects.all,
      });
      toast.success("Project updated successfully!");
      setIsConfirmOpen(false);
      handleClose();
    } catch (err: unknown) {
      const apiError = err as any;
      if (Array.isArray(apiError?.errors) && apiError.errors.length > 0) {
        apiError.errors.forEach((errorMsg: string) => {
          toast.error(errorMsg, { duration: 5000 });
        });
      } else {
        toast.error(apiError?.message || "Failed to update project");
      }
      setIsConfirmOpen(false);
    }
  };

  if (!isOpen) return null;

  const projectName = projectDetail?.data?.name ?? "";

  return (
    <>
      {/* Main Edit Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-border-light h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
            <h2 className="text-lg font-semibold text-slate-900">
              Edit Project
            </h2>
            <button
              className="text-slate-400 hover:text-slate-900"
              onClick={handleClose}
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          </div>

          {isDetailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <p className="text-sm text-slate-500">Loading project...</p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 flex flex-col gap-4">
                {/* Bank */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Bank
                  </label>
                  <div className="relative">
                    <select
                      value={formState.bankId}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          bankId: e.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-md border border-border-light bg-surface-light px-3 pr-9 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                    >
                      <option value="">Select bank (optional)</option>
                      {bankList.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Project Manager */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Project Manager <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formState.projectManager}
                    onChange={(e) => {
                      setFormState((prev) => ({
                        ...prev,
                        projectManager: e.target.value,
                      }));
                      if (formErrors.projectManager) {
                        setFormErrors((prev) => ({
                          ...prev,
                          projectManager: "",
                        }));
                      }
                    }}
                    placeholder="Project manager name"
                    className={`w-full h-10 rounded-md border bg-surface-light px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-1 ${
                      formErrors.projectManager
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-border-light focus:ring-primary focus:border-primary"
                    }`}
                  />
                  {formErrors.projectManager && (
                    <p className="text-xs text-red-600 mt-1">
                      {formErrors.projectManager}
                    </p>
                  )}
                </div>

                {/* Project Name & Code */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <input
                        type="text"
                        value={formState.projectName}
                        onChange={(e) => {
                          setFormState((prev) => ({
                            ...prev,
                            projectName: e.target.value,
                          }));
                          if (formErrors.projectName) {
                            setFormErrors((prev) => ({
                              ...prev,
                              projectName: "",
                            }));
                          }
                        }}
                        placeholder="Project name"
                        className={`w-full h-10 rounded-md border bg-surface-light px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-1 ${
                          formErrors.projectName
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-border-light focus:ring-primary focus:border-primary"
                        }`}
                      />
                      {formErrors.projectName && (
                        <p className="text-xs text-red-600 mt-1">
                          {formErrors.projectName}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={formState.projectCode}
                        onChange={(e) => {
                          setFormState((prev) => ({
                            ...prev,
                            projectCode: e.target.value,
                          }));
                          if (formErrors.projectCode) {
                            setFormErrors((prev) => ({
                              ...prev,
                              projectCode: "",
                            }));
                          }
                        }}
                        placeholder="Project code"
                        className={`w-full h-10 rounded-md border bg-surface-light px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-1 ${
                          formErrors.projectCode
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-border-light focus:ring-primary focus:border-primary"
                        }`}
                      />
                      {formErrors.projectCode && (
                        <p className="text-xs text-red-600 mt-1">
                          {formErrors.projectCode}
                        </p>
                      )}
                    </div>
                  </div>
                  {formErrors.projectRows && (
                    <p className="text-xs text-red-600 mt-1">
                      {formErrors.projectRows}
                    </p>
                  )}
                </div>

                {/* Project Link */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Project Link
                  </label>
                  <input
                    type="url"
                    value={formState.projectLink}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        projectLink: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className={`w-full h-10 rounded-md border bg-surface-light px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-1 ${
                      formErrors.projectLink
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-border-light focus:ring-primary focus:border-primary"
                    }`}
                  />
                  {formErrors.projectLink && (
                    <p className="text-xs text-red-600 mt-1">
                      {formErrors.projectLink}
                    </p>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Start Date
                  </label>
                  <DateInput
                    value={formState.startDate}
                    onChange={(val) => {
                      setFormState((prev) => ({ ...prev, startDate: val }));
                      if (formErrors.startDate) {
                        setFormErrors((prev) => ({ ...prev, startDate: "" }));
                      }
                    }}
                    className={`w-full h-10 rounded-md border bg-surface-light px-3 text-sm text-slate-900 outline-none focus:ring-1 ${
                      formErrors.startDate
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-border-light focus:ring-primary focus:border-primary"
                    }`}
                  />
                  {formErrors.startDate && (
                    <p className="text-xs text-red-600 mt-1">
                      {formErrors.startDate}
                    </p>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    End Date
                  </label>
                  <DateInput
                    value={formState.endDate}
                    onChange={(val) => {
                      setFormState((prev) => ({ ...prev, endDate: val }));
                      if (formErrors.endDate) {
                        setFormErrors((prev) => ({ ...prev, endDate: "" }));
                      }
                    }}
                    className={`w-full h-10 rounded-md border bg-surface-light px-3 text-sm text-slate-900 outline-none focus:ring-1 ${
                      formErrors.endDate
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-border-light focus:ring-primary focus:border-primary"
                    }`}
                  />
                  {formErrors.endDate && (
                    <p className="text-xs text-red-600 mt-1">
                      {formErrors.endDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-white">
                <button
                  type="submit"
                  className="h-10 rounded-lg bg-primary px-8 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:bg-emerald-600 transition-all"
                >
                  Review &amp; Save
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Confirm Save Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 flex flex-col gap-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-amber-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-500 text-[20px]">
                    edit_note
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Confirm Save Changes
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Are you sure you want to update{" "}
                    <strong>{projectName || formState.projectName}</strong>?
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 divide-y divide-slate-200 text-sm max-h-56 overflow-y-auto custom-scrollbar">
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">
                    Name
                  </span>
                  <span className="text-slate-900 font-medium truncate">
                    {formState.projectName}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">
                    Code
                  </span>
                  <span className="text-slate-900 font-mono text-xs">
                    {formState.projectCode}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">
                    PM
                  </span>
                  <span className="text-slate-900 font-medium truncate">
                    {formState.projectManager}
                  </span>
                </div>
                {formState.bankId && (
                  <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">
                      Bank
                    </span>
                    <span className="text-slate-900 font-medium truncate">
                      {bankList.find((b) => b.id === formState.bankId)?.name ??
                        formState.bankId}
                    </span>
                  </div>
                )}
                {formState.startDate && (
                  <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">
                      Dates
                    </span>
                    <span className="text-slate-900 font-medium">
                      {new Date(formState.startDate).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "2-digit", year: "numeric" },
                      )}
                      {formState.endDate &&
                        ` → ${new Date(formState.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 pb-5">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isSaving}
                className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="h-10 rounded-lg bg-amber-500 px-6 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-md disabled:opacity-60 flex items-center gap-2"
              >
                {isSaving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditProjectModal;
