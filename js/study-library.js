      // study-library.js - Handle study materials display

// Materials structure will be loaded dynamically from JSON files
let materialsStructure = {};

// Initialize study library functionality
export function initStudyLibrary() {
  loadStudyMaterials();
}

// Load and display study materials based on user class
export async function loadStudyMaterials() {
  try {
    // For testing purposes, use class 10 directly
    const userClass = 10;

    showLoadingSpinner('#materials-container');

    // Load materials structure from JSON file
    await loadMaterialsStructure(userClass);

    displayLocalMaterials(userClass);

  } catch (error) {
    console.error('Error loading study materials:', error);
    showNotification('Failed to load study materials.', 'error');
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

// Display local materials
function displayLocalMaterials(userClass) {
  const container = document.getElementById('materials-container');
  if (!container) return;

  container.innerHTML = '';

  const classData = materialsStructure[userClass];
  if (!classData) {
    container.innerHTML = `
      <div class="text-center py-12">
        <span class="material-symbols-outlined text-6xl text-secondary mb-4">folder_open</span>
        <h3 class="text-xl font-bold text-primary mb-2">No Materials Found</h3>
        <p class="text-secondary">No study materials available for your class (${userClass}).</p>
      </div>
    `;
    return;
  }

  // Display subjects as folder icons
  const subjects = Object.keys(classData);
  const subjectGrid = document.createElement('div');
  subjectGrid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-40';

  subjects.forEach(subject => {
    const subjectCard = document.createElement('div');
    subjectCard.className = 'bg-secondary/80 backdrop-blur-sm rounded-xl p-6 cursor-pointer hover:border-accent hover:bg-secondary hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl';
    subjectCard.onclick = () => {
      // Navigate to subject details page
      window.location.href = `subject-details.html?subject=${encodeURIComponent(subject)}&class=${userClass}`;
    };

    subjectCard.innerHTML = `
      <div class="flex flex-col items-center text-center">
        <div class="text-9xl mb-10 text-accent drop-shadow-lg filter hover:drop-shadow-[0_0_15px_rgba(147,51,234,0.8)] hover:text-yellow-400 transition-all duration-300 hover:scale-110 hover:rotate-3">📁</div>
        <h3 class="text-3xl font-bold text-primary mb-3 hover:text-accent transition-colors duration-300">${subject}</h3>
        <p class="text-base text-secondary hover:text-primary transition-colors duration-300">Click to explore materials</p>
      </div>
    `;

    subjectGrid.appendChild(subjectCard);
  });

  container.appendChild(subjectGrid);
}

// Show subject details in a modal or expanded view
function showSubjectDetails(subject, subjectData, userClass) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-md';
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };

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

  // Add search and filter bar
  const searchBar = `
    <div class="bg-primary/20 backdrop-blur-sm rounded-xl p-4 mb-6 border border-primary/30">
      <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div class="flex-1 max-w-md">
          <div class="relative">
            <input type="text" id="modal-search" placeholder="Search files in ${subject}..."
                   class="w-full px-4 py-3 bg-secondary/50 border border-primary/40 rounded-lg text-black placeholder-secondary/70 focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-300 text-sm">
            <span class="material-symbols-outlined absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary/70 text-lg">search</span>
          </div>
        </div>
        <div class="flex items-center gap-4 text-sm text-secondary">
          <span class="flex items-center gap-1">
            <span class="material-symbols-outlined text-base">description</span>
            ${totalFiles} files
          </span>
          <div class="flex gap-2">
            <button id="view-toggle-grid" class="p-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors" title="Grid View">
              <span class="material-symbols-outlined text-sm">grid_view</span>
            </button>
            <button id="view-toggle-list" class="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors" title="List View">
              <span class="material-symbols-outlined text-sm">list</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

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

  modal.innerHTML = `
    <div class="bg-gradient-to-br from-secondary/98 to-primary/95 backdrop-blur-xl rounded-3xl p-8 max-w-7xl max-h-[90vh] overflow-hidden mx-4 shadow-2xl border border-primary/30 relative">
      <!-- Animated background elements -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden rounded-3xl">
        <div class="absolute top-10 left-10 w-32 h-32 bg-accent/5 rounded-full blur-xl animate-pulse"></div>
        <div class="absolute bottom-10 right-10 w-40 h-40 bg-primary/5 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-secondary/5 rounded-full blur-lg animate-pulse delay-500"></div>
      </div>

      <div class="relative z-10">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-4">
            <div class="text-5xl animate-bounce">📚</div>
            <div>
              <h2 class="text-4xl font-bold text-primary mb-1">${subject}</h2>
              <p class="text-secondary text-base flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">library_books</span>
                Study materials and resources
              </p>
            </div>
          </div>
          <button onclick="this.closest('.fixed').remove()"
                  class="text-3xl text-secondary hover:text-primary hover:bg-primary/20 rounded-full w-14 h-14 flex items-center justify-center transition-all duration-300 hover:rotate-180 hover:scale-110 shadow-lg hover:shadow-xl">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Search and Controls -->
        ${searchBar}

        <!-- Files Container -->
        <div class="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-accent/30 scrollbar-track-transparent pr-2">
          <div class="space-y-8">
            ${filesHTML}
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add search functionality
  setTimeout(() => {
    const searchInput = document.getElementById('modal-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const folderSections = modal.querySelectorAll('.folder-section');

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
        const grids = modal.querySelectorAll('.file-grid');
        grids.forEach(grid => {
          grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 file-grid';
        });
        gridBtn.classList.add('bg-accent/40', 'text-accent');
        gridBtn.classList.remove('bg-accent/20');
        listBtn.classList.remove('bg-primary/40', 'text-primary');
        listBtn.classList.add('bg-primary/20');
      });

      listBtn.addEventListener('click', () => {
        const grids = modal.querySelectorAll('.file-grid');
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

// Create material element for display
function createMaterialElement(material, docId) {
  const element = document.createElement('div');
  element.className = 'bg-secondary rounded-lg p-4 border border-primary/50 hover:border-accent transition-colors';

  const fileIcon = getFileIcon(material.fileType);
  const uploadDate = new Date(material.uploadedAt.toDate()).toLocaleDateString();

  element.innerHTML = `
    <div class="flex items-start gap-4">
      <div class="text-3xl">${fileIcon}</div>
      <div class="flex-1">
        <h3 class="font-bold text-primary">${material.title}</h3>
        <p class="text-sm text-secondary mb-2">${material.description}</p>
        <div class="flex items-center gap-4 text-xs text-secondary">
          <span>By ${material.uploaderName}</span>
          <span>${material.subject}</span>
          <span>${uploadDate}</span>
        </div>
      </div>
      <div class="flex gap-2">
        <button onclick="downloadMaterial('${material.fileUrl}', '${material.title}')" class="translucent-button px-3 py-1 rounded text-sm">
          Download
        </button>
        ${auth.currentUser?.uid === material.uploadedBy ? `<button onclick="deleteMaterial('${docId}')" class="text-red-400 hover:text-red-300 text-sm">Delete</button>` : ''}
      </div>
    </div>
  `;

  return element;
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

// Setup upload form
function setupUploadForm() {
  const uploadForm = document.getElementById('upload-form');

  if (!uploadForm) return;

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await uploadMaterial();
  });
}

// Cloudinary upload widget
export function openCloudinaryWidget() {
  const user = auth.currentUser;
  if (!user) {
    showNotification('Please log in to upload materials.', 'error');
    return;
  }

  // Get user class for folder structure
  const profileDoc = getDoc(doc(db, 'Profiles', user.uid));
  profileDoc.then((docSnap) => {
    if (!docSnap.exists()) {
      showNotification('Please complete your profile first.', 'error');
      return;
    }

    const userData = docSnap.data();
    const userClass = userData.class;

    if (!userClass) {
      showNotification('Please set your class in your profile.', 'error');
      return;
    }

    const widget = cloudinary.createUploadWidget({
      cloudName: 'dwlxccz91', // Replace with your Cloudinary cloud name
      uploadPreset: 'study-materials', // Create this preset in Cloudinary
      folder: `${userClass}/`,
      sources: ['local', 'url'],
      multiple: false,
      maxFileSize: 10000000, // 10MB
      resourceType: 'auto',
      clientAllowedFormats: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'mp4', 'mp3'],
      styles: {
        palette: {
          window: '#1A1122',
          windowBorder: '#2A1F36',
          tabIcon: '#FFFFFF',
          menuIcons: '#ad92c9',
          textDark: '#FFFFFF',
          textLight: '#ad92c9',
          link: '#8013ec',
          action: '#8013ec',
          inactiveTabIcon: '#ad92c9',
          error: '#ff0000',
          inProgress: '#8013ec',
          complete: '#00ff00',
          sourceBg: '#2A1F36'
        }
      }
    }, (error, result) => {
      if (!error && result && result.event === "success") {
        console.log('Upload successful:', result.info);
        // Store metadata in Firestore
        saveMaterialMetadata(result.info, userClass);
      }
    });

    widget.open();
  }).catch((error) => {
    console.error('Error getting user profile:', error);
    showNotification('Error loading profile.', 'error');
  });
}

// Save material metadata to Firestore
async function saveMaterialMetadata(cloudinaryResult, userClass) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    // Get form data
    const title = document.getElementById('material-title').value.trim();
    const description = document.getElementById('material-description').value.trim();
    const subject = document.getElementById('material-subject').value;
    const type = document.getElementById('material-type').value;

    if (!title || !subject || !type) {
      showNotification('Please fill in all required fields.', 'error');
      return;
    }

    // Get user profile for uploader name
    const profileDoc = await getDoc(doc(db, 'Profiles', user.uid));
    const profileData = profileDoc.exists() ? profileDoc.data() : {};
    const uploaderName = profileData.firstname && profileData.lastname
      ? `${profileData.firstname} ${profileData.lastname}`
      : user.email.split('@')[0];

    // Save material info to Firestore
    await addDoc(collection(db, 'StudyLibrary'), {
      title: title,
      description: description,
      subject: subject,
      class: userClass,
      type: type,
      fileUrl: cloudinaryResult.secure_url,
      fileName: cloudinaryResult.original_filename,
      fileType: cloudinaryResult.format,
      fileSize: cloudinaryResult.bytes,
      uploadedBy: user.uid,
      uploaderName: uploaderName,
      uploadedAt: new Date(),
      approved: false, // Requires admin approval
      downloads: 0,
      cloudinaryId: cloudinaryResult.public_id
    });

    showNotification('Material uploaded successfully! It will be reviewed for approval.', 'success');

    // Reset form
    document.getElementById('upload-form').reset();
    closeUploadModal();

    // Reload materials
    loadStudyMaterials();

  } catch (error) {
    console.error('Error saving material metadata:', error);
    showNotification('Failed to save material information.', 'error');
  }
}

