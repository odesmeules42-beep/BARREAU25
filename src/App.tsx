import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Settings from './components/Settings';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProgressTab from './components/ProgressTab';
import TestsTab from './components/TestsTab';
import ResultsTab from './components/ResultsTab';
import { supabase } from './lib/supabase';

const LandingPage = lazy(() => import('./components/landing/LandingPage'));

function Dashboard({ isAuthenticated, setIsAuthenticated }: {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<'tests' | 'resultats' | 'progression'>('tests');
  const [showSettings, setShowSettings] = useState(false);

  if (!isAuthenticated) {
    return <Auth onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSettingsClick={() => setShowSettings(true)} />
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="pt-20 pl-72 pr-8 pb-8">
        {activeTab === 'tests' && <TestsTab />}
        {activeTab === 'resultats' && <ResultsTab />}
        {activeTab === 'progression' && <ProgressTab />}
      </main>
      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initialiseSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setIsAuthenticated(!!session);
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    initialiseSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setIsAuthenticated(!!session);
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">Chargement...</div>
        </div>
      }>
        {authLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-xl">Chargement...</div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/auth"
              element={
                isAuthenticated
                  ? <Navigate to="/app" replace />
                  : <Auth onLogin={() => setIsAuthenticated(true)} />
              }
            />
            <Route
              path="/app/*"
              element={
                isAuthenticated
                  ? <Dashboard isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
                  : <Navigate to="/auth" replace />
              }
            />
          </Routes>
        )}
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
