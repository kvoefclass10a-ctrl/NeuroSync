# Profile Completion Check Implementation

## Steps to Complete

- [ ] Add `isProfileComplete(profile)` utility function to check if firstname, lastname, age, and class are present
- [ ] Update `html/dashboard.html`: Load profile, check completeness, disable focus timer, mood tracker, and study library if incomplete, show completion message
- [ ] Update `index.html`: Load profile, check completeness before mood logging, show alert/redirect if incomplete
- [ ] Update `html/mood-selection.html`: Load profile, prevent mood logging if incomplete, show message
- [ ] Update `html/study-library.html`: Load profile, prevent browsing/uploads if incomplete, show message
- [ ] Test all pages to ensure checks work and messages are clear
- [ ] Verify navigation to profile.html works from messages
