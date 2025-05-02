import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { AuthForm } from "@/components/auth/auth-form";
import { Navbar } from "@/components/layout/navbar";
import { motion } from "framer-motion";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-10 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:space-x-8 md:mt-8">
            <motion.div
              className="md:w-1/2 mb-8 md:mb-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Welcome to CollabVerse
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Join our collaborative platform to connect with innovators and
                  creators worldwide. Whether you have a project idea or want to
                  contribute your skills, CollabVerse helps you build the future
                  together.
                </p>
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    Why join CollabVerse?
                  </h2>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                    <li className="flex items-start">
                      <svg
                        className="h-5 w-5 text-primary-600 mr-2 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Find collaborators with complementary skills
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="h-5 w-5 text-primary-600 mr-2 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Manage projects with real-time collaboration tools
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="h-5 w-5 text-primary-600 mr-2 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Discover innovative projects that match your interests
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="h-5 w-5 text-primary-600 mr-2 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Build your portfolio with meaningful contributions
                    </li>
                  </ul>
                </div>
                <div className="hidden md:block">
                  <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
                    alt="Team collaboration"
                    className="w-full h-auto rounded-lg shadow"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="md:w-1/2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AuthForm />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
