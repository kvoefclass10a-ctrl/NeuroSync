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

// Initialize dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
  // Handle dropdown toggle buttons
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

  dropdownToggles.forEach(toggle => {
    const dropdown = toggle.parentElement.querySelector('div.absolute');

    toggle.addEventListener('mouseenter', () => {
      if (dropdown) {
        dropdown.classList.remove('hidden');
      }
    });

    toggle.addEventListener('mouseleave', () => {
      if (dropdown) {
        setTimeout(() => {
          if (dropdown && !dropdown.matches(':hover')) {
            dropdown.classList.add('hidden');
          }
        }, 300);
      }
    });

    if (dropdown) {
      dropdown.addEventListener('mouseenter', () => {
        dropdown.classList.remove('hidden');
      });

      dropdown.addEventListener('mouseleave', () => {
        setTimeout(() => {
          dropdown.classList.add('hidden');
        }, 300);
      });
    }
  });
});
