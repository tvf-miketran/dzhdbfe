import React, { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import { useCreateProject, useCreateBank } from "../../hooks/mutations/useProjectsMutations";
import { useBanks } from "../../hooks/queries/useProjectsQueries";
import { createProjectSchema } from "../../utils/validations";
import DateInput from "../DateInput";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialFormState = {
  bankId: "",
  projectRows: [{ name: "", code: "" }],
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

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formState, setFormState] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [newBankName, setNewBankName] = useState("");

  const { data: banksData } = useBanks();
  const bankList = banksData?.data ?? [];

  const { mutate: createProject, isPending: isCreating } = useCreateProject();
  const { mutate: createBank, isPending: isCreatingBank } = useCreateBank({
    onSuccess: (data) => {
      toast.success(`Bank "${data.data.name}" created successfully!`);
      setNewBankName("");
      setIsAddBankModalOpen(false);
      // Set the newly created bank as selected
      setFormState((prev) => ({ ...prev, bankId: data.data.id }));
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create bank");
    },
  });

  const handleClose = () => {
    setFormState(initialFormState);
    setFormErrors({});
    setIsConfirmOpen(false);
    setIsAddBankModalOpen(false);
    setNewBankName("");
    onClose();
  };

  const handleCreateBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim()) {
      toast.error("Please enter a bank name");
      return;
    }
    createBank({ name: newBankName.trim() });
  };

  const handleCloseAddBankModal = () => {
    setIsAddBankModalOpen(false);
    setNewBankName("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setFormErrors({});

      const rawData = {
        projectManager: formState.projectManager.trim(),
        projectRows: formState.projectRows
          .map((row) => ({ name: row.name.trim(), code: row.code.trim() }))
          .filter((row) => row.name && row.code),
        bankId: formState.bankId,
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
          if (field && !errors[field]) {
            errors[field] = issue.message;
          }
        });
        setFormErrors(errors);
        toast.error("Please fix the validation errors");
      }
    }
  };

  const handleConfirmCreate = () => {
    const validRows = formState.projectRows
      .map((row) => ({ name: row.name.trim(), code: row.code.trim() }))
      .filter((row) => row.name && row.code);

    let completedCount = 0;
    let failedCount = 0;

    const tryFinish = () => {
      const total = completedCount + failedCount;
      if (total < validRows.length) return;
      if (completedCount > 0) {
        toast.success(
          `${completedCount} project${completedCount > 1 ? "s" : ""} created successfully!`,
        );
      }
      if (failedCount > 0) {
        toast.error(
          `${failedCount} project${failedCount > 1 ? "s" : ""} failed to create.`,
        );
      }
      if (failedCount === 0) {
        setIsConfirmOpen(false);
        handleClose();
      } else {
        setIsConfirmOpen(false);
      }
    };

    validRows.forEach((row) => {
      createProject(
        {
          name: row.name,
          pmName: formState.projectManager.trim(),
          projectId: row.code,
          bankId: formState.bankId || undefined,
          projectLink: formState.projectLink.trim() || undefined,
          startDate: formState.startDate
            ? toApiDate(formState.startDate)
            : undefined,
          endDate: formState.endDate ? toApiDate(formState.endDate) : undefined,
        },
        {
          onSuccess: () => {
            completedCount++;
            tryFinish();
          },
          onError: (err: unknown) => {
            failedCount++;
            const apiError = err as any;
            if (Array.isArray(apiError?.errors) && apiError.errors.length > 0) {
              apiError.errors.forEach((errorMsg: string) => {
                toast.error(errorMsg, { duration: 5000 });
              });
            } else {
              toast.error(apiError?.message || "Failed to create project");
            }
            tryFinish();
          },
        },
      );
    });
  };

  if (!isOpen) return null;

  const validRowCount = formState.projectRows.filter(
    (r) => r.name.trim() && r.code.trim(),
  ).length;

  return (
    <>
      {/* Main Create Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-border-light h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
            <h2 className="text-lg font-semibold text-slate-900">
              Create Project
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

          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 flex flex-col gap-4">
              {/* Bank */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Bank <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formState.bankId}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "__add_new_bank__") {
                        setIsAddBankModalOpen(true);
                      } else {
                        setFormState((prev) => ({
                          ...prev,
                          bankId: value,
                        }));
                      }
                    }}
                    className={`h-10 w-full rounded-md border bg-surface-light px-3 pr-9 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer ${
                      formErrors.bankId ? "border-red-500" : "border-border-light"
                    }`}
                  >
                    <option value="">Select bank</option>
                    {bankList.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                    <option value="__add_new_bank__" className="font-semibold text-primary">
                      + Add Bank
                    </option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">
                    expand_more
                  </span>
                </div>
                {formErrors.bankId && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.bankId}</p>
                )}
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

              {/* Project rows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        projectRows: [
                          ...prev.projectRows,
                          { name: "", code: "" },
                        ],
                      }))
                    }
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {formState.projectRows.map((row, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] items-center"
                    >
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) =>
                          setFormState((prev) => {
                            const nextRows = [...prev.projectRows];
                            nextRows[index] = {
                              ...nextRows[index],
                              name: e.target.value,
                            };
                            return { ...prev, projectRows: nextRows };
                          })
                        }
                        placeholder="Project name"
                        className="w-full h-10 rounded-md border border-border-light bg-surface-light px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                      <input
                        type="text"
                        value={row.code}
                        onChange={(e) =>
                          setFormState((prev) => {
                            const nextRows = [...prev.projectRows];
                            nextRows[index] = {
                              ...nextRows[index],
                              code: e.target.value,
                            };
                            return { ...prev, projectRows: nextRows };
                          })
                        }
                        placeholder="Project code"
                        className="w-full h-10 rounded-md border border-border-light bg-surface-light px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormState((prev) => {
                            if (prev.projectRows.length === 1) return prev;
                            const nextRows = prev.projectRows.filter(
                              (_, i) => i !== index,
                            );
                            return { ...prev, projectRows: nextRows };
                          })
                        }
                        disabled={formState.projectRows.length === 1}
                        className="h-10 w-10 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Remove project row"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          close
                        </span>
                      </button>
                    </div>
                  ))}
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
                Review &amp; Create
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirm Create Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 flex flex-col gap-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    folder_open
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Confirm Create Project
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    You are about to create{" "}
                    <strong>
                      {validRowCount} project{validRowCount !== 1 ? "s" : ""}
                    </strong>
                    .
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 divide-y divide-slate-200 text-sm max-h-56 overflow-y-auto custom-scrollbar">
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
                {formState.projectRows
                  .filter((r) => r.name.trim() && r.code.trim())
                  .map((row, i) => (
                    <div
                      key={i}
                      className="px-4 py-2.5 flex items-center justify-between gap-2"
                    >
                      <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">
                        Project {i + 1}
                      </span>
                      <div className="text-right">
                        <p className="text-slate-900 font-semibold">
                          {row.name}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {row.code}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 pb-5">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isCreating}
                className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={isCreating}
                className="h-10 rounded-lg bg-primary px-6 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-md disabled:opacity-60 flex items-center gap-2"
              >
                {isCreating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                )}
                Confirm Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Bank Modal */}
      {isAddBankModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  account_balance
                </span>
                <h3 className="text-lg font-semibold text-slate-900">
                  Add New Bank
                </h3>
              </div>
              <button
                onClick={handleCloseAddBankModal}
                disabled={isCreatingBank}
                className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleCreateBank} className="p-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">
                  Bank Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  placeholder="Enter bank name"
                  disabled={isCreatingBank}
                  autoFocus
                  className="h-11 px-4 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseAddBankModal}
                  disabled={isCreatingBank}
                  className="flex-1 h-10 px-4 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBank || !newBankName.trim()}
                  className="flex-1 h-10 px-4 rounded-lg bg-primary hover:bg-emerald-600 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingBank ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">
                        add
                      </span>
                      Add Bank
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateProjectModal;
