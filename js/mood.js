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
    "Prioritize tasks that align with your vision."
  ],
  Happy: [
    "Share your happiness with others around you.",
    "Take a moment to appreciate what went well today.",
    "Use this positive energy to tackle a challenging task.",
    "Write down three things you're grateful for.",
    "Smile at strangers and spread the joy.",
    "Listen to your favorite upbeat music.",
    "Spend time with people who make you laugh.",
    "Treat yourself to something you enjoy.",
    "Reflect on your accomplishments.",
    "Plan something fun for the weekend."
  ],
  Neutral: [
    "Take a short walk to clear your mind.",
    "Try a new hobby or activity.",
    "Connect with a friend for a casual chat.",
    "Organize your workspace for better focus.",
    "Read an interesting article or book.",
    "Practice deep breathing exercises.",
    "Set a small, achievable goal for today.",
    "Listen to calming music or a podcast.",
    "Do some light stretching or yoga.",
    "Write in a journal about your thoughts."
  ],
  Sad: [
    "Allow yourself to feel your emotions without judgment.",
    "Reach out to a trusted friend or family member.",
    "Engage in self-care activities you enjoy.",
    "Take a warm shower or bath.",
    "Write down your feelings in a journal.",
    "Go for a gentle walk in nature.",
    "Watch a comforting movie or show.",
    "Practice self-compassion and kindness.",
    "Do something creative like drawing or painting.",
    "Consider talking to a counselor or therapist."
  ],
  Anxious: [
    "Practice deep breathing: inhale for 4 counts, hold for 4, exhale for 4.",
    "Ground yourself by naming 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.",
    "Challenge negative thoughts with evidence-based counterarguments.",
    "Break down overwhelming tasks into smaller, manageable steps.",
    "Use progressive muscle relaxation techniques.",
    "Limit caffeine and sugar intake.",
    "Establish a consistent sleep schedule.",
    "Practice mindfulness meditation.",
    "Exercise regularly to reduce stress hormones.",
    "Create a 'worry time' where you set aside 15 minutes to address concerns."
  ],
  Excited: [
    "Channel your energy into productive activities.",
    "Share your excitement with others to amplify the positive feelings.",
    "Use this motivation to start a new project or goal.",
    "Take action on something you've been putting off.",
    "Celebrate the anticipation of good things to come.",
    "Create a vision board for your aspirations.",
    "Set specific, actionable steps toward your goals.",
    "Surround yourself with supportive, positive people.",
    "Document your progress and achievements.",
    "Reward yourself for taking initiative."
  ]
};

// Initialize mood logging functionality
export function initMoodLogging() {
  const moodButtons = document.querySelectorAll('.mood-button');
  const logMoodBtn = document.getElementById('log-mood-btn');
  const moodSuggestion = document.getElementById('mood-suggestion');

  if (moodButtons.length > 0) {
    moodButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove selected class from all buttons
        moodButtons.forEach(btn => btn.classList.remove('selected'));

        // Add selected class to clicked button
        this.classList.add('selected');
        const selectedMood = this.dataset.mood;
        const moodLevel = parseInt(this.dataset.level);

        // Update suggestion
        if (moodSuggestion) {
          const tips = moodTips[selectedMood] || [];
          const randomTip = tips[Math.floor(Math.random() * tips.length)] || "Keep up the great work!";
          moodSuggestion.innerHTML = `
            <div class="text-lg font-medium mb-2">Great choice! Here's a tip for you:</div>
            <div class="text-sm opacity-75">${randomTip}</div>
          `;
        }
      });
    });
  }

  if (logMoodBtn) {
    logMoodBtn.addEventListener('click', async function() {
      const selectedButton = document.querySelector('.mood-button.selected');
      if (!selectedButton) {
        showNotification('Please select a mood first!', 'error');
        return;
      }

      const mood = selectedButton.dataset.mood;
      const level = parseInt(selectedButton.dataset.level);

      await logMood(mood, level);
    });
  }
}

// Log mood to Firebase
export async function logMood(mood, level) {
  const user = auth.currentUser;
  if (!user) {
    showNotification('Please log in to log your mood.', 'error');
    return;
  }

  try {
    // Add mood entry
    await addDoc(collection(db, 'Moods'), {
      userId: user.uid,
      mood: mood,
      level: level,
      timestamp: new Date()
    });

    // Update rewards
    await updateRewards(user.uid, 2); // 2 points for logging mood

    // Reload recent moods
    await loadRecentMoods();

    showNotification(`Mood logged: ${mood}! +2 points earned.`, 'success');

  } catch (error) {
    console.error('Error logging mood:', error);
    showNotification('Failed to log mood. Please try again.', 'error');
  }
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
