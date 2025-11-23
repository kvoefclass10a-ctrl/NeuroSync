// utils.js - Shared utility functions for NeuroSync

// Firebase SDK imports
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth-compat.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore-compat.js";

const auth = getAuth();
const db = getFirestore();

// Get current user data from Firestore
export async function getUserData() {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const docRef = doc(db, 'Profiles', user.uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

// Show toast notification
export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 text-white ${
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Format date for display
export function formatDate(date) {
  if (!date) return 'N/A';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format date and time
export function formatDateTime(date) {
  if (!date) return 'N/A';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Check if user is authenticated
export function isAuthenticated() {
  return auth.currentUser !== null;
}

// Redirect to auth page if not authenticated
export function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'auth.html';
    return false;
  }
  return true;
}

// Get user display name
export function getUserDisplayName(userData) {
  if (!userData) return 'User';
  return `${userData.firstname || ''} ${userData.lastname || ''}`.trim() || userData.email?.split('@')[0] || 'User';
}

// Debounce function for search inputs
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Validate email format
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Capitalize first letter
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Get file extension
export function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

// Get file icon based on extension
export function getFileIcon(extension) {
  const icons = {
    'pdf': '📄',
    'doc': '📝',
    'docx': '📝',
    'ppt': '📊',
    'pptx': '📊',
    'xls': '📈',
    'xlsx': '📈',
    'jpg': '🖼️',
    'png': '🖼️',
    'txt': '📝',
    'mp3': '🎵',
    'mp4': '🎥'
  };
  return icons[extension] || '📄';
}

// Format file size
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Copy text to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  } catch (error) {
    console.error('Failed to copy:', error);
    showToast('Failed to copy to clipboard', 'error');
  }
}

// Smooth scroll to element
export function scrollToElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

// Toggle element visibility
export function toggleVisibility(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.style.display = element.style.display === 'none' ? 'block' : 'none';
  }
}

// Add loading spinner
export function showLoadingSpinner(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  spinner.innerHTML = `
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mx-auto"></div>
    <p class="text-center text-secondary mt-2">Loading...</p>
  `;
  container.innerHTML = '';
  container.appendChild(spinner);
}

// Remove loading spinner
export function hideLoadingSpinner(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (container) {
    container.innerHTML = '';
  }
}

// Enhanced error handling with retry mechanism
export async function withRetry(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}

// Error boundary for async operations
export async function safeAsync(fn, errorMessage = 'An error occurred') {
  try {
    return await fn();
  } catch (error) {
    console.error(errorMessage, error);
    showToast(errorMessage, 'error');
    return null;
  }
}

// Loading state manager
export class LoadingManager {
  constructor() {
    this.loadingStates = new Map();
  }
  
  setLoading(key, isLoading) {
    this.loadingStates.set(key, isLoading);
    this.updateUI();
  }
  
  isLoading(key) {
    return this.loadingStates.get(key) || false;
  }
  
  updateUI() {
    const loadingElements = document.querySelectorAll('[data-loading-key]');
    loadingElements.forEach(element => {
      const key = element.getAttribute('data-loading-key');
      const isLoading = this.isLoading(key);
      
      if (isLoading) {
        element.classList.add('loading');
        element.disabled = true;
      } else {
        element.classList.remove('loading');
        element.disabled = false;
      }
    });
  }
}

// Global loading manager instance
export const loadingManager = new LoadingManager();

// Enhanced notification system
export class NotificationManager {
  constructor() {
    this.notifications = [];
    this.container = this.createContainer();
  }
  
  createContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(container);
    return container;
  }
  
  show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="flex items-center gap-3 p-4 rounded-lg shadow-lg text-white max-w-sm">
        <span class="material-symbols-outlined text-xl">${this.getIcon(type)}</span>
        <span class="flex-1">${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white/70 hover:text-white">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    `;
    
    // Add type-specific styling
    notification.querySelector('div').className += ` ${
      type === 'success' ? 'bg-green-500' :
      type === 'error' ? 'bg-red-500' :
      type === 'warning' ? 'bg-yellow-500' :
      type === 'info' ? 'bg-blue-500' : 'bg-gray-500'
    }`;
    
    this.container.appendChild(notification);
    this.notifications.push(notification);
    
    // Auto remove
    setTimeout(() => {
      this.remove(notification);
    }, duration);
    
    return notification;
  }
  
  remove(notification) {
    if (notification && notification.parentElement) {
      notification.remove();
      this.notifications = this.notifications.filter(n => n !== notification);
    }
  }
  
  getIcon(type) {
    const icons = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };
    return icons[type] || 'info';
  }
  
  clear() {
    this.notifications.forEach(notification => this.remove(notification));
  }
}

