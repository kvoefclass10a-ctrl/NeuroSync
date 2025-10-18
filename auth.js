// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

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

// Make auth available globally if needed
window.firebaseAuth = { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword };

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
  if (isLogin) {
    formTitle.textContent = 'Welcome Back!';
    formSubtitle.textContent = 'Sign in to continue your journey with NeuroSync.';
    submitButton.textContent = 'Sign In';
    authToggle.innerHTML = `Don't have an account? <a class="text-gray-300 underline hover:text-white cursor-pointer">Create Account</a>`;
  } else {
    formTitle.textContent = 'Create Your Free Account';
    formSubtitle.textContent = 'Unlock your potential with NeuroSync. It\'s free forever.';
    submitButton.textContent = 'Create Account';
    authToggle.innerHTML = `Already have an account? <a class="text-gray-300 underline hover:text-white cursor-pointer">Sign In</a>`;
  }
}

authToggle.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    toggleMode();
  }
});

authForm.addEventListener('submit', (e) => {
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
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
      // Signed up
      console.log('User signed up:', userCredential.user);
      // Redirect to the dashboard or home page after successful signup
      window.location.href = 'student-planner.html';
    })
    .catch((error) => {
      console.error('Signup error:', error);
      errorMessage.textContent = error.message;
    });
  }
});
