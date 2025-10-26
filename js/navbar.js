// navbar.js - Navigation dropdown functionality

// Global functions for dropdown menus
window.openDropdown = function(element) {
  const dropdown = element.querySelector('div.absolute');
  if (dropdown) {
    dropdown.classList.remove('hidden');
  }
};

window.closeDropdown = function(element) {
  const dropdown = element.querySelector('div.absolute');
  if (dropdown) {
    dropdown.classList.add('hidden');
  }
};
