// feedback.js - Handle user feedback collection

// Firebase SDK imports
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth-compat.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore-compat.js";

const auth = getAuth();
const db = getFirestore();

// Initialize feedback functionality
export function initFeedback() {
  const feedbackForm = document.getElementById('feedback-form');
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', handleFeedbackSubmission);
  }
}

// Handle feedback form submission
async function handleFeedbackSubmission(event) {
  event.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    showNotification('Please log in to submit feedback.', 'error');
    return;
  }

  const feedbackType = document.getElementById('feedback-type').value;
  const subject = document.getElementById('feedback-subject').value.trim();
  const message = document.getElementById('feedback-message').value.trim();
  const rating = document.getElementById('feedback-rating').value;

  // Validation
  if (!subject || !message) {
    showNotification('Please fill in all required fields.', 'error');
    return;
  }

  if (message.length < 10) {
    showNotification('Please provide more detailed feedback (at least 10 characters).', 'error');
    return;
  }

  try {
    // Get user profile for additional context
    const profileDoc = await getDoc(doc(db, 'Profiles', user.uid));
    const profileData = profileDoc.exists() ? profileDoc.data() : {};

    // Submit feedback
    await addDoc(collection(db, 'Feedback'), {
      userId: user.uid,
      userEmail: user.email,
      userName: profileData.firstname && profileData.lastname
        ? `${profileData.firstname} ${profileData.lastname}`
        : user.displayName || user.email.split('@')[0],
      feedbackType: feedbackType,
      subject: subject,
      message: message,
      rating: parseInt(rating),
      userRole: profileData.role || 'Student',
      userClass: profileData.class || 'Not specified',
      submittedAt: new Date(),
      status: 'pending', // pending, reviewed, addressed
      adminResponse: null,
      respondedAt: null
    });

    showNotification('Thank you for your feedback! We appreciate your input.', 'success');

    // Reset form
    document.getElementById('feedback-form').reset();

    // Update rewards (+1 point for feedback)
    await updateRewards(user.uid, 1);

  } catch (error) {
    console.error('Error submitting feedback:', error);
    showNotification('Failed to submit feedback. Please try again.', 'error');
  }
}

// Update rewards points
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

// Load user's previous feedback
export async function loadUserFeedback() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const feedbackRef = collection(db, 'Feedback');
    const q = query(feedbackRef, where('userId', '==', user.uid), orderBy('submittedAt', 'desc'), limit(5));
    const querySnapshot = await getDocs(q);

    const feedbackHistory = document.getElementById('feedback-history');
    if (!feedbackHistory) return;

    feedbackHistory.innerHTML = '';

    if (querySnapshot.empty) {
      feedbackHistory.innerHTML = '<p class="text-center text-secondary py-4">No feedback submitted yet.</p>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const feedback = doc.data();
      const feedbackItem = document.createElement('div');
      feedbackItem.className = 'bg-tertiary rounded-lg p-4 border border-primary/50';

      const submittedDate = new Date(feedback.submittedAt.toDate()).toLocaleDateString();
      const statusColor = feedback.status === 'addressed' ? 'text-green-400' :
                         feedback.status === 'reviewed' ? 'text-blue-400' : 'text-yellow-400';

      feedbackItem.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-bold text-primary">${feedback.subject}</h4>
          <span class="text-xs ${statusColor} capitalize">${feedback.status}</span>
        </div>
        <p class="text-sm text-secondary mb-2">${feedback.message.substring(0, 100)}${feedback.message.length > 100 ? '...' : ''}</p>
        <div class="flex justify-between items-center text-xs text-secondary">
          <span>${feedback.feedbackType}</span>
          <span>${submittedDate}</span>
        </div>
        ${feedback.adminResponse ? `
          <div class="mt-3 p-3 bg-primary/50 rounded border-l-4 border-accent">
            <p class="text-sm text-accent font-medium">Admin Response:</p>
            <p class="text-sm text-secondary">${feedback.adminResponse}</p>
          </div>
        ` : ''}
      `;

      feedbackHistory.appendChild(feedbackItem);
    });

  } catch (error) {
    console.error('Error loading feedback history:', error);
  }
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
