import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';

const OSContext = createContext(null);

const initialState = {
  // Auth
  user: null,
  token: localStorage.getItem('stackos_token'),
  isAuthenticated: false,
  // Desktop
  windows: [],          // { id, appId, title, icon, x, y, w, h, minimized, maximized, zIndex }
  focusedWindowId: null,
  zCounter: 100,
  // System
  notifications: [],
  settings: { theme: 'dark', accent_color: '#0078d4', wallpaper: 'cosmic', blur_effects: 1, animations: 1 },
  installedApps: [],
  // UI state
  startMenuOpen: false,
  notifPanelOpen: false,
  calendarOpen: false,
  systemMetrics: { cpu: 25 },
};

function reducer(state, action) {
  switch (action.type) {
    /* ── Auth ─────────────────────────────────────────── */
    case 'SET_USER':
      return { ...state, user: action.user, isAuthenticated: true };
    case 'LOGOUT':
      return { ...initialState, token: null, isAuthenticated: false };

    /* ── Windows ──────────────────────────────────────── */
    case 'OPEN_WINDOW': {
      const exists = state.windows.find(w => w.id === action.win.id);
      if (exists) return reducer(state, { type: 'FOCUS_WINDOW', id: action.win.id });
      const z = state.zCounter + 1;
      return { ...state, zCounter: z, focusedWindowId: action.win.id,
        windows: [...state.windows, { ...action.win, zIndex: z }] };
    }
    case 'CLOSE_WINDOW':
      return { ...state, windows: state.windows.filter(w => w.id !== action.id),
        focusedWindowId: state.focusedWindowId === action.id ? null : state.focusedWindowId };
    case 'FOCUS_WINDOW': {
      const z = state.zCounter + 1;
      return { ...state, zCounter: z, focusedWindowId: action.id,
        windows: state.windows.map(w => w.id === action.id ? { ...w, zIndex: z, minimized: false } : w) };
    }
    case 'MINIMIZE_WINDOW':
      return { ...state, windows: state.windows.map(w => w.id === action.id ? { ...w, minimized: !w.minimized } : w) };
    case 'MAXIMIZE_WINDOW':
      return { ...state, windows: state.windows.map(w => w.id === action.id ? { ...w, maximized: !w.maximized } : w) };
    case 'UPDATE_WINDOW':
      return { ...state, windows: state.windows.map(w => w.id === action.id ? { ...w, ...action.data } : w) };

    /* ── Notifications ────────────────────────────────── */
    case 'ADD_NOTIF':
      return { ...state, notifications: [action.notif, ...state.notifications].slice(0, 50) };
    case 'CLEAR_NOTIFS':
      return { ...state, notifications: [] };
    case 'SET_NOTIFS':
      return { ...state, notifications: action.notifs };

    /* ── Settings ─────────────────────────────────────── */
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    /* ── Apps ─────────────────────────────────────────── */
    case 'SET_INSTALLED':
      return { ...state, installedApps: action.apps };

    /* ── UI Toggles ───────────────────────────────────── */
    case 'TOGGLE_START':
      return { ...state, startMenuOpen: !state.startMenuOpen, notifPanelOpen: false, calendarOpen: false };
    case 'TOGGLE_NOTIF':
      return { ...state, notifPanelOpen: !state.notifPanelOpen, startMenuOpen: false, calendarOpen: false };
    case 'TOGGLE_CAL':
      return { ...state, calendarOpen: !state.calendarOpen, startMenuOpen: false, notifPanelOpen: false };
    case 'CLOSE_ALL_PANELS':
      return { ...state, startMenuOpen: false, notifPanelOpen: false, calendarOpen: false };
    case 'SET_METRICS':
      return { ...state, systemMetrics: action.metrics };

    default: return state;
  }
}

export function OSProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef(null);

  // Load user on mount if token present
  useEffect(() => {
    if (state.token) {
      api.get('/auth/profile')
        .then(r => {
          dispatch({ type: 'SET_USER', user: r.data });
          if (r.data.settings) dispatch({ type: 'SET_SETTINGS', settings: r.data.settings });
        })
        .catch(() => dispatch({ type: 'LOGOUT' }));
    }
  }, []);

  // Socket.io connection
  useEffect(() => {
    if (!state.token) return;
    const socket = io('http://localhost:5000', { auth: { token: state.token } });
    socketRef.current = socket;

    socket.on('notification', n => dispatch({ type: 'ADD_NOTIF', notif: { ...n, id: Date.now() } }));
    socket.on('system:metrics', m => dispatch({ type: 'SET_METRICS', metrics: m }));

    return () => socket.disconnect();
  }, [state.token]);

  // Apply accent color CSS var
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', state.settings.accent_color || '#0078d4');
  }, [state.settings.accent_color]);

  const openWindow = (appIdOrWin) => {
    if (typeof appIdOrWin === 'string') {
      // Let WindowManager handle registry lookup
      if (window.__osOpenWindow) { window.__osOpenWindow(appIdOrWin); return; }
    }
    dispatch({ type: 'OPEN_WINDOW', win: appIdOrWin });
  };
  const closeWindow = (id) => dispatch({ type: 'CLOSE_WINDOW', id });
  const focusWindow = (id) => dispatch({ type: 'FOCUS_WINDOW', id });
  const minimizeWindow = (id) => dispatch({ type: 'MINIMIZE_WINDOW', id });
  const maximizeWindow = (id) => dispatch({ type: 'MAXIMIZE_WINDOW', id });
  const updateWindow = (id, data) => dispatch({ type: 'UPDATE_WINDOW', id, data });

  const addNotif = (title, body, icon = '🔔') => {
    const notif = { id: Date.now(), title, body, icon, time: new Date().toLocaleTimeString() };
    dispatch({ type: 'ADD_NOTIF', notif });
    if (socketRef.current) socketRef.current.emit('notification:send', notif);
  };

  const login = (token, user, settings) => {
    localStorage.setItem('stackos_token', token);
    dispatch({ type: 'SET_USER', user });
    if (settings) dispatch({ type: 'SET_SETTINGS', settings });
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    localStorage.removeItem('stackos_token');
    dispatch({ type: 'LOGOUT' });
  };

  const updateSettings = async (newSettings) => {
    dispatch({ type: 'SET_SETTINGS', settings: newSettings });
    try { await api.put('/settings', newSettings); } catch (_) {}
  };

  const emit = socketRef.current ? socketRef.current.emit.bind(socketRef.current) : () => {};

  return (
    <OSContext.Provider value={{
      state, dispatch,
      openWindow, closeWindow, focusWindow, minimizeWindow, maximizeWindow, updateWindow,
      addNotif, login, logout, updateSettings, emit,
    }}>
      {children}
    </OSContext.Provider>
  );
}

export const useOS = () => {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used inside OSProvider');
  return ctx;
};