// Upload material to Firebase
async function uploadMaterial() {
  const user = auth.currentUser;
  if (!user) {
    showNotification('Please log in to upload materials.', 'error');
    return;
  }

  const fileInput = document.getElementById('file-input');
  const titleInput = document.getElementById('material-title');
  const descriptionInput = document.getElementById('material-description');
  const subjectInput = document.getElementById('material-subject');

  const file = fileInput.files[0];
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const subject = subjectInput.value;

  // Validation
  if (!file || !title || !description || !subject) {
    showNotification('Please fill in all fields and select a file.', 'error');
    return;
  }

  try {
    // Upload file to Storage
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `study_materials/${fileName}`);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Get user profile for uploader name
    const profileDoc = await getDoc(doc(db, 'Profiles', user.uid));
    const profileData = profileDoc.exists() ? profileDoc.data() : {};
    const uploaderName = profileData.firstname && profileData.lastname
      ? `${profileData.firstname} ${profileData.lastname}`
      : user.email.split('@')[0];

    // Save material info to Firestore
    await addDoc(collection(db, 'StudyLibrary'), {
      title: title,
      description: description,
      subject: subject,
      fileUrl: downloadURL,
      fileName: fileName,
      fileType: fileExtension,
      fileSize: file.size,
      uploadedBy: user.uid,
      uploaderName: uploaderName,
      uploadedAt: new Date(),
      approved: false, // Requires admin approval
      downloads: 0
    });

    showNotification('Material uploaded successfully! It will be reviewed for approval.', 'success');

    // Reset form
    fileInput.value = '';
    titleInput.value = '';
    descriptionInput.value = '';
    subjectInput.value = 'Mathematics';

    // Update rewards (+10 points for upload, awarded on approval)
    // Points will be awarded when admin approves the material

  } catch (error) {
    console.error('Error uploading material:', error);
    showNotification('Failed to upload material. Please try again.', 'error');
  }
}

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

  // Increment download count (optional)
  // This would require finding the document by fileUrl and updating downloads count
}

