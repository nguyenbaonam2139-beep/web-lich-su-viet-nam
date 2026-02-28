import React, { useEffect, useState } from "react";
import { fetchTimelineEvents, createTimelineEvent, updateTimelineEvent, deleteTimelineEvent, fetchSettings, updateSettings } from "./api";
import type { TimelineEvent } from "./types";
import { Timeline } from "./components/Timeline";
import { Landing } from "./components/Landing";
import { Login } from "./components/Login";
import { AdminProvider, useAdmin } from "./contexts/AdminContext";
import { BadgeCelebration } from "./components/BadgeCelebration";
import axios from "axios";

// Unified API URL: Use environment variable in production, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3005";

export const App: React.FC = () => {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('hiss_user_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [storedUser, setStoredUser] = useState<any>(() => {
    const saved = localStorage.getItem('hiss_stored_user_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [view, setView] = useState<"landing" | "timeline">(() => {
    return localStorage.getItem('hiss_user_session') ? "timeline" : "landing";
  });
  const [settings, setSettings] = useState<{
    timelineBackground: string,
    backgroundSize: string,
    backgroundPosition: string
  }>({
    timelineBackground: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80",
    backgroundSize: "cover",
    backgroundPosition: "center"
  });

  // Sync user sessions to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('hiss_user_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('hiss_user_session');
    }
  }, [user]);

  useEffect(() => {
    if (storedUser) {
      localStorage.setItem('hiss_stored_user_session', JSON.stringify(storedUser));
    } else {
      localStorage.removeItem('hiss_stored_user_session');
    }
  }, [storedUser]);

  // Handle Ctrl+Shift+A for Admin Toggling
  useEffect(() => {
    const handleAdminToggle = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();

        if (user?.role === 'admin' && storedUser) {
          // Switch back to normal user
          setUser(storedUser);
          setStoredUser(null);
        } else if (user?.role !== 'admin') {
          // Switch to admin
          try {
            const response = await axios.get(`${API_URL}/users?username=ADMIN123`);
            if (response.data.length > 0) {
              setStoredUser(user);
              setUser(response.data[0]);
            }
          } catch (err) {
            console.error("Lỗi khi chuyển sang Admin:", err);
          }
        }
      }
    };

    window.addEventListener('keydown', handleAdminToggle);
    return () => window.removeEventListener('keydown', handleAdminToggle);
  }, [user, storedUser]);

  useEffect(() => {
    if (user) {
      loadEvents();
      loadSettings();
      // Only fetch fresh user data if they have an ID (i.e., not a hardcoded guest/admin)
      if (user.id) {
        loadFreshUserData();
      }
    }
  }, [user?.id]); // Note: dependency is just ID to avoid infinite loops if loadFreshUserData updates user object

  const loadFreshUserData = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/${user.id}`);
      if (response.data) {
        // Merge to prevent local state drift
        setUser((prev: any) => ({ ...prev, ...response.data }));
      }
    } catch (err) {
      console.error("Failed to load fresh user profile", err);
    }
  }

  // Apply background variables whenever settings change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--timeline-bg', `url('${settings.timelineBackground}')`);
    root.style.setProperty('--timeline-bg-size', settings.backgroundSize);
    root.style.setProperty('--timeline-bg-pos', settings.backgroundPosition);
  }, [settings]);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      if (data) setSettings(data);
    } catch (err) {
      console.error("Failed to load settings", err);
    }
  };

  const loadEvents = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await fetchTimelineEvents();
      setEvents(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleStart = () => {
    setView("timeline");
  };

  const handleCreateEvent = async (event: Omit<TimelineEvent, "id">) => {
    await createTimelineEvent(event);
    loadEvents(true);
  };

  const handleUpdateEvent = async (event: TimelineEvent) => {
    await updateTimelineEvent(event);
    loadEvents(true);
  };

  const handleDeleteEvent = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sự kiện này?")) {
      await deleteTimelineEvent(id);
      loadEvents(true);
    }
  };

  const handleUpdateBackground = async (newUrl: string) => {
    try {
      const newSettings = { ...settings, timelineBackground: newUrl };
      await updateSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      alert("Không thể cập nhật ảnh nền: " + (err as Error).message);
    }
  };

  const handleUpdateBgParams = async (params: Partial<typeof settings>) => {
    try {
      const newSettings = { ...settings, ...params };
      await updateSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      alert("Không thể cập nhật thông số ảnh nền: " + (err as Error).message);
    }
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <AdminProvider user={user}>
      <AppContent
        user={user}
        setUser={setUser}
        events={events}
        loading={loading}
        error={error}
        view={view}
        setView={setView}
        handleStart={handleStart}
        handleCreateEvent={handleCreateEvent}
        handleUpdateEvent={handleUpdateEvent}
        handleDeleteEvent={handleDeleteEvent}
        handleUpdateBackground={handleUpdateBackground}
        handleUpdateBgParams={handleUpdateBgParams}
      />
    </AdminProvider>
  );
};

// Internal wrapper to consume Context
const AppContent: React.FC<any> = ({
  user, setUser, events, loading, error, view, setView,
  handleStart, handleCreateEvent, handleUpdateEvent, handleDeleteEvent,
  handleUpdateBackground, handleUpdateBgParams
}) => {
  const { earnedBadgeId, clearEarnedBadge } = useAdmin();

  return (
    <div className="app-root">
      {earnedBadgeId && (
        <BadgeCelebration
          badgeId={earnedBadgeId}
          onClose={clearEarnedBadge}
        />
      )}

      {view === "landing" ? (
        <Landing onStart={handleStart} key="landing" />
      ) : (
        <Timeline
          events={events}
          loading={loading}
          error={error}
          user={user}
          onBack={() => setView("landing")}
          onCreate={handleCreateEvent}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
          onUpdateBackground={handleUpdateBackground}
          onUpdateBgParams={handleUpdateBgParams}
          onLogout={() => setUser(null)}
        />
      )}
    </div>
  );
};
