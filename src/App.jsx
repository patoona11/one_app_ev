import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/common/Navbar';
import DisclaimerBanner from './components/common/DisclaimerBanner';
import AuthModal from './components/common/AuthModal';
import TripPlanner from './components/planner/TripPlanner';
import StationMap from './components/map/StationMap';
import ReportList from './components/community/ReportList';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('planner'); // EV Smart Trip Planner is our primary featured system
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Restore session from localStorage if present
  useEffect(() => {
    const savedToken = localStorage.getItem('appev_token');
    const savedUser = localStorage.getItem('appev_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (_) {
        localStorage.removeItem('appev_token');
        localStorage.removeItem('appev_user');
      }
    }
  }, []);

  const handleLoginSuccess = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('appev_token', jwtToken);
    localStorage.setItem('appev_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('appev_token');
    localStorage.removeItem('appev_user');
  };

  return (
    <LanguageProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-200">
          
          {/* Top Transparency & Safety Notice Banner */}
          <DisclaimerBanner />

          {/* Navigation Header */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
            onOpenAuth={() => setAuthModalOpen(true)}
            onLogout={handleLogout}
          />

          {/* Main Content Area */}
          <main className="flex-1 w-full relative">
            {activeTab === 'planner' && <TripPlanner />}
            
            {activeTab === 'map' && (
              <StationMap
                onOpenReport={() => setActiveTab('community')}
                user={user}
              />
            )}
            
            {activeTab === 'community' && (
              <ReportList
                user={user}
                token={token}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
            )}
            
            {activeTab === 'analytics' && (
              <AnalyticsDashboard
                user={user}
                token={token}
              />
            )}
          </main>

          {/* Authentication Modal */}
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            onLoginSuccess={handleLoginSuccess}
          />

        </div>
      </ThemeProvider>
    </LanguageProvider>
  );
}
