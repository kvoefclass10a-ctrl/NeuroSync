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
