# Profile Page Implementation TODO

## 1. Create Profile Page (profile.html)
- [x] Create new profile.html file with form for first name, last name, age, class, role (dropdown: Student/Teacher/Parent), and profile photo upload
- [x] Include Firebase SDK imports (Auth, Firestore, Storage)
- [x] Add authentication check to redirect unauthenticated users
- [x] Style the page to match the app's dark theme using Tailwind CSS
- [x] Make the page responsive for different screen sizes
- [x] Add form validation (required fields, age as number, etc.)
- [x] Implement photo preview functionality
- [x] Add JavaScript for form submission: upload photo to Firebase Storage, save profile data to Firestore
- [x] Handle errors and success messages

## 2. Update Student Planner (student-planner.html)
- [ ] Add Firebase Storage import to the script
- [ ] Modify the auth.onAuthStateChanged to fetch profile data from Firestore on load
- [ ] Update the side menu profile photo (background-image) with profile photo URL or default
- [ ] Update user-name with first name + last name or displayName fallback
- [ ] Update role display with profile role or default "Student"
- [ ] Update welcome message to use first name if available
- [ ] Add a "Profile" link in the side menu navigation (under Settings)

## 3. Testing and Validation
- [ ] Test profile creation and update functionality
- [ ] Verify profile data displays correctly in student planner
- [ ] Test photo upload and display
- [ ] Ensure authentication redirects work
- [ ] Test form validation and error handling
- [ ] Check responsive design on different devices

## 4. Additional Features
- [ ] Add default avatar if no photo uploaded
- [ ] Implement photo change functionality (update existing profile)
- [ ] Add loading states during upload/save operations
