// subject-details.js - Handle subject details display

// Materials structure will be loaded dynamically from JSON files
let materialsStructure = {};

// Initialize subject details functionality
export function initSubjectDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const subject = urlParams.get('subject');
  const userClass = urlParams.get('class') || 10;

  if (!subject) {
    showNotification('No subject specified.', 'error');
    return;
  }

  document.getElementById('subject-title').textContent = subject;
  loadSubjectDetails(subject, userClass);
}

// Load and display subject details
export async function loadSubjectDetails(subject, userClass) {
  try {
    showLoadingSpinner('#files-container');

    // Load materials structure from JSON file
    await loadMaterialsStructure(userClass);

    displaySubjectFiles(subject, userClass);

  } catch (error) {
    console.error('Error loading subject details:', error);
    showNotification('Failed to load subject details.', 'error');
  }
}

// Load materials structure from JSON file based on user class
async function loadMaterialsStructure(userClass) {
  try {
    const response = await fetch(`../assets/Study Library/class${userClass}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load materials for class ${userClass}`);
    }
    const data = await response.json();
    materialsStructure[userClass] = data;
  } catch (error) {
    console.error('Error loading materials structure:', error);
    showNotification('Failed to load materials structure.', 'error');
  }
}

// Display subject files
function displaySubjectFiles(subject, userClass) {
  const container = document.getElementById('files-container');
  if (!container) return;

  const classData = materialsStructure[userClass];
  if (!classData || !classData[subject]) {
    container.innerHTML = `
      <div class="text-center py-12">
        <span class="material-symbols-outlined text-6xl text-secondary mb-4">folder_open</span>
        <h3 class="text-xl font-bold text-primary mb-2">No Materials Found</h3>
        <p class="text-secondary">No study materials available for ${subject}.</p>
      </div>
    `;
    return;
  }

  const subjectData = classData[subject];
  const subKeys = Object.keys(subjectData);
  let totalFiles = 0;
  let filesHTML = '';

  // Count total files
  subKeys.forEach(sub => {
    const subData = subjectData[sub];
    if (Array.isArray(subData)) {
      totalFiles += subData.length;
    } else {
      Object.values(subData).forEach(subSubData => {
        if (Array.isArray(subSubData)) {
          totalFiles += subSubData.length;
        }
      });
    }
  });

  // Update file count
  document.getElementById('file-count').textContent = `${totalFiles} files`;

  subKeys.forEach(sub => {
    const subData = subjectData[sub];
    const subFileCount = Array.isArray(subData) ? subData.length : Object.values(subData).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

    filesHTML += `
      <div class="folder-section mb-8" data-folder="${sub}">
        <h4 class="text-xl font-bold text-primary mb-4 flex items-center gap-3">
          <span class="text-3xl group-hover:scale-110 transition-transform duration-300">📂</span>
          <span>${sub}</span>
          <span class="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full font-medium">${subFileCount} files</span>
        </h4>
        <div class="grid grid-cols-1 gap-16 file-grid" id="grid-${sub.replace(/\s+/g, '-').toLowerCase()}">
    `;

    if (Array.isArray(subData)) {
      // Direct files
      subData.forEach(file => {
        const fileIcon = getFileIcon(file.split('.').pop().toLowerCase());
        const fileName = file.replace(/\.[^/.]+$/, "");
        const fileExt = file.split('.').pop().toUpperCase();
        const fileTypeColor = getFileTypeColor(fileExt.toLowerCase());

        filesHTML += `
          <div class="file-card bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm border border-primary/20 rounded-xl p-8 hover:border-accent/60 hover:from-accent/5 hover:to-primary/5 transition-all duration-500 group hover:shadow-lg hover:shadow-accent/10 transform hover:-translate-y-1">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4 flex-1">
                <div class="relative">
                  <div class="text-4xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 filter drop-shadow-lg">${fileIcon}</div>
                  <div class="absolute -top-1 -right-1 w-3 h-3 ${fileTypeColor} rounded-full border-2 border-secondary/80"></div>
                </div>
                <div class="flex-1 min-w-0">
                  <h5 class="font-bold text-primary text-base mb-2 group-hover:text-accent transition-colors duration-300 truncate" title="${fileName}">${fileName}</h5>
                  <div class="flex items-center gap-3 text-xs text-secondary/80">
                    <span class="bg-primary/30 px-2 py-1 rounded-md font-medium">${fileExt}</span>
                    <span class="flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">schedule</span>
                      Recently added
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex gap-3">
                <button onclick="viewMaterial('../assets/Study Library/class ${userClass}/${subject}/${sub}/${file}', '${file}')"
                        class="view-btn bg-gradient-to-r from-accent/20 to-accent/30 hover:from-accent/40 hover:to-accent/50 text-accent hover:text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2 border border-accent/40 hover:border-accent hover:shadow-md hover:shadow-accent/20">
                  <span class="material-symbols-outlined text-base">visibility</span>
                  <span>View</span>
                </button>
                <button onclick="downloadMaterial('../assets/Study Library/class ${userClass}/${subject}/${sub}/${file}', '${file}')"
                        class="download-btn bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 text-primary hover:text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2 border border-primary/40 hover:border-primary hover:shadow-md hover:shadow-primary/20">
                  <span class="material-symbols-outlined text-base">download</span>
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        `;
      });
    } else {
      // Nested folders
      const subSubKeys = Object.keys(subData);
      subSubKeys.forEach(subSub => {
        const subSubData = subData[subSub];
        const subSubFileCount = Array.isArray(subSubData) ? subSubData.length : 0;

        filesHTML += `
          <div class="col-span-full mb-4">
            <h5 class="text-lg font-semibold text-secondary mb-3 flex items-center gap-2 ml-6">
              <span class="text-2xl">📁</span>
              <span>${subSub}</span>
              <span class="text-xs bg-secondary/30 text-secondary px-2 py-1 rounded-full">${subSubFileCount} files</span>
            </h5>
          </div>
        `;

        subSubData.forEach(file => {
          const fileIcon = getFileIcon(file.split('.').pop().toLowerCase());
          const fileName = file.replace(/\.[^/.]+$/, "");
          const fileExt = file.split('.').pop().toUpperCase();
          const fileTypeColor = getFileTypeColor(fileExt.toLowerCase());

          filesHTML += `
            <div class="file-card ml-12 bg-gradient-to-r from-primary/8 to-secondary/8 backdrop-blur-sm border border-primary/15 rounded-xl p-4 hover:border-accent/50 hover:from-accent/3 hover:to-primary/3 transition-all duration-500 group hover:shadow-md hover:shadow-accent/5 transform hover:-translate-y-0.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3 flex-1">
                  <div class="relative">
                    <div class="text-3xl group-hover:scale-110 transition-all duration-300">${fileIcon}</div>
                    <div class="absolute -top-0.5 -right-0.5 w-2 h-2 ${fileTypeColor} rounded-full border border-secondary/60"></div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h5 class="font-semibold text-primary text-sm mb-1 group-hover:text-accent transition-colors truncate" title="${fileName}">${fileName}</h5>
                    <div class="flex items-center gap-2 text-xs text-secondary/70">
                      <span class="bg-primary/20 px-1.5 py-0.5 rounded text-xs font-medium">${fileExt}</span>
                    </div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button onclick="viewMaterial('../assets/Study Library/class ${userClass}/${subject}/${sub}/${subSub}/${file}', '${file}')"
                          class="bg-accent/15 hover:bg-accent/25 text-accent hover:text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-105 flex items-center gap-1 border border-accent/30 hover:border-accent">
                    <span class="material-symbols-outlined text-sm">visibility</span>
                    View
                  </button>
                  <button onclick="downloadMaterial('../assets/Study Library/class ${userClass}/${subject}/${sub}/${subSub}/${file}', '${file}')"
                          class="bg-primary/15 hover:bg-primary/25 text-primary hover:text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-105 flex items-center gap-1 border border-primary/30 hover:border-primary">
                    <span class="material-symbols-outlined text-sm">download</span>
                    Download
                  </button>
                </div>
              </div>
            </div>
          `;
        });
      });
    }

    filesHTML += `
        </div>
      </div>
    `;
  });

  container.innerHTML = `<div class="space-y-8">${filesHTML}</div>`;

  // Add search functionality
  setTimeout(() => {
    const searchInput = document.getElementById('modal-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const folderSections = container.querySelectorAll('.folder-section');

        if (!query) {
          // Show all when search is empty
          folderSections.forEach(section => {
            section.style.display = 'block';
            const fileCards = section.querySelectorAll('.file-card');
            fileCards.forEach(card => card.style.display = 'block');
          });
          return;
        }

        folderSections.forEach(section => {
          const folderName = section.querySelector('h4')?.textContent.toLowerCase() || '';
          const fileCards = section.querySelectorAll('.file-card');
          let hasVisibleFiles = false;

          fileCards.forEach(card => {
            const fileName = card.querySelector('h5')?.textContent.toLowerCase() || '';
            const fileExt = card.querySelector('.bg-primary\\/30, .bg-primary\\/20')?.textContent.toLowerCase() || '';

            // Search in file name, extension, and folder name
            const matches = fileName.includes(query) ||
                           fileExt.includes(query) ||
                           folderName.includes(query);

            if (matches) {
              card.style.display = 'block';
              hasVisibleFiles = true;
            } else {
              card.style.display = 'none';
            }
          });

          // Show/hide entire folder section based on whether it has visible files
          section.style.display = hasVisibleFiles ? 'block' : 'none';
        });
      });
    }

    // Add view toggle functionality
    const gridBtn = document.getElementById('view-toggle-grid');
    const listBtn = document.getElementById('view-toggle-list');

    if (gridBtn && listBtn) {
      gridBtn.addEventListener('click', () => {
        const grids = container.querySelectorAll('.file-grid');
        grids.forEach(grid => {
          grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 file-grid';
        });
        gridBtn.classList.add('bg-accent/40', 'text-accent');
        gridBtn.classList.remove('bg-accent/20');
        listBtn.classList.remove('bg-primary/40', 'text-primary');
        listBtn.classList.add('bg-primary/20');
      });

      listBtn.addEventListener('click', () => {
        const grids = container.querySelectorAll('.file-grid');
        grids.forEach(grid => {
          grid.className = 'grid grid-cols-1 gap-3 file-grid';
        });
        listBtn.classList.add('bg-primary/40', 'text-primary');
        listBtn.classList.remove('bg-primary/20');
        gridBtn.classList.remove('bg-accent/40', 'text-accent');
        gridBtn.classList.add('bg-accent/20');
      });
    }
  }, 100);
}

