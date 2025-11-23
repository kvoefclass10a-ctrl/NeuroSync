// Navbar functionality for student planner
document.addEventListener('DOMContentLoaded', function() {
  const navbarItems = document.querySelectorAll('.navbar div:not(.nav-logo):not(.nav-auth)');
  const heroArms = document.querySelectorAll('.hero .arms div');
  const plannerSections = document.querySelectorAll('.planner-section');

  // Function to show specific section
  function showSection(sectionId) {
    // Hide all sections
    plannerSections.forEach(section => {
      section.classList.remove('active');
    });

    // Show the selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
    }
  }

  // Function to update active navbar state
  function updateActiveNavbar(activeItem) {
    // Remove active class from all navbar items
    navbarItems.forEach(item => {
      item.classList.remove('active-tab');
    });
    heroArms.forEach(item => {
      item.classList.remove('active-arm');
    });

    // Add active class to clicked item
    if (activeItem) {
      activeItem.classList.add('active-tab');
    }
  }

  // Navbar click handlers
  navbarItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      const sectionMap = {
        0: 'scheduler', // Home (but this is a link, so skip)
        1: 'scheduler', // Tasks
        2: 'deadlines', // Deadlines
        3: 'progress', // Progress
        4: 'recommendations', // Recs
        5: 'timer' // Settings (using timer as settings section)
      };

      if (sectionMap[index]) {
        showSection(sectionMap[index]);
        updateActiveNavbar(item);
      }
    });
  });

  // Hero arms click handlers
  heroArms.forEach((item, index) => {
    item.addEventListener('click', () => {
      const sectionMap = {
        0: null, // Home (link, skip)
        1: 'scheduler', // Task Scheduler
        2: 'deadlines', // Deadline Tracker
        3: 'progress', // Progress Monitor
        4: 'recommendations', // Recommendations
        5: 'timer' // Settings (using timer as settings section)
      };

      if (sectionMap[index]) {
        showSection(sectionMap[index]);
        updateActiveNavbar(navbarItems[index]);
      }
    });
  });

  // Show default section on page load
  showSection('scheduler');
  if (navbarItems[1]) { // Tasks item
    updateActiveNavbar(navbarItems[1]);
  }
});
