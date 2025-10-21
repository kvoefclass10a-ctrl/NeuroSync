// rewards.js - Handle rewards display and management

// Firebase SDK imports
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth-compat.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore-compat.js";

const auth = getAuth();
const db = getFirestore();

// Initialize rewards functionality
export function initRewards() {
  loadRewardsData();
}

// Load and display rewards data
export async function loadRewardsData() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const rewardsDoc = await getDoc(doc(db, 'Rewards', user.uid));
    if (rewardsDoc.exists()) {
      const rewards = rewardsDoc.data();

      // Update points display
      const pointsElement = document.getElementById('total-points');
      if (pointsElement) pointsElement.textContent = rewards.totalPoints || 0;

      // Update level display
      const levelElement = document.getElementById('current-level');
      if (levelElement) levelElement.textContent = `Level ${rewards.avatarLevel || 1}`;

      // Update progress bar
      updateLevelProgress(rewards.totalPoints || 0, rewards.avatarLevel || 1);

      // Update badges
      displayBadges(rewards.badges || []);

      // Update statistics
      await loadRewardsStats(user.uid);

    } else {
      // Initialize default rewards
      setDefaultRewardsDisplay();
    }
  } catch (error) {
    console.error('Error loading rewards:', error);
    setDefaultRewardsDisplay();
  }
}

// Set default rewards display for new users
function setDefaultRewardsDisplay() {
  const pointsElement = document.getElementById('total-points');
  const levelElement = document.getElementById('current-level');
  const progressBar = document.getElementById('level-progress-bar');

  if (pointsElement) pointsElement.textContent = '0';
  if (levelElement) levelElement.textContent = 'Level 1';
  if (progressBar) progressBar.style.width = '0%';
}

// Update level progress bar
function updateLevelProgress(points, currentLevel) {
  const progressBar = document.getElementById('level-progress-bar');
  const progressText = document.getElementById('level-progress-text');

  if (!progressBar) return;

  const levelThresholds = [0, 50, 150, 300, 500];
  const currentThreshold = levelThresholds[currentLevel - 1] || 0;
  const nextThreshold = levelThresholds[currentLevel] || 500;

  const progress = ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  progressBar.style.width = `${clampedProgress}%`;

  if (progressText) {
    progressText.textContent = `${Math.round(clampedProgress)}% to Level ${currentLevel + 1}`;
  }
}

// Display earned badges
function displayBadges(badges) {
  const badgesContainer = document.getElementById('badges-container');
  if (!badgesContainer) return;

  badgesContainer.innerHTML = '';

  if (badges.length === 0) {
    badgesContainer.innerHTML = '<p class="text-secondary text-center">No badges earned yet. Keep using NeuroSync to unlock achievements!</p>';
    return;
  }

  badges.forEach(badge => {
    const badgeElement = document.createElement('div');
    badgeElement.className = 'bg-tertiary rounded-lg p-4 text-center border border-primary/50';
    badgeElement.innerHTML = `
      <div class="text-3xl mb-2">${getBadgeIcon(badge.type)}</div>
      <h3 class="font-bold text-primary">${badge.name}</h3>
      <p class="text-sm text-secondary">${badge.description}</p>
      <p class="text-xs text-accent mt-1">Earned ${new Date(badge.earnedAt.toDate()).toLocaleDateString()}</p>
    `;
    badgesContainer.appendChild(badgeElement);
  });
}

// Get badge icon based on type
function getBadgeIcon(type) {
  const icons = {
    'first_mood': '😊',
    'focus_master': '🎯',
    'study_sharer': '📚',
    'consistent': '⭐',
    'early_bird': '🌅'
  };
  return icons[type] || '🏆';
}

// Load rewards statistics
async function loadRewardsStats(userId) {
  try {
    // Load mood entries count
    const moodsQuery = query(collection(db, 'Moods'), where('userId', '==', userId));
    const moodsSnapshot = await getDocs(moodsQuery);
    const moodCount = moodsSnapshot.size;

    // Load focus sessions count
    const focusQuery = query(collection(db, 'FocusSessions'), where('userId', '==', userId), where('completed', '==', true));
    const focusSnapshot = await getDocs(focusQuery);
    const focusCount = focusSnapshot.size;

    // Load study materials count
    const studyQuery = query(collection(db, 'StudyLibrary'), where('uploadedBy', '==', userId), where('approved', '==', true));
    const studySnapshot = await getDocs(studyQuery);
    const studyCount = studySnapshot.size;

    // Update stats display
    const statsContainer = document.getElementById('rewards-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-tertiary rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-accent">${moodCount}</div>
            <div class="text-sm text-secondary">Mood Entries</div>
          </div>
          <div class="bg-tertiary rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-accent">${focusCount}</div>
            <div class="text-sm text-secondary">Focus Sessions</div>
          </div>
          <div class="bg-tertiary rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-accent">${studyCount}</div>
            <div class="text-sm text-secondary">Materials Shared</div>
          </div>
        </div>
      `;
    }

  } catch (error) {
    console.error('Error loading rewards stats:', error);
  }
}

// Check and award new badges
export async function checkAndAwardBadges(userId) {
  try {
    const rewardsDoc = await getDoc(doc(db, 'Rewards', userId));
    const currentBadges = rewardsDoc.exists() ? rewardsDoc.data().badges || [] : [];

    const newBadges = [];

    // Check mood badge (first mood entry)
    if (!currentBadges.some(b => b.type === 'first_mood')) {
      const moodsQuery = query(collection(db, 'Moods'), where('userId', '==', userId));
      const moodsSnapshot = await getDocs(moodsQuery);
      if (moodsSnapshot.size > 0) {
        newBadges.push({
          type: 'first_mood',
          name: 'Mood Tracker',
          description: 'Logged your first mood',
          earnedAt: new Date()
        });
      }
    }

    // Check focus master badge (5 completed sessions)
    if (!currentBadges.some(b => b.type === 'focus_master')) {
      const focusQuery = query(collection(db, 'FocusSessions'), where('userId', '==', userId), where('completed', '==', true));
      const focusSnapshot = await getDocs(focusQuery);
      if (focusSnapshot.size >= 5) {
        newBadges.push({
          type: 'focus_master',
          name: 'Focus Master',
          description: 'Completed 5 focus sessions',
          earnedAt: new Date()
        });
      }
    }

    // Check study sharer badge (first approved material)
    if (!currentBadges.some(b => b.type === 'study_sharer')) {
      const studyQuery = query(collection(db, 'StudyLibrary'), where('uploadedBy', '==', userId), where('approved', '==', true));
      const studySnapshot = await getDocs(studyQuery);
      if (studySnapshot.size > 0) {
        newBadges.push({
          type: 'study_sharer',
          name: 'Study Sharer',
          description: 'Shared approved study material',
          earnedAt: new Date()
        });
      }
    }

    // Award new badges
    if (newBadges.length > 0) {
      const updatedBadges = [...currentBadges, ...newBadges];
      await updateDoc(doc(db, 'Rewards', userId), {
        badges: updatedBadges,
        lastUpdated: new Date()
      }, { merge: true });

      // Show notification
      showBadgeNotification(newBadges);

      // Reload rewards display
      loadRewardsData();
    }

  } catch (error) {
    console.error('Error checking badges:', error);
  }
}

// Show badge notification
function showBadgeNotification(newBadges) {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 bg-yellow-500 text-white max-w-sm';
  notification.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-2xl">🏆</span>
      <div>
        <p class="font-bold">New Badge${newBadges.length > 1 ? 's' : ''}!</p>
        <p class="text-sm">${newBadges.map(b => b.name).join(', ')}</p>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}
