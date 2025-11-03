// study-library.js - Handle study materials upload and management

// Firebase SDK imports
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth-compat.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore-compat.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage-compat.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions-compat.js";

const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

// Initialize study library functionality
export function initStudyLibrary() {
  loadStudyMaterials();
  setupUploadForm();
}

// Load and display study materials from Cloudinary based on user class
export async function loadStudyMaterials() {
  try {
    const user = auth.currentUser;
    if (!user) {
      showNotification('Please log in to view study materials.', 'error');
      return;
    }

    // Get user profile to get class
    const profileDoc = await getDoc(doc(db, 'Profiles', user.uid));
    if (!profileDoc.exists()) {
      showNotification('Please complete your profile first.', 'error');
      return;
    }

    const userData = profileDoc.data();
    const userClass = userData.class;

    if (!userClass) {
      showNotification('Please set your class in your profile.', 'error');
      return;
    }

    showLoadingSpinner('#materials-container');

    // Call Cloud Function to get materials from Cloudinary
    const getStudyMaterials = httpsCallable('getStudyMaterials');
    const result = await getStudyMaterials({ class: userClass });

    displayCloudinaryMaterials(result.data);

  } catch (error) {
    console.error('Error loading study materials:', error);
    showNotification('Failed to load study materials.', 'error');
  }
}

// Display materials from Cloudinary
function displayCloudinaryMaterials(data) {
  const materialsContainer = document.getElementById('materials-container');
  if (!materialsContainer) return;

  materialsContainer.innerHTML = '';

  const materials = data.materials;
  const subjects = Object.keys(materials);

  if (subjects.length === 0) {
    materialsContainer.innerHTML = `
      <div class="text-center py-12">
        <span class="material-symbols-outlined text-6xl text-secondary mb-4">folder_open</span>
        <h3 class="text-xl font-bold text-primary mb-2">No Materials Found</h3>
        <p class="text-secondary">No study materials available for your class (${data.class}).</p>
      </div>
    `;
    return;
  }

  subjects.forEach(subject => {
    const subjectMaterials = materials[subject];
    const subjectCard = createSubjectCard(subject, subjectMaterials);
    materialsContainer.appendChild(subjectCard);
  });
}

// Create subject card with materials
function createSubjectCard(subject, materials) {
  const card = document.createElement('div');
  card.className = 'bg-secondary/50 backdrop-blur-sm border border-primary rounded-xl overflow-hidden dark:shadow-2xl dark:shadow-[#7E22CE]/5 light:shadow-lg light:shadow-cyan-500/5 mb-6';

  const materialsList = materials.map(material => `
    <div class="flex items-center justify-between py-3 px-4 border-b border-primary/20 last:border-b-0">
      <div class="flex items-center gap-3">
        <span class="text-2xl">${getFileIcon(material.format)}</span>
        <div>
          <h4 class="text-sm font-medium text-primary">${material.filename}</h4>
          <p class="text-xs text-secondary">${formatFileSize(material.bytes)}</p>
        </div>
      </div>
      <button onclick="downloadMaterial('${material.url}', '${material.filename}')" class="translucent-button px-3 py-1 rounded-full text-xs hover:scale-105 transition-transform">
        <span class="material-symbols-outlined text-sm mr-1">download</span>
        Download
      </button>
    </div>
  `).join('');

  card.innerHTML = `
    <div class="p-6">
      <div class="flex items-center gap-3 mb-4">
        <span class="material-symbols-outlined text-3xl text-accent">folder</span>
        <h3 class="text-xl font-bold text-primary">${subject}</h3>
        <span class="px-2 py-1 bg-accent/20 text-accent rounded-full text-xs font-medium">${materials.length} files</span>
      </div>
      <div class="space-y-1">
        ${materialsList}
      </div>
    </div>
  `;

  return card;
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
