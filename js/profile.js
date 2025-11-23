// Firebase v9+ compat SDK scripts (include these in your HTML head if not already present)
// <script src="https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/12.2.1/firebase-auth-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore-compat.js"></script>

// Assume Firebase is initialized with your config elsewhere on the page

function loadProfile() {
  const user = firebase.auth().currentUser;

  if (!user) {
    alert('User not logged in');
    return;
  }

  const uid = user.uid;
  const db = firebase.firestore();

  db.collection('Profiles').doc(uid).get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        document.getElementById('firstName').value = data.firstname || '';
        document.getElementById('lastName').value = data.lastname || '';
        document.getElementById('age').value = data.age || '';
        document.getElementById('classGrade').value = data.class || '';
        document.getElementById('role').value = data.role || 'Student';
        document.getElementById('photoUrl').value = data.photoUrl || '';
      }
    })
    .catch((error) => {
      console.error('Error loading profile:', error);
    });
}

function saveProfile() {
  const user = firebase.auth().currentUser;

  if (!user) {
    alert('User not logged in');
    return;
  }

  // Get form field values
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const age = document.getElementById('age').value;
  const classGrade = document.getElementById('classGrade').value;
  const role = document.getElementById('role').value;
  const photoUrl = document.getElementById('photoUrl').value;

  // Get user data from Auth
  const email = user.email;
  const uid = user.uid;

  // Initialize Firestore
  const db = firebase.firestore();

  // Save to Firestore
  db.collection('Profiles').doc(uid).set({
    firstname: firstName,
    lastname: lastName,
    age: age,
    class: classGrade,
    preferredSubject: '', // Assuming not in form, can be added later
    role: role,
    photoUrl: photoUrl,
    email: email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    alert('Profile saved successfully!');
  })
  .catch((error) => {
    alert('Error saving profile: ' + error.message);
  });
}

// Make saveProfile available globally
window.saveProfile = saveProfile;

// Load profile on page load
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    loadProfile();
  }
});
