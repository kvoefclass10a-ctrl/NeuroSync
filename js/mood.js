// mood.js - Enhanced mood logging, rewards, and interactive chatbot

// Firebase SDK imports
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth-compat.js";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore-compat.js";

const auth = getAuth();
const db = getFirestore();

// Conversation state management
let conversationState = {
  currentMood: null,
  conversationStep: 0,
  journalEntry: '',
  conversationHistory: []
};

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
    'Excited': '🤩',
    'Ambitious': '💪'
  };
  return emojiMap[mood] || '😐';
}

// Enhanced chatbot functions
export function initEnhancedChatbot() {
  const chatInput = document.getElementById('chat-input');
  const chatForm = document.getElementById('chat-form');
  const chatWindow = document.getElementById('chat-window');

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = chatInput.value.trim();
      if (message) {
        await handleUserMessage(message);
        chatInput.value = '';
      }
    });
  }

  // Initialize with greeting
  if (chatWindow) {
    setTimeout(() => {
      addBotMessage("Hi there! I'm your mood companion. How are you feeling today? You can also select a mood from the options above to get started!");
    }, 1000);
  }
}

async function handleUserMessage(message) {
  // Add user message to chat
  addUserMessage(message);

  // Add to conversation history
  conversationState.conversationHistory.push({
    type: 'user',
    message: message,
    timestamp: new Date()
  });

  // Show typing indicator
  showTypingIndicator();

  // Process message based on conversation state
  setTimeout(async () => {
    hideTypingIndicator();
    await processConversation(message);
  }, 1000 + Math.random() * 1000); // Random delay for natural feel
}

async function processConversation(message) {
  const user = auth.currentUser;
  let response = '';

  try {
    // Get recent mood history for context
    const recentMoods = await getRecentMoods(user?.uid, 7);

    if (conversationState.conversationStep === 0) {
      // Initial greeting and mood detection
      const detectedMood = detectMoodFromMessage(message);
      if (detectedMood) {
        conversationState.currentMood = detectedMood;
        response = await generateMoodResponse(detectedMood, recentMoods);
        conversationState.conversationStep = 1;
        // Show quick replies for follow-up
        showQuickReplies(['Tell me more about it', 'What triggered this?', 'How can I help?']);
      } else {
        response = "I'd love to help you explore your feelings. Could you tell me more about what's on your mind? Or you can select a mood from the options above!";
        showQuickReplies(['I\'m feeling stressed', 'I\'m happy today', 'Something else']);
      }
    } else if (conversationState.conversationStep === 1) {
      // Follow-up questions
      response = await generateFollowUpResponse(message, conversationState.currentMood, recentMoods);
      conversationState.conversationStep = 2;
      showQuickReplies(['Yes, let\'s journal', 'Maybe later', 'Tell me a tip']);
    } else if (conversationState.conversationStep === 2) {
      // Journaling prompt
      response = await generateJournalingPrompt(conversationState.currentMood);
      conversationState.conversationStep = 3;
      showQuickReplies(['Save this entry', 'Edit and save', 'Skip for now']);
    } else {
      // General conversation
      response = await generateGeneralResponse(message, recentMoods);
      showQuickReplies(['New mood check', 'View history', 'End chat']);
    }

    addBotMessage(response);

    // Add to conversation history
    conversationState.conversationHistory.push({
      type: 'bot',
      message: response,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error in processConversation:', error);
    const errorResponse = "I'm sorry, I encountered an error. Let's try again.";
    addBotMessage(errorResponse);
    conversationState.conversationHistory.push({
      type: 'bot',
      message: errorResponse,
      timestamp: new Date()
    });
    showQuickReplies(['Start over', 'Select mood']);
  }
}

function detectMoodFromMessage(message) {
  const moodKeywords = {
    'Happy': ['happy', 'great', 'awesome', 'excited', 'joyful', 'good', 'wonderful'],
    'Sad': ['sad', 'down', 'depressed', 'unhappy', 'blue', 'gloomy', 'heartbroken'],
    'Anxious': ['anxious', 'worried', 'nervous', 'stressed', 'panicked', 'overwhelmed'],
    'Neutral': ['okay', 'fine', 'normal', 'average', 'meh', 'indifferent'],
    'Excited': ['excited', 'thrilled', 'pumped', 'energized', 'enthusiastic'],
    'Ambitious': ['motivated', 'driven', 'ambitious', 'determined', 'focused']
  };

  const lowerMessage = message.toLowerCase();
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return mood;
    }
  }
  return null;
}