// Get file icon based on type
function getFileIcon(fileType) {
  const icons = {
    'pdf': '📄',
    'doc': '📝',
    'docx': '📝',
    'ppt': '📊',
    'pptx': '📊',
    'xls': '📈',
    'xlsx': '📈',
    'jpg': '🖼️',
    'png': '🖼️',
    'txt': '📝'
  };
  return icons[fileType] || '📄';
}

// Get file type color for indicators
function getFileTypeColor(fileType) {
  const colors = {
    'pdf': 'bg-red-500',
    'doc': 'bg-blue-500',
    'docx': 'bg-blue-600',
    'ppt': 'bg-orange-500',
    'pptx': 'bg-orange-600',
    'xls': 'bg-green-500',
    'xlsx': 'bg-green-600',
    'jpg': 'bg-purple-500',
    'png': 'bg-purple-500',
    'txt': 'bg-gray-500'
  };
  return colors[fileType] || 'bg-gray-400';
}

// Show loading spinner
function showLoadingSpinner(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
      <p class="text-secondary">Loading subject details...</p>
    </div>
  `;
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

// Make functions globally available for onclick handlers
window.viewMaterial = viewMaterial;
window.downloadMaterial = downloadMaterial;

// View material
export function viewMaterial(fileUrl, fileName) {
  const link = document.createElement('a');
  link.href = fileUrl;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Download material
export function downloadMaterial(fileUrl, fileName) {
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
