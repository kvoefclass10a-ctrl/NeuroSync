// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCFQ36vxZ5qWhxXXptKe_sXlFVZxzRtCBY",
  authDomain: "neurosync-5173b.firebaseapp.com",
  projectId: "neurosync-5173b",
  storageBucket: "neurosync-5173b.firebasestorage.app",
  messagingSenderId: "855780859936",
  appId: "1:855780859936:web:3044309100db9a61fa1c45",
  measurementId: "G-75S5GWYEDK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Make auth available globally if needed
window.firebaseAuth = { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword };

// Password toggle functionality
const togglePasswordButton = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');

togglePasswordButton.addEventListener('click', () => {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  const icon = togglePasswordButton.querySelector('span');
  icon.textContent = type === 'password' ? 'visibility' : 'visibility_off';
});

// DOM elements (assuming they exist in your HTML)
const authForm = document.getElementById('auth-form');
const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');
const submitButton = document.getElementById('submit-button');
const authToggle = document.getElementById('auth-toggle');
const errorMessage = document.getElementById('error-message');

let isLogin = false; // false for signup, true for login

function toggleMode() {
  isLogin = !isLogin;
  errorMessage.textContent = '';
  const profileFields = document.querySelectorAll('[id^="profile-fields"]');
  if (isLogin) {
    formTitle.textContent = 'Welcome Back!';
    formSubtitle.textContent = 'Sign in to continue your journey with NeuroSync.';
    submitButton.textContent = 'Sign In';
    authToggle.innerHTML = `Don't have an account? <a class="text-gray-300 underline hover:text-white cursor-pointer">Create Account</a>`;
    profileFields.forEach(field => field.style.display = 'none');
  } else {
    formTitle.textContent = 'Create Your Free Account';
    formSubtitle.textContent = 'Unlock your potential with NeuroSync. It\'s free forever.';
    submitButton.textContent = 'Create Account';
    authToggle.innerHTML = `Already have an account? <a class="text-gray-300 underline hover:text-white cursor-pointer">Sign In</a>`;
    profileFields.forEach(field => field.style.display = 'block');
  }
}

authToggle.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    toggleMode();
  }
});

async function signUp(email, password, firstname, lastname, age, className, preferredSubject, role) {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // Create profile linked to UID
    await setDoc(doc(db, "Profiles", user.uid), {
      firstname,
      lastname,
      age,
      class: className,
      preferredSubject,
      role,
      createdAt: serverTimestamp()
    });

    console.log("✅ Profile created successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  errorMessage.textContent = '';

  if (isLogin) {
    // Handle Login
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        console.log('User signed in:', userCredential.user);
        // Redirect to the dashboard or home page after successful login
        window.location.href = 'student-planner.html';
      })
      .catch((error) => {
        console.error('Login error:', error);
        errorMessage.textContent = error.message;
      });
  } else {
    // Handle Sign Up
    const firstname = document.getElementById('firstname').value;
    const lastname = document.getElementById('lastname').value;
    const age = document.getElementById('age').value;
    const className = document.getElementById('className').value;
    const preferredSubject = document.getElementById('preferredSubject').value;
    const role = document.getElementById('role').value;

    try {
      await signUp(email, password, firstname, lastname, age, className, preferredSubject, role);
      console.log('User signed up and profile created');
      // Redirect to the dashboard or home page after successful signup
      window.location.href = 'student-planner.html';
    } catch (error) {
      console.error('Signup error:', error);
      errorMessage.textContent = error.message;
    }
  }
});