// Delete material (only by uploader)
export async function deleteMaterial(docId) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    // Get material data first
    const materialDoc = await getDoc(doc(db, 'StudyLibrary', docId));
    if (!materialDoc.exists()) return;

    const material = materialDoc.data();

    // Check if user is the uploader
    if (material.uploadedBy !== user.uid) {
      showNotification('You can only delete your own materials.', 'error');
      return;
    }

    // Delete from Storage
    const fileRef = ref(storage, `study_materials/${material.fileName}`);
    await deleteObject(fileRef);

    // Delete from Firestore
    await deleteDoc(doc(db, 'StudyLibrary', docId));

    showNotification('Material deleted successfully.', 'success');

    // Reload materials
    loadStudyMaterials();

  } catch (error) {
    console.error('Error deleting material:', error);
    showNotification('Failed to delete material.', 'error');
  }
}

// Load user's uploaded materials (for management)
export async function loadUserMaterials() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const materialsRef = collection(db, 'StudyLibrary');
    const q = query(materialsRef, where('uploadedBy', '==', user.uid), orderBy('uploadedAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const userMaterialsContainer = document.getElementById('user-materials-container');
    if (!userMaterialsContainer) return;

    userMaterialsContainer.innerHTML = '';

    if (querySnapshot.empty) {
      userMaterialsContainer.innerHTML = '<p class="text-center text-secondary py-4">You haven\'t uploaded any materials yet.</p>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const material = doc.data();
      const materialElement = createUserMaterialElement(material, doc.id);
      userMaterialsContainer.appendChild(materialElement);
    });

  } catch (error) {
    console.error('Error loading user materials:', error);
  }
}

