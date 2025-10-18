// Firebase v9+ compat SDK scripts (include these in your HTML head if not already present)
// <script src="https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/12.2.1/firebase-auth-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore-compat.js"></script>

// Assume Firebase is initialized with your config elsewhere on the page

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
  db.collection('users').doc(uid).set({
    firstName: firstName,
    lastName: lastName,
    age: age,
    classGrade: classGrade,
    role: role,
    photoUrl: photoUrl,
    email: email
  })
  .then(() => {
    alert('Profile saved successfully!');
  })
  .catch((error) => {
    alert('Error saving profile: ' + error.message);
  });
}
