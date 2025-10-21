// mood.js - Handle mood logging and rewards integration

// Firebase SDK imports
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth-compat.js";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore-compat.js";

const auth = getAuth();
const db = getFirestore();

// Mood tips for chatbot responses
export const moodTips = {
  Ambitious: [
    "Set small, achievable goals to build momentum.",
    "Visualize your success to stay motivated.",
    "Break down big dreams into actionable steps.",
    "Surround yourself with inspiring people.",
    "Track your progress daily to see improvement.",
    "Learn from past achievements to fuel future ones.",
    "Embrace challenges as opportunities to grow.",
    "Set deadlines to create urgency.",
    "Reward yourself for milestones reached.",
    "Read biographies of successful people for inspiration.",
    "Practice positive affirmations daily.",
    "Join a group with similar ambitions.",
    "Invest in skills that align with your goals.",
    "Maintain a vision board for motivation.",
    "Start your day with goal-setting exercises.",
    "Celebrate small wins along the way.",
    "Seek mentorship from those ahead of you.",
    "Stay adaptable in your approach.",
    "Prioritize tasks that align with your vision.",

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
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  } text-white`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Load recent moods for display
export async function loadRecentMoods() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const moodsRef = collection(db, 'Moods');
    const q = query(moodsRef, where('userId', '==', user.uid), orderBy('timestamp', 'desc'), limit(5));
    const querySnapshot = await getDocs(q);

    const moodHistory = document.getElementById('mood-history');
    if (!moodHistory) return;

    moodHistory.innerHTML = '';

    querySnapshot.forEach((doc) => {
      const mood = doc.data();
      const moodItem = document.createElement('div');
      moodItem.className = 'flex items-center justify-between p-3 bg-secondary rounded-lg';
      moodItem.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-2xl">${getMoodEmoji(mood.mood)}</span>
          <div>
            <p class="font-medium">${mood.mood}</p>
            <p class="text-sm text-secondary">${new Date(mood.timestamp.toDate()).toLocaleDateString()}</p>
          </div>
        </div>
        <span class="text-accent">+2 pts</span>
      `;
      moodHistory.appendChild(moodItem);
    });

  } catch (error) {
    console.error('Error loading recent moods:', error);
  }
}

// Helper function to get emoji for mood
function getMoodEmoji(mood) {
  const emojiMap = {
    'Happy': '😄',
    'Neutral': '😐',
    'Sad': '😔',
    'Anxious': '😟',
    'Excited': '🤩'
  };
  return emojiMap[mood] || '😐';
}