// Create user material element (with approval status)
function createUserMaterialElement(material, docId) {
  const element = document.createElement('div');
  element.className = 'bg-tertiary rounded-lg p-4 border border-primary/50';

  const uploadDate = new Date(material.uploadedAt.toDate()).toLocaleDateString();
  const statusColor = material.approved ? 'text-green-400' : 'text-yellow-400';
  const statusText = material.approved ? 'Approved' : 'Pending Approval';

  element.innerHTML = `
    <div class="flex items-start gap-4">
      <div class="text-2xl">${getFileIcon(material.fileType)}</div>
      <div class="flex-1">
        <h3 class="font-bold text-primary">${material.title}</h3>
        <p class="text-sm text-secondary mb-1">${material.description}</p>
        <div class="flex items-center gap-4 text-xs">
          <span class="text-secondary">${material.subject}</span>
          <span class="text-secondary">${uploadDate}</span>
          <span class="${statusColor}">${statusText}</span>
        </div>
      </div>
      <button onclick="deleteMaterial('${docId}')" class="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded hover:bg-red-400/10">
        Delete
      </button>
    </div>
  `;

  return element;
}

// Show loading spinner
function showLoadingSpinner(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
      <p class="text-secondary">Loading study materials...</p>
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



// Toggle files visibility
export function toggleFiles(subject, sub, userClass) {
  const filesContainer = document.getElementById(`files-${subject}-${sub}`);
  if (filesContainer) {
    const isHidden = filesContainer.classList.contains('hidden');
    if (isHidden) {
      filesContainer.classList.remove('hidden');
      filesContainer.classList.add('block');
    } else {
      filesContainer.classList.add('hidden');
      filesContainer.classList.remove('block');
    }
  }
}

// Search and filter functions
export function searchMaterials() {
  const searchInput = document.getElementById('search-input');
  const query = searchInput.value.toLowerCase();
  const materialCards = document.querySelectorAll('#materials-container > div');

  materialCards.forEach(card => {
    const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
    const description = card.querySelector('p')?.textContent.toLowerCase() || '';
    const isVisible = title.includes(query) || description.includes(query);
    card.style.display = isVisible ? 'block' : 'none';
  });
}

export function filterMaterials(subject) {
  const materialCards = document.querySelectorAll('#materials-container > div');
  const filterButtons = document.querySelectorAll('.filter-btn');

  // Update button states
  filterButtons.forEach(btn => {
    if (btn.id === `filter-${subject}` || (subject === 'all' && btn.id === 'filter-all')) {
      btn.classList.add('bg-accent', 'text-primary');
      btn.classList.remove('text-muted');
    } else {
      btn.classList.remove('bg-accent', 'text-primary');
      btn.classList.add('text-muted');
    }
  });

  // Filter materials
  materialCards.forEach(card => {
    if (subject === 'all') {
      card.style.display = 'block';
    } else {
      const cardSubject = card.querySelector('h3')?.textContent;
      card.style.display = cardSubject === subject ? 'block' : 'none';
    }
  });
}

// Modal functions
export function openUploadModal() {
  const modal = document.getElementById('upload-modal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

export function closeUploadModal() {
  const modal = document.getElementById('upload-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Make functions globally available for onclick handlers
window.viewMaterial = viewMaterial;
window.downloadMaterial = downloadMaterial;
