// focus.js - Handle focus sessions and rewards integration

// Firebase SDK imports
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth-compat.js";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore-compat.js";

const auth = getAuth();
const db = getFirestore();

// Focus session variables
let currentSession = null;
let sessionStartTime = null;
let sessionInterval = null;
let isSessionRunning = false;

// Initialize focus functionality
export function initFocusTimer() {
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');
  const timerDisplay = document.getElementById('timer-display');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');

  if (!startBtn || !pauseBtn || !resetBtn) return;

  startBtn.addEventListener('click', startFocusSession);
  pauseBtn.addEventListener('click', pauseFocusSession);
  resetBtn.addEventListener('click', resetFocusSession);

  // Initialize display
  updateTimerDisplay();
  updateProgress();
}

// Start a focus session
async function startFocusSession() {
  const user = auth.currentUser;
  if (!user) {
    showNotification('Please log in to start a focus session.', 'error');
    return;
  }

  if (isSessionRunning) return;

  isSessionRunning = true;
  sessionStartTime = new Date();

  // Create session document
  try {
    const sessionRef = await addDoc(collection(db, 'FocusSessions'), {
      userId: user.uid,
      startTime: sessionStartTime,
      endTime: null,
      duration: 0,
      completed: false,
      pointsEarned: 0,
      deviceType: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
    });

    currentSession = sessionRef.id;

    // Update UI
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('pause-btn').style.display = 'flex';

    // Start timer updates
    sessionInterval = setInterval(updateSessionProgress, 1000);

    showNotification('Focus session started! Stay focused.', 'success');

  } catch (error) {
    console.error('Error starting session:', error);
    showNotification('Failed to start session. Please try again.', 'error');
  }
}

// Pause the current session
function pauseFocusSession() {
  if (!isSessionRunning) return;

  clearInterval(sessionInterval);
  isSessionRunning = false;

  document.getElementById('start-btn').style.display = 'flex';
  document.getElementById('pause-btn').style.display = 'none';

  showNotification('Session paused. Click start to resume.', 'info');
}

// Reset the session
async function resetFocusSession() {
  const user = auth.currentUser;
  if (!user || !currentSession) return;

  try {
    // Mark session as incomplete
    await updateDoc(doc(db, 'FocusSessions', currentSession), {
      completed: false,
      endTime: new Date(),
      duration: Math.floor((new Date() - sessionStartTime) / 1000 / 60) // minutes
    });

    // Reset UI
    clearInterval(sessionInterval);
    isSessionRunning = false;
    currentSession = null;
    sessionStartTime = null;

    document.getElementById('start-btn').style.display = 'flex';
    document.getElementById('pause-btn').style.display = 'none';

    updateTimerDisplay();
    updateProgress();

    showNotification('Session reset.', 'info');

  } catch (error) {
    console.error('Error resetting session:', error);
  }
}

// Complete a focus session
async function completeFocusSession() {
  const user = auth.currentUser;
  if (!user || !currentSession) return;

  const endTime = new Date();
  const duration = Math.floor((endTime - sessionStartTime) / 1000 / 60); // minutes
  const pointsEarned = 5; // Fixed points for completed session

  try {
    // Update session
    await updateDoc(doc(db, 'FocusSessions', currentSession), {
      endTime: endTime,
      duration: duration,
      completed: true,
      pointsEarned: pointsEarned
    });

    // Update rewards
    await updateRewards(user.uid, pointsEarned);

    // Reset session
    clearInterval(sessionInterval);
    isSessionRunning = false;
    currentSession = null;
    sessionStartTime = null;

    document.getElementById('start-btn').style.display = 'flex';
    document.getElementById('pause-btn').style.display = 'none';

    showNotification(`Session completed! +${pointsEarned} points earned.`, 'success');

  } catch (error) {
    console.error('Error completing session:', error);
    showNotification('Failed to complete session.', 'error');
  }
}

// Update session progress every second
function updateSessionProgress() {
  if (!sessionStartTime) return;

  const elapsed = Math.floor((new Date() - sessionStartTime) / 1000); // seconds
  const totalSeconds = 25 * 60; // 25 minutes default

  if (elapsed >= totalSeconds) {
    completeFocusSession();
    return;
  }

  updateTimerDisplay();
  updateProgress();
}

// Update timer display
function updateTimerDisplay() {
  const timerDisplay = document.getElementById('timer-display');
  if (!timerDisplay) return;

  let displayTime;
  if (sessionStartTime && isSessionRunning) {
    const elapsed = Math.floor((new Date() - sessionStartTime) / 1000);
    const remaining = Math.max(25 * 60 - elapsed, 0);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    displayTime = '25:00';
  }

  timerDisplay.textContent = displayTime;
}

// Update progress bar
function updateProgress() {
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');

  if (!progressBar || !progressText) return;

  let progress = 0;
  if (sessionStartTime && isSessionRunning) {
    const elapsed = Math.floor((new Date() - sessionStartTime) / 1000);
    progress = Math.min((elapsed / (25 * 60)) * 100, 100);
  }

  progressBar.style.width = `${progress}%`;
  progressText.textContent = `${Math.round(progress)}%`;
}

// Update rewards points and recalculate level
async function updateRewards(userId, pointsToAdd) {
  const rewardsRef = doc(db, 'Rewards', userId);

  try {
    const rewardsDoc = await getDoc(rewardsRef);
    let currentPoints = 0;
    let currentLevel = 1;

    if (rewardsDoc.exists()) {
      const data = rewardsDoc.data();
      currentPoints = data.totalPoints || 0;
      currentLevel = data.avatarLevel || 1;
    }

    const newPoints = currentPoints + pointsToAdd;
    const newLevel = calculateLevel(newPoints);

    await updateDoc(rewardsRef, {
      userId: userId,
      totalPoints: newPoints,
      avatarLevel: newLevel,
      lastUpdated: new Date()
    }, { merge: true });

    console.log(`Rewards updated: ${currentPoints} -> ${newPoints} points, Level ${currentLevel} -> ${newLevel}`);

  } catch (error) {
    console.error('Error updating rewards:', error);
    // If document doesn't exist, create it
    if (error.code === 'not-found') {
      await updateDoc(rewardsRef, {
        userId: userId,
        totalPoints: pointsToAdd,
        avatarLevel: 1,
        badges: [],
        lastUpdated: new Date()
      });
    }
  }
}

// Calculate avatar level based on points
function calculateLevel(points) {
  if (points >= 500) return 5;
  if (points >= 300) return 4;
  if (points >= 150) return 3;
  if (points >= 50) return 2;
  return 1;
}

// Show notification
function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  } text-white`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Load focus session statistics
export async function loadFocusStats() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const sessionsRef = collection(db, 'FocusSessions');
    const q = query(sessionsRef, where('userId', '==', user.uid), where('completed', '==', true));
    const querySnapshot = await getDocs(q);

    let totalSessions = 0;
    let totalMinutes = 0;

    querySnapshot.forEach((doc) => {
      const session = doc.data();
      totalSessions++;
      totalMinutes += session.duration || 0;
    });

    // Update UI elements if they exist
    const sessionsElement = document.getElementById('total-sessions');
    const minutesElement = document.getElementById('total-minutes');

    if (sessionsElement) sessionsElement.textContent = totalSessions;
    if (minutesElement) minutesElement.textContent = totalMinutes;

  } catch (error) {
    console.error('Error loading focus stats:', error);
  }
}
