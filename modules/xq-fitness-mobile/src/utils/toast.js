/**
 * Simple toast utility for showing success/error messages
 * This is a temporary implementation - can be replaced with react-native-toast-message in Phase 4
 * 
 * Note: This utility provides a callback-based approach. Components should manage toast state.
 * Example usage:
 *   const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
 *   showSuccessToast('Message', (msg) => setToast({ visible: true, message: msg, type: 'success' }));
 */

/**
 * Show a success toast message
 * @param {string} message - Message to display
 * @param {function} callback - Callback function to update toast state in component
 */
export const showSuccessToast = (message, callback) => {
  if (callback) {
    callback(message);
  }
};

/**
 * Show an error toast message
 * @param {string} message - Error message to display
 * @param {function} callback - Callback function to update toast state in component
 */
export const showErrorToast = (message, callback) => {
  if (callback) {
    callback(message);
  }
};
