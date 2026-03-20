import React, { useState, useEffect } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import { useEmployee } from "../../hooks/queries/useUserQueries";
import { useUpdateEmployee } from "../../hooks/mutations/useUserMutations";
import {
  updateEmployeeSchema,
  type UpdateEmployeeFormData,
} from "../../utils/validations";

interface EditEmployeeModalProps {
  isOpen: boolean;
  employeeId: string | null;
  onClose: () => void;
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  employeeId,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    vnFullName: "",
    enFullName: "",
    employeeId: "",
    email: "",
    description: "",
    authorizeRole: "MEMBER" as "MEMBER" | "ADMIN",
    status: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch employee detail when modal opens
  const {
    data: employeeDetail,
    isLoading: isLoadingDetail,
    isError: isDetailError,
  } = useEmployee(employeeId ?? "", {
    enabled: isOpen && !!employeeId,
  });

  const updateEmployeeMutation = useUpdateEmployee();

  // Pre-populate form when employee detail is fetched
  useEffect(() => {
    if (employeeDetail?.data) {
      const d = employeeDetail.data;
      setFormData({
        vnFullName: d.vnFullName ?? "",
        enFullName: d.enFullName ?? "",
        employeeId: d.employeeId ?? "",
        email: d.email ?? "",
        description: d.description ?? "",
        authorizeRole: d.authorizeRole ?? "MEMBER",
        status: d.status ?? true,
      });
      setFormErrors({});
    }
  }, [employeeDetail]);

  const handleCloseModal = () => {
    setFormErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || !employeeId) return;

    try {
      setIsSubmitting(true);
      setFormErrors({});

      const trimmedData = {
        ...formData,
        vnFullName: formData.vnFullName.trim(),
        enFullName: formData.enFullName.trim(),
        employeeId: formData.employeeId.trim(),
        email: formData.email.trim(),
        description: formData.description.trim(),
      };

      // Validate with Zod
      const validatedData: UpdateEmployeeFormData =
        updateEmployeeSchema.parse(trimmedData);

      await updateEmployeeMutation.mutateAsync(
        { id: employeeId, data: validatedData },
        {
          onSuccess: (res) => {
            toast.success(res.message || "Employee updated successfully!");
            handleCloseModal();
          },
          onError: (err: any) => {
            const errorData = err?.response?.data;
            if (
              errorData?.errors &&
              Array.isArray(errorData.errors) &&
              errorData.errors.length > 0
            ) {
              toast.error(errorData?.message || "Validation failed", {
                duration: 4000,
              });
              errorData.errors.forEach((msg: string, idx: number) => {
                setTimeout(
                  () => toast.error(msg, { duration: 5000, icon: "⚠️" }),
                  (idx + 1) * 100,
                );
              });
            } else {
              toast.error(
                errorData?.message ||
                  err?.message ||
                  "Failed to update employee",
              );
            }
          },
        },
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0].toString()] = issue.message;
          }
        });
        setFormErrors(errors);
        toast.error("Please fix the validation errors");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-900">Edit Employee</h2>
          <button
            onClick={handleCloseModal}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Loading skeleton */}
        {isLoadingDetail ? (
          <div className="flex-1 p-6 space-y-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        ) : isDetailError ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-10">
            <span className="material-symbols-outlined text-red-400 text-[48px]">
              error
            </span>
            <p className="text-sm text-red-600 font-semibold">
              Failed to load employee details. Please try again.
            </p>
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5">
              {/* Vietnamese Name */}
              <div>
                <label
                  htmlFor="edit-vnFullName"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Vietnamese Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-vnFullName"
                  type="text"
                  value={formData.vnFullName}
                  onChange={(e) =>
                    handleInputChange("vnFullName", e.target.value)
                  }
                  disabled={isSubmitting}
                  className={`w-full h-11 px-4 rounded-lg border bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    formErrors.vnFullName
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300 focus:ring-primary focus:border-primary"
                  }`}
                  placeholder="Nguyễn Văn A"
                />
                {formErrors.vnFullName && (
                  <p className="text-xs text-red-600 mt-1">
                    {formErrors.vnFullName}
                  </p>
                )}
              </div>

              {/* English Name */}
              <div>
                <label
                  htmlFor="edit-enFullName"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  English Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-enFullName"
                  type="text"
                  value={formData.enFullName}
                  onChange={(e) =>
                    handleInputChange("enFullName", e.target.value)
                  }
                  disabled={isSubmitting}
                  className={`w-full h-11 px-4 rounded-lg border bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    formErrors.enFullName
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300 focus:ring-primary focus:border-primary"
                  }`}
                  placeholder="Alex Nguyen"
                />
                {formErrors.enFullName && (
                  <p className="text-xs text-red-600 mt-1">
                    {formErrors.enFullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="edit-employeeId"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Employee ID
                </label>
                <input
                  id="edit-employeeId"
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) =>
                    handleInputChange("employeeId", e.target.value)
                  }
                  disabled={isSubmitting}
                  className={`w-full h-11 px-4 rounded-lg border bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    formErrors.employeeId
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300 focus:ring-primary focus:border-primary"
                  }`}
                  placeholder="EE009"
                />
                {formErrors.employeeId && (
                  <p className="text-xs text-red-600 mt-1">
                    {formErrors.employeeId}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="edit-email"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full h-11 px-4 rounded-lg border bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    formErrors.email
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300 focus:ring-primary focus:border-primary"
                  }`}
                  placeholder="employee@techvify.com.vn"
                />
                {formErrors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="edit-authorizeRole"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="edit-authorizeRole"
                  value={formData.authorizeRole}
                  onChange={(e) =>
                    handleInputChange(
                      "authorizeRole",
                      e.target.value as "MEMBER" | "ADMIN",
                    )
                  }
                  disabled={isSubmitting}
                  className={`w-full h-11 px-4 rounded-lg border bg-white text-slate-900 outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    formErrors.authorizeRole
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300 focus:ring-primary focus:border-primary"
                  }`}
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                {formErrors.authorizeRole && (
                  <p className="text-xs text-red-600 mt-1">
                    {formErrors.authorizeRole}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="edit-description"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  disabled={isSubmitting}
                  rows={3}
                  className={`w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed ${
                    formErrors.description
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300 focus:ring-primary focus:border-primary"
                  }`}
                  placeholder="Software Engineer, Frontend Developer..."
                />
                {formErrors.description && (
                  <p className="text-xs text-red-600 mt-1">
                    {formErrors.description}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <input
                  id="edit-status"
                  type="checkbox"
                  checked={formData.status}
                  onChange={(e) =>
                    handleInputChange("status", e.target.checked)
                  }
                  disabled={isSubmitting}
                  className="w-4 h-4 text-primary bg-white border-slate-300 rounded focus:ring-primary focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label
                  htmlFor="edit-status"
                  className="text-sm font-medium text-slate-700"
                >
                  Active Status
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-white">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditEmployeeModal;