async function generateMoodResponse(mood, recentMoods) {
  const tips = moodTips[mood] || [];
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  let response = `I sense you're feeling ${mood.toLowerCase()}. That's completely valid! `;

  // Add context from recent moods
  if (recentMoods.length > 0) {
    const recentMoodCounts = {};
    recentMoods.forEach(m => {
      recentMoodCounts[m.mood] = (recentMoodCounts[m.mood] || 0) + 1;
    });

    const mostCommonMood = Object.keys(recentMoodCounts).reduce((a, b) =>
      recentMoodCounts[a] > recentMoodCounts[b] ? a : b
    );

    if (mostCommonMood === mood) {
      response += `You've been feeling this way quite often lately. `;
    } else {
      response += `That's different from your usual ${mostCommonMood.toLowerCase()} mood. `;
    }
  }

  response += `Here's a tip that might help: "${randomTip}"\n\nWhat triggered this feeling today?`;

  return response;
}

async function generateFollowUpResponse(message, mood, recentMoods) {
  const responses = {
    'Happy': [
      "That's wonderful! What made your day special?",
      "I'm glad you're feeling good! What's bringing you joy right now?",
      "Great to hear! What positive things happened today?"
    ],
    'Sad': [
      "I'm here for you. What happened that made you feel this way?",
      "It's okay to feel sad sometimes. Would you like to talk about what's bothering you?",
      "I'm sorry you're feeling down. What's on your mind?"
    ],
    'Anxious': [
      "Anxiety can be really tough. What's causing you to feel anxious right now?",
      "Take a deep breath with me. What thoughts are racing through your mind?",
      "I understand anxiety can be overwhelming. What's triggering these feelings?"
    ],
    'Neutral': [
      "Sometimes feeling neutral is just right. What's been on your mind lately?",
      "It's okay to have mixed feelings. What would make today better for you?",
      "Tell me more about your day. What stood out to you?"
    ],
    'Excited': [
      "Your excitement is contagious! What has you so pumped up?",
      "I love hearing that energy! What's got you feeling this way?",
      "That's fantastic! What exciting things are happening?"
    ],
    'Ambitious': [
      "That drive is amazing! What goals are you working toward?",
      "I can feel your motivation! What's inspiring you right now?",
      "Your ambition is inspiring! What are you aiming to achieve?"
    ]
  };

  const moodResponses = responses[mood] || ["Tell me more about what's on your mind."];
  return moodResponses[Math.floor(Math.random() * moodResponses.length)];
}

async function generateJournalingPrompt(mood) {
  const prompts = {
    'Happy': [
      "Write about three things that made you smile today.",
      "What positive changes have you noticed in your life recently?",
      "Describe a moment today when you felt truly content."
    ],
    'Sad': [
      "Write about what you're feeling without judgment. What does sadness feel like for you right now?",
      "What would help you feel better in this moment?",
      "Think about one small thing you can do for yourself today."
    ],
    'Anxious': [
      "List three things you can see, three things you can touch, and three things you can hear to ground yourself.",
      "Write down your anxious thoughts, then challenge one with evidence.",
      "What coping strategies have worked for you in the past?"
    ],
    'Neutral': [
      "Write about your day so far. What was ordinary, and what was noteworthy?",
      "What would make today more interesting or meaningful?",
      "Reflect on your current state. What do you need right now?"
    ],
    'Excited': [
      "Write about what has you feeling excited and why it matters to you.",
      "What actions can you take to channel this energy productively?",
      "Describe how this excitement feels in your body."
    ],
    'Ambitious': [
      "Write about your biggest goal right now. What steps are you taking?",
      "What motivates you to keep pushing forward?",
      "Describe a time when you achieved something you worked hard for."
    ]
  };

  const moodPrompts = prompts[mood] || ["Write about your thoughts and feelings right now."];
  const selectedPrompt = moodPrompts[Math.floor(Math.random() * moodPrompts.length)];

  return `Let's do some journaling to help process your feelings. Take a moment to write: "${selectedPrompt}"\n\nFeel free to share what you write, or just let me know when you're ready to continue!`;
}

