import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { PageDesktop as Page } from "./page";
import { NavbarDesktop as Navbar } from "./navbar-desktop";
import Block from "@/modules/components/block";
import { HvLoader2 } from "@/modules/icons";
import { useAuth } from "@/modules/auth/use-auth";
import { validateEmail } from "@/modules/auth/validation";

export default function SignInPage() {
  const navigate = useNavigate();
  const { login, loading, isAuthenticated, error } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

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
    } else if (!validateEmail(formData.email)) {
      errors.push("Please enter a valid email address");
    }

    if (!formData.password) {
      errors.push("Password is required");
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
      await login(formData.email, formData.password);
      navigate("/", { replace: true });
    } catch (error) {
      // Error is handled by the auth context
      console.error("Login failed:", error);
    }
  };

  return (
    <Page>
      <Navbar title="Sign In" />
      <Block>
        <div className="mx-auto w-full max-w-md">
          <div className="">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-primary-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-primary-600">Sign in to your account</p>
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
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                {loading ? (
                  <HvLoader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-primary-600">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Block>
    </Page>
  );
}
