import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_SHELTERS,
  INITIAL_RESOURCE_REQUESTS,
  INITIAL_FIELD_REPORTS,
  ACTIVE_DISASTER_DECLARATIONS,
  INITIAL_DONATIONS,
  DEMO_USERS
} from '../services/mockData';
import { generateIdempotencyKey, executeIdempotentRequest } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Theme mode: 'dark' (default) or 'light'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('drc_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  // Auth State: Authenticated user profile or null
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('drc_auth_user');
    return saved ? JSON.parse(saved) : DEMO_USERS[1]; // default to Dr. Sunita Rao (Coordinator)
  });

  // Active Persona / Role
  const [role, setRole] = useState(() => {
    const savedUser = localStorage.getItem('drc_auth_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser).role;
      } catch (e) {
        // fallback
      }
    }
    return localStorage.getItem('drc_role') || 'coordinator';
  });

  // Network Simulation: 'online' | 'slow-3g' | 'offline'
  const [networkState, setNetworkState] = useState('online');

  // Data collections (persistent in localStorage if available)
  const [shelters, setShelters] = useState(() => {
    const saved = localStorage.getItem('drc_shelters');
    return saved ? JSON.parse(saved) : INITIAL_SHELTERS;
  });

  const [resourceRequests, setResourceRequests] = useState(() => {
    const saved = localStorage.getItem('drc_requests');
    return saved ? JSON.parse(saved) : INITIAL_RESOURCE_REQUESTS;
  });

  const [fieldReports, setFieldReports] = useState(() => {
    const saved = localStorage.getItem('drc_reports');
    return saved ? JSON.parse(saved) : INITIAL_FIELD_REPORTS;
  });

  const [declarations, setDeclarations] = useState(ACTIVE_DISASTER_DECLARATIONS);
  const [circuitBreaker, setCircuitBreaker] = useState('CLOSED'); // CLOSED (Normal) | OPEN (Failing) | HALF_OPEN

  const [donations, setDonations] = useState(() => {
    const saved = localStorage.getItem('drc_donations');
    return saved ? JSON.parse(saved) : INITIAL_DONATIONS;
  });

  // Outbox / Offline Queue
  const [outbox, setOutbox] = useState(() => {
    const saved = localStorage.getItem('drc_outbox');
    return saved ? JSON.parse(saved) : [];
  });

  // Toast Notification Stack
  const [toasts, setToasts] = useState([]);

  // Sync theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('drc_theme', theme);
  }, [theme]);

  // Persist role
  useEffect(() => {
    localStorage.setItem('drc_role', role);
  }, [role]);

  // Save collections to localStorage
  useEffect(() => {
    localStorage.setItem('drc_shelters', JSON.stringify(shelters));
  }, [shelters]);

  useEffect(() => {
    localStorage.setItem('drc_requests', JSON.stringify(resourceRequests));
  }, [resourceRequests]);

  useEffect(() => {
    localStorage.setItem('drc_reports', JSON.stringify(fieldReports));
  }, [fieldReports]);

  useEffect(() => {
    localStorage.setItem('drc_donations', JSON.stringify(donations));
  }, [donations]);

  useEffect(() => {
    localStorage.setItem('drc_outbox', JSON.stringify(outbox));
  }, [outbox]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  /**
   * Submit Field Report (with Offline Outbox & Idempotency Key)
   */
  const submitFieldReport = async (reportData) => {
    const idempotencyKey = generateIdempotencyKey('rep');
    const newReport = {
      ...reportData,
      id: `rep-${Date.now().toString().slice(-4)}`,
      idempotencyKey,
      timestamp: 'Just now',
      syncedOffline: networkState === 'offline'
    };

    if (networkState === 'offline') {
      // Add to local outbox
      const outboxItem = {
        id: `outbox-${Date.now()}`,
        type: 'FIELD_REPORT',
        title: `Field Report: ${reportData.hazardType}`,
        payload: newReport,
        idempotencyKey,
        timestamp: new Date().toLocaleTimeString(),
        status: 'pending_sync'
      };
      setOutbox((prev) => [outboxItem, ...prev]);
      // Optimistically show in UI
      setFieldReports((prev) => [newReport, ...prev]);
      addToast('Offline Mode: Report stored in local outbox with idempotency key. Will auto-sync when connection restores.', 'warning');
      return { success: true, queued: true };
    }

    try {
      await executeIdempotentRequest(
        idempotencyKey,
        networkState,
        'Submit Field Report',
        () => {
          setFieldReports((prev) => [newReport, ...prev]);
          return newReport;
        }
      );
      addToast('Field Report submitted and verified across DRC network.', 'success');
      return { success: true, queued: false };
    } catch (err) {
      // Network drop or timeout
      const outboxItem = {
        id: `outbox-${Date.now()}`,
        type: 'FIELD_REPORT',
        title: `Field Report: ${reportData.hazardType}`,
        payload: newReport,
        idempotencyKey,
        timestamp: new Date().toLocaleTimeString(),
        status: 'pending_sync'
      };
      setOutbox((prev) => [outboxItem, ...prev]);
      setFieldReports((prev) => [newReport, ...prev]);
      addToast(`Network dropped: Report saved to Outbox with key ${idempotencyKey}.`, 'warning');
      return { success: true, queued: true };
    }
  };

  /**
   * Submit Resource Transfer Request (Idempotent)
   */
  const submitResourceRequest = async (requestData) => {
    const idempotencyKey = generateIdempotencyKey('req');
    const newRequest = {
      ...requestData,
      id: `req-${Math.floor(1000 + Math.random() * 9000)}`,
      idempotencyKey,
      status: 'pending',
      timestamp: 'Just now'
    };

    if (networkState === 'offline') {
      const outboxItem = {
        id: `outbox-${Date.now()}`,
        type: 'RESOURCE_REQUEST',
        title: `Transfer Request: ${requestData.quantity} ${requestData.unit} ${requestData.resourceName}`,
        payload: newRequest,
        idempotencyKey,
        timestamp: new Date().toLocaleTimeString(),
        status: 'pending_sync'
      };
      setOutbox((prev) => [outboxItem, ...prev]);
      setResourceRequests((prev) => [newRequest, ...prev]);
      addToast('Offline: Resource transfer request queued in Outbox with idempotency lock.', 'warning');
      return { success: true, queued: true };
    }

    try {
      await executeIdempotentRequest(
        idempotencyKey,
        networkState,
        'Submit Resource Request',
        () => {
          setResourceRequests((prev) => [newRequest, ...prev]);
          return newRequest;
        }
      );
      addToast('Resource transfer request broadcasted to coordinators.', 'success');
      return { success: true, queued: false };
    } catch (err) {
      const outboxItem = {
        id: `outbox-${Date.now()}`,
        type: 'RESOURCE_REQUEST',
        title: `Transfer Request: ${requestData.quantity} ${requestData.unit} ${requestData.resourceName}`,
        payload: newRequest,
        idempotencyKey,
        timestamp: new Date().toLocaleTimeString(),
        status: 'pending_sync'
      };
      setOutbox((prev) => [outboxItem, ...prev]);
      setResourceRequests((prev) => [newRequest, ...prev]);
      addToast(`Network glitch: Request safely queued to Outbox.`, 'warning');
      return { success: true, queued: true };
    }
  };

  /**
   * Update Resource Request Status (e.g. In Transit, Delivered)
   */
  const updateRequestStatus = (requestId, newStatus) => {
    setResourceRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId) {
          // If marked delivered, update shelter inventories
          if (newStatus === 'delivered' && req.status !== 'delivered') {
            adjustShelterInventory(req.toShelterId, req.resourceName, req.quantity);
          }
          return { ...req, status: newStatus };
        }
        return req;
      })
    );
    addToast(`Request ${requestId} updated to '${newStatus.toUpperCase()}'.`, 'info');
  };

  /**
   * Inventory Adjustment Helper
   */
  const adjustShelterInventory = (shelterId, resourceName, addedQty) => {
    setShelters((prev) =>
      prev.map((sh) => {
        if (sh.id !== shelterId) return sh;
        const updatedInv = sh.inventory.map((item) => {
          if (item.name.toLowerCase() === resourceName.toLowerCase() || item.name.includes(resourceName)) {
            const newQty = item.quantity + Number(addedQty);
            let newStatus = 'Adequate';
            if (newQty <= item.minThreshold) newStatus = 'Critical';
            else if (newQty > item.minThreshold * 2) newStatus = 'Surplus';
            return { ...item, quantity: newQty, status: newStatus };
          }
          return item;
        });
        return { ...sh, inventory: updatedInv };
      })
    );
  };

  /**
   * Process and Empty Outbox
   */
  const syncOutboxNow = async () => {
    if (outbox.length === 0) {
      addToast('Outbox is empty. All operations are up-to-date.', 'info');
      return;
    }
    if (networkState === 'offline') {
      addToast('Cannot sync while in Offline Mode. Switch network state to Online first.', 'warning');
      return;
    }

    addToast(`Syncing ${outbox.length} pending items with central DRC cluster...`, 'info');

    // Simulate sync
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Clear outbox
    const count = outbox.length;
    setOutbox([]);
    addToast(`Successfully synchronized and verified ${count} offline items!`, 'success');
  };

  // Auto-sync when returning to online mode
  useEffect(() => {
    if (networkState === 'online' && outbox.length > 0) {
      syncOutboxNow();
    }
  }, [networkState]);

  /**
   * Submit SOS / Assistance Request (Public)
   */
  const submitAssistanceRequest = (data) => {
    const reportData = {
      author: `${data.name} (Citizen SOS)`,
      shelterId: data.nearestShelterId || 'sh-101',
      location: data.location || 'Reported via Public GPS',
      severity: data.urgency === 'Critical' ? 'Extreme' : 'High',
      hazardType: `Citizen SOS: ${data.neededAssistance}`,
      content: `Contact: ${data.phone}. People stranded: ${data.peopleCount}. Note: ${data.description}`
    };
    submitFieldReport(reportData);
    addToast('Emergency SOS recorded! Relief coordinators have been alerted.', 'emergency');
  };

  /**
   * Record Donation
   */
  const recordDonation = (donationData) => {
    const newDonation = {
      ...donationData,
      id: `don-${Date.now().toString().slice(-4)}`,
      date: 'Just now',
      status: donationData.type === 'Funds' ? 'Verified & Deposited' : 'Pledged / Dispatching'
    };
    setDonations((prev) => [newDonation, ...prev]);
    addToast(`Thank you! Your donation (${donationData.amount || donationData.items}) has been confirmed.`, 'success');
  };

  /**
   * User Authentication Methods (JWT Simulation)
   */
  const loginUser = async (email, password) => {
    const matched = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    const userToLog = matched || {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: email.split('@')[0],
      email,
      role: 'coordinator',
      agency: 'Civil Disaster Relief Personnel'
    };

    const simulatedJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ id: userToLog.id, role: userToLog.role, email: userToLog.email }))}.mock_signature`;

    const authPayload = { ...userToLog, token: simulatedJwt };
    setCurrentUser(authPayload);
    setRole(authPayload.role);
    localStorage.setItem('drc_auth_user', JSON.stringify(authPayload));
    addToast(`Signed in as ${authPayload.name} (${authPayload.role.toUpperCase()})`, 'success');
    return { success: true, user: authPayload };
  };

  const registerUser = async (formData) => {
    const newUserId = `usr-${Date.now().toString().slice(-4)}`;
    const simulatedJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ id: newUserId, role: formData.role, email: formData.email }))}.mock_signature`;

    const newUser = {
      id: newUserId,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      agency: formData.agency || 'Registered Civic Aid Volunteer',
      phone: formData.phone || '',
      badgeNumber: formData.badgeNumber || `DRC-${Math.floor(100 + Math.random() * 900)}`,
      token: simulatedJwt
    };

    setCurrentUser(newUser);
    setRole(newUser.role);
    localStorage.setItem('drc_auth_user', JSON.stringify(newUser));
    addToast(`Account registered! Signed in as ${newUser.name}.`, 'success');
    return { success: true, user: newUser };
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setRole('public');
    localStorage.removeItem('drc_auth_user');
    addToast('You have been signed out. Switched to public relief view.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        role,
        setRole,
        currentUser,
        setCurrentUser,
        loginUser,
        registerUser,
        logoutUser,
        DEMO_USERS,
        networkState,
        setNetworkState,
        shelters,
        setShelters,
        resourceRequests,
        setResourceRequests,
        fieldReports,
        setFieldReports,
        declarations,
        circuitBreaker,
        setCircuitBreaker,
        donations,
        outbox,
        syncOutboxNow,
        submitFieldReport,
        submitResourceRequest,
        updateRequestStatus,
        submitAssistanceRequest,
        recordDonation,
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
