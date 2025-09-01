import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleMobileSignOut = async () => {
    setIsMobileMenuOpen(false);
    await handleSignOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Brand name and desktop navigation */}
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">TaskManager</h1>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/tasks')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/tasks')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Tasks
                </button>
              </nav>
            </div>

            {/* Desktop user menu */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.user_metadata?.full_name || user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile hamburger button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 relative z-50">
            <div className="container mx-auto px-4 py-2 space-y-1">
              {/* User info */}
              <div className="px-3 py-2 text-sm text-gray-600 border-b border-gray-100 mb-2">
                {user?.user_metadata?.full_name || user?.email}
              </div>
              
              {/* Navigation links */}
              <button
                onClick={() => handleNavigation('/dashboard')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNavigation('/tasks')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/tasks')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Tasks
              </button>
              
              {/* Sign out button */}
              <button
                onClick={handleMobileSignOut}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors mt-2 border-t border-gray-100 pt-3"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile menu backdrop - only shows behind main content */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/25 z-40 md:hidden"
          style={{ top: '64px' }} // Start below the header
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 relative z-20">
        {children}
      </main>
    </div>
  );
};