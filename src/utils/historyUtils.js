/**
 * Utility functions for managing user activity history in localStorage.
 */

const getUserHistoryKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem("userData")) || {};
    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
    const userId = user.id || currentUser.id || currentUser.email || 'guest';
    return `history_${userId}`;
  } catch (e) {
    return 'history_guest';
  }
};

/**
 * Adds an entry to the user activity history.
 * @param {string} type - The type of activity (e.g., 'scan', 'optimize', 'expense').
 * @param {string} title - A short title for the activity.
 * @param {object} data - The data associated with the activity.
 */
export const addHistoryEntry = (type, title, data) => {
  try {
    const historyKey = getUserHistoryKey();
    const history = JSON.parse(localStorage.getItem(historyKey)) || [];
    const newEntry = {
      id: Date.now(),
      type,
      title,
      data,
      timestamp: new Date().toISOString()
    };
    
    // Keep only last 50 entries to avoid overwhelming localStorage
    const updatedHistory = [newEntry, ...history].slice(0, 50);
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error("Failed to add history entry:", e);
  }
};

/**
 * Retrieves the user activity history.
 * @returns {Array} - Array of history entries.
 */
export const getHistory = () => {
  try {
    const historyKey = getUserHistoryKey();
    return JSON.parse(localStorage.getItem(historyKey)) || [];
  } catch (e) {
    console.error("Failed to fetch history:", e);
    return [];
  }
};

/**
 * Clears all history for the current user.
 */
export const clearHistory = () => {
  try {
    const historyKey = getUserHistoryKey();
    localStorage.removeItem(historyKey);
  } catch (e) {
    console.error("Failed to clear history:", e);
  }
};