async function generateGeneralResponse(message, recentMoods) {
  // Generate insights from mood history
  if (recentMoods.length >= 3) {
    const insights = await generateMoodInsights(recentMoods);
    if (insights) {
      return `Based on your recent mood patterns, I've noticed: ${insights}\n\nHow does that resonate with you?`;
    }
  }

  const generalResponses = [
    "I'm here to listen. What's on your mind?",
    "Tell me more about how you're feeling.",
    "How can I support you right now?",
    "What's been happening in your world lately?",
    "I'm glad you're sharing this with me. How else are you feeling?"
  ];

  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
}

async function generateMoodInsights(moods) {
  if (moods.length < 3) return null;

  const insights = [];

  // Check for patterns
  const moodCounts = {};
  const dayOfWeekCounts = {};

  moods.forEach(mood => {
    moodCounts[mood.mood] = (moodCounts[mood.mood] || 0) + 1;
    const dayOfWeek = new Date(mood.timestamp.toDate()).getDay();
    dayOfWeekCounts[dayOfWeek] = dayOfWeekCounts[dayOfWeek] || {};
    dayOfWeekCounts[dayOfWeek][mood.mood] = (dayOfWeekCounts[dayOfWeek][mood.mood] || 0) + 1;
  });

  // Most common mood
  const mostCommonMood = Object.keys(moodCounts).reduce((a, b) =>
    moodCounts[a] > moodCounts[b] ? a : b
  );

  if (moodCounts[mostCommonMood] > moods.length * 0.6) {
    insights.push(`you tend to feel ${mostCommonMood.toLowerCase()} most often`);
  }

  // Weekend vs weekday patterns
  const weekendMoods = [];
  const weekdayMoods = [];

  moods.forEach(mood => {
    const dayOfWeek = new Date(mood.timestamp.toDate()).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendMoods.push(mood.mood);
    } else {
      weekdayMoods.push(mood.mood);
    }
  });

  if (weekendMoods.length > 0 && weekdayMoods.length > 0) {
    const weekendAvg = weekendMoods.reduce((sum, mood) => sum + getMoodScore(mood), 0) / weekendMoods.length;
    const weekdayAvg = weekdayMoods.reduce((sum, mood) => sum + getMoodScore(mood), 0) / weekdayMoods.length;

    if (Math.abs(weekendAvg - weekdayAvg) > 1) {
      const betterDay = weekendAvg > weekdayAvg ? 'weekends' : 'weekdays';
      insights.push(`your mood tends to be better on ${betterDay}`);
    }
  }

  return insights.length > 0 ? insights.join(' and ') : null;
}

function getMoodScore(mood) {
  const scores = { 'Happy': 5, 'Excited': 4, 'Ambitious': 4, 'Neutral': 3, 'Sad': 2, 'Anxious': 1 };
  return scores[mood] || 3;
}

async function getRecentMoods(userId, days = 7) {
  if (!userId) return [];

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const moodsRef = collection(db, 'Moods');
    const q = query(
      moodsRef,
      where('userId', '==', userId),
      where('timestamp', '>=', startDate),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error fetching recent moods:', error);
    return [];
  }
}

