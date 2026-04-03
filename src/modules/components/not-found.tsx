import { Home, Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Page not found
          </h2>
          <p className="text-gray-600 leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Don't
            worry, let's get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>

          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 border border-transparent rounded-lg text-white hover:bg-primary-700 transition-colors touch-manipulation"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
