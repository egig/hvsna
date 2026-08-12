import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../use-auth";
import { useFeatureFlag } from "src/modules/feature-flags/useFeatureFlags";
import { validateEmail } from "../validation";

export function SignInView() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const isSignupEnabled = useFeatureFlag("signup");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors.length > 0) setValidationErrors([]);
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.email) {
      errors.push("Email is required");
    } else if (!validateEmail(formData.email)) {
      errors.push("Please enter a valid email address");
    }
    if (!formData.password) errors.push("Password is required");
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await login(formData.email, formData.password);
      navigate("/", { replace: true });
    } catch {
      // error handled by auth context
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
        <p className="text-gray-500 text-sm">Sign in to your account</p>
      </div>

      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
          {validationErrors.map((err, i) => (
            <div key={i} className="text-danger-700 text-sm">
              {err}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
          <div className="text-danger-700 text-sm">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="si-email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="si-email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors text-sm"
            placeholder="Enter your email"
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div>
          <label
            htmlFor="si-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            type="password"
            id="si-password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors text-sm"
            placeholder="Enter your password"
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{" "}
        {isSignupEnabled ? (
          <Link
            to="/signup"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Sign up
          </Link>
        ) : (
          <a
            href="https://recraftory.notion.site/318c304e3c0e809aaaddfadf5b543091"
            className="text-primary-500 font-medium"
          >
            Request Access
          </a>
        )}
      </p>
    </div>
  );
}
