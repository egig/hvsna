import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Page } from "src/modules/navigation";
import { Navbar } from "src/modules/navigation";
import Block from "src/modules/components/block";
import { useAuth } from "../use-auth";
import { getAuthUseCases } from "../../../infra/auth/AuthServiceFactory";

const authService = getAuthUseCases();

export default function SignUpPage() {
  const navigate = useNavigate();
  const { register, loading, isAuthenticated, error } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.email) {
      errors.push("Email is required");
    } else if (!authService.validateEmail(formData.email)) {
      errors.push("Please enter a valid email address");
    }

    const passwordValidation = authService.validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    if (formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
      });
      navigate("/", { replace: true });
    } catch (error) {
      // Error is handled by the auth context
      console.error("Registration failed:", error);
    }
  };

  return (
    <Page>
      <Navbar title="Sign Up" />
      <Block>
        <div className="mx-auto w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-primary-100 p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-primary-900 mb-2">
                Create Account
              </h1>
              <p className="text-primary-600">Join us today</p>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-danger-700 text-sm">
                    {error}
                  </div>
                ))}
              </div>
            )}

            {/* Auth Error */}
            {error && (
              <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                <div className="text-danger-700 text-sm">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-primary-700 mb-2"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                    placeholder="First name"
                    disabled={loading}
                    autoComplete="given-name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-primary-700 mb-2"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                    placeholder="Last name"
                    disabled={loading}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-primary-700 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                  placeholder="Enter your email"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-primary-700 mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                  placeholder="Create a password"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-primary-700 mb-2"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                  placeholder="Confirm your password"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-primary-600">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Block>
    </Page>
  );
}
