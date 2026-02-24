import React, { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import { useCreateEmployee } from "../../hooks/mutations/useUserMutations";
import {
  createEmployeeSchema,
  type CreateEmployeeFormData,
} from "../../utils/validations";

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    vnFullName: "",
    enFullName: "",
    email: "",
    employeeId: "",
    description: "",
    password: "",
    authorizeRole: "MEMBER" as "MEMBER" | "ADMIN",
    status: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createEmployeeMutation = useCreateEmployee();

  const handleCloseModal = () => {
    setFormData({
      vnFullName: "",
      enFullName: "",
      email: "",
      employeeId: "",
      description: "",
      password: "",
      authorizeRole: "MEMBER",
      status: true,
    });
    setFormErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setFormErrors({});

      // Trim all string values
      const trimmedData = {
        ...formData,
        vnFullName: formData.vnFullName.trim(),
        enFullName: formData.enFullName.trim(),
        email: formData.email.trim(),
        employeeId: formData.employeeId.trim(),
        description: formData.description.trim(),
        password: formData.password.trim(),
      };

      // Validate with ZOD
      const validatedData = createEmployeeSchema.parse(trimmedData);

      // Call mutation
      await createEmployeeMutation.mutateAsync(validatedData);

      toast.success("Employee created successfully!");
      handleCloseModal();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle ZOD validation errors
        const errors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0].toString()] = issue.message;
          }
        });
        setFormErrors(errors);
        toast.error("Please fix the validation errors");
      } else {
        // Handle API errors (interceptor transforms to ApiError shape)
        const apiError = error as any;
        if (Array.isArray(apiError?.errors) && apiError.errors.length > 0) {
          apiError.errors.forEach((errorMsg: string) => {
            toast.error(errorMsg, { duration: 5000 });
          });
        } else {
          toast.error(apiError?.message || "Failed to create employee");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-900">
            Create New Employee
          </h2>
          <button
            onClick={handleCloseModal}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5">
            {/* Vietnamese Name */}
            <div>
              <label
                htmlFor="vnFullName"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Vietnamese Name <span className="text-red-500">*</span>
              </label>
              <input
                id="vnFullName"
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
                htmlFor="enFullName"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                English Name <span className="text-red-500">*</span>
              </label>
              <input
                id="enFullName"
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
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
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
                <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
              )}
            </div>

            {/* Employee ID */}
            <div>
              <label
                htmlFor="employeeId"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Employee ID <span className="text-red-500">*</span>
              </label>
              <input
                id="employeeId"
                type="text"
                value={formData.employeeId}
                onChange={(e) =>
                  handleInputChange("employeeId", e.target.value)
                }
                disabled={isSubmitting}
                className={`w-full h-11 px-4 rounded-lg border bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed ${
                  formErrors.employeeId
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-slate-300 focus:ring-primary focus:border-primary"
                }`}
                placeholder="T0762"
              />
              {formErrors.employeeId && (
                <p className="text-xs text-red-600 mt-1">
                  {formErrors.employeeId}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                disabled={isSubmitting}
                className={`w-full h-11 px-4 rounded-lg border bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed ${
                  formErrors.password
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-slate-300 focus:ring-primary focus:border-primary"
                }`}
                placeholder="Min 6 characters"
              />
              {formErrors.password && (
                <p className="text-xs text-red-600 mt-1">
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Authorize Role */}
            <div>
              <label
                htmlFor="authorizeRole"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="authorizeRole"
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
                htmlFor="description"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
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
                id="status"
                type="checkbox"
                checked={formData.status}
                onChange={(e) => handleInputChange("status", e.target.checked)}
                disabled={isSubmitting}
                className="w-4 h-4 text-primary bg-white border-slate-300 rounded focus:ring-primary focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label
                htmlFor="status"
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
                  Creating...
                </>
              ) : (
                "Create Employee"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEmployeeModal;