// Global notification manager instance
export const notificationManager = new NotificationManager();

// Enhanced form validation
export class FormValidator {
  constructor(form) {
    this.form = form;
    this.errors = new Map();
    this.rules = new Map();
  }
  
  addRule(fieldName, rule) {
    this.rules.set(fieldName, rule);
  }
  
  validate() {
    this.errors.clear();
    let isValid = true;
    
    for (const [fieldName, rule] of this.rules) {
      const field = this.form.querySelector(`[name="${fieldName}"]`);
      if (!field) continue;
      
      const error = rule(field.value, field);
      if (error) {
        this.errors.set(fieldName, error);
        this.showFieldError(field, error);
        isValid = false;
      } else {
        this.clearFieldError(field);
      }
    }
    
    return isValid;
  }
  
  showFieldError(field, error) {
    field.classList.add('error');
    
    let errorElement = field.parentElement.querySelector('.field-error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'field-error text-red-400 text-sm mt-1';
      field.parentElement.appendChild(errorElement);
    }
    errorElement.textContent = error;
  }
  
  clearFieldError(field) {
    field.classList.remove('error');
    const errorElement = field.parentElement.querySelector('.field-error');
    if (errorElement) {
      errorElement.remove();
    }
  }
  
  getErrors() {
    return this.errors;
  }
}

// Common validation rules
export const validationRules = {
  required: (value) => !value || value.trim() === '' ? 'This field is required' : null,
  
  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(value) ? 'Please enter a valid email address' : null;
  },
  
  minLength: (min) => (value) => {
    if (!value) return null;
    return value.length < min ? `Must be at least ${min} characters long` : null;
  },
  
  maxLength: (max) => (value) => {
    if (!value) return null;
    return value.length > max ? `Must be no more than ${max} characters long` : null;
  },
  
  password: (value) => {
    if (!value) return null;
    if (value.length < 8) return 'Password must be at least 8 characters long';
    if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
    return null;
  },
  
  fileSize: (maxSizeMB) => (file) => {
    if (!file) return null;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size > maxSizeBytes ? `File size must be less than ${maxSizeMB}MB` : null;
  },
  
  fileType: (allowedTypes) => (file) => {
    if (!file) return null;
    const extension = getFileExtension(file.name);
    return !allowedTypes.includes(extension) ? `File type must be one of: ${allowedTypes.join(', ')}` : null;
  }
};

// Network status monitoring
export class NetworkMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners('online');
      notificationManager.show('Connection restored', 'success');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners('offline');
      notificationManager.show('Connection lost', 'warning');
    });
  }
  
  addListener(callback) {
    this.listeners.push(callback);
  }
  
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
  
  notifyListeners(status) {
    this.listeners.forEach(callback => callback(status));
  }
}

// Global network monitor instance
export const networkMonitor = new NetworkMonitor();

// Performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }
  
  startTiming(key) {
    this.metrics.set(key, { start: performance.now() });
  }
  
  endTiming(key) {
    const metric = this.metrics.get(key);
    if (metric) {
      metric.end = performance.now();
      metric.duration = metric.end - metric.start;
      console.log(`${key}: ${metric.duration.toFixed(2)}ms`);
    }
  }
  
  getMetrics() {
    return this.metrics;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility function to handle Firebase errors
export function handleFirebaseError(error) {
  const errorMessages = {
    'auth/user-not-found': 'No user found with this email address.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'permission-denied': 'You do not have permission to perform this action.',
    'unavailable': 'Service is temporarily unavailable. Please try again later.'
  };
  
  const message = errorMessages[error.code] || error.message || 'An unexpected error occurred.';
  notificationManager.show(message, 'error');
  
  return message;
}

// Utility function for offline data handling
export function createOfflineHandler() {
  const offlineData = new Map();
  
  return {
    set(key, data) {
      offlineData.set(key, {
        data,
        timestamp: Date.now()
      });
      localStorage.setItem(`offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    },
    
    get(key) {
      const cached = offlineData.get(key);
      if (cached) return cached.data;
      
      const stored = localStorage.getItem(`offline_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        offlineData.set(key, parsed);
        return parsed.data;
      }
      
      return null;
    },
    
    clear(key) {
      offlineData.delete(key);
      localStorage.removeItem(`offline_${key}`);
    },
    
    clearAll() {
      offlineData.clear();
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('offline_')) {
          localStorage.removeItem(key);
        }
      });
    }
  };
}

// Global offline handler instance
export const offlineHandler = createOfflineHandler();