function addUserMessage(message) {
  const chatWindow = document.getElementById('chat-window');
  if (!chatWindow) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message user';
  messageDiv.textContent = message;
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addBotMessage(message) {
  const chatWindow = document.getElementById('chat-window');
  if (!chatWindow) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message bot';
  messageDiv.innerHTML = message.replace(/\n/g, '<br>');
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTypingIndicator() {
  const chatWindow = document.getElementById('chat-window');
  if (!chatWindow) return;

  const typingDiv = document.createElement('div');
  typingDiv.id = 'typing-indicator';
  typingDiv.className = 'chat-message bot';
  typingDiv.innerHTML = '<em>Typing...</em>';
  chatWindow.appendChild(typingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Save journal entry to Firebase
export async function saveJournalEntry(entry, mood) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await addDoc(collection(db, 'Journals'), {
      userId: user.uid,
      entry: entry,
      mood: mood,
      timestamp: new Date()
    });

    await updateRewards(user.uid, 3); // 3 points for journaling
    showNotification('Journal entry saved! +3 points earned.', 'success');
  } catch (error) {
    console.error('Error saving journal entry:', error);
    showNotification('Failed to save journal entry.', 'error');
  }
}

// Show quick reply buttons
function showQuickReplies(options) {
  const quickRepliesDiv = document.getElementById('quick-replies');
  if (!quickRepliesDiv) return;

  quickRepliesDiv.innerHTML = '';
  options.forEach(option => {
    const button = document.createElement('button');
    button.className = 'quick-reply-btn';
    button.textContent = option;
    button.addEventListener('click', () => handleQuickReply(option));
    quickRepliesDiv.appendChild(button);
  });

  // Show the quick replies with animation
  setTimeout(() => {
    quickRepliesDiv.classList.add('show');
  }, 100);
}

// Handle quick reply selection
async function handleQuickReply(reply) {
  // Hide quick replies
  const quickRepliesDiv = document.getElementById('quick-replies');
  if (quickRepliesDiv) {
    quickRepliesDiv.classList.remove('show');
  }

  // Add user message
  addUserMessage(reply);

  // Add to conversation history
  conversationState.conversationHistory.push({
    type: 'user',
    message: reply,
    timestamp: new Date()
  });

  // Show typing indicator
  showTypingIndicator();

  // Process based on reply
  setTimeout(async () => {
    hideTypingIndicator();
    await processQuickReply(reply);
  }, 1000 + Math.random() * 1000);
}

// Process quick reply responses
async function processQuickReply(reply) {
  const user = auth.currentUser;
  let response = '';

  try {
    if (conversationState.conversationStep === 3) {
      // Journaling step
      if (reply === 'Save this entry') {
        // Save the last user message as journal entry
        const lastUserMessage = conversationState.conversationHistory
          .filter(h => h.type === 'user')
          .pop()?.message || '';
        await saveJournalEntry(lastUserMessage, conversationState.currentMood);
        response = "Great! Your journal entry has been saved. How are you feeling now?";
        conversationState.conversationStep = 4;
        showQuickReplies(['Better', 'Same', 'Need more help']);
      } else if (reply === 'Edit and save') {
        response = "Please share your edited journal entry, and I'll save it for you.";
        showQuickReplies(['Skip for now']);
      } else if (reply === 'Skip for now') {
        response = "No problem! We can journal anytime. What would you like to do next?";
        conversationState.conversationStep = 4;
        showQuickReplies(['New mood check', 'View history']);
      }
    } else if (reply === 'Start over') {
      resetConversation();
      response = "Let's start fresh! How are you feeling today?";
      showQuickReplies(['I\'m feeling stressed', 'I\'m happy today', 'Something else']);
    } else if (reply === 'Select mood') {
      response = "Feel free to select a mood from the options above, or tell me how you're feeling.";
      showQuickReplies(['I\'m feeling stressed', 'I\'m happy today', 'Something else']);
    } else if (reply === 'New mood check') {
      response = "Let's check in on your mood. How are you feeling right now?";
      conversationState.conversationStep = 0;
      showQuickReplies(['Happy', 'Sad', 'Anxious', 'Excited']);
    } else if (reply === 'View history') {
      response = "Here's a quick look at your recent moods...";
      // Load and display recent moods
      await loadRecentMoods();
      showQuickReplies(['New mood check', 'End chat']);
    } else if (reply === 'End chat') {
      response = "Take care! Remember, I'm here whenever you need to talk.";
      resetConversation();
    } else {
      // General quick reply handling
      response = await generateGeneralResponse(reply, await getRecentMoods(user?.uid, 7));
      showQuickReplies(['Tell me more', 'New mood check', 'End chat']);
    }

    addBotMessage(response);

    // Add to conversation history
    conversationState.conversationHistory.push({
      type: 'bot',
      message: response,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error in processQuickReply:', error);
    const errorResponse = "I'm sorry, I encountered an error. Let's try again.";
    addBotMessage(errorResponse);
    conversationState.conversationHistory.push({
      type: 'bot',
      message: errorResponse,
      timestamp: new Date()
    });
    showQuickReplies(['Start over', 'Select mood']);
  }
}

// Reset conversation state
export function resetConversation() {
  conversationState = {
    currentMood: null,
    conversationStep: 0,
    journalEntry: '',
    conversationHistory: []
  };
}
