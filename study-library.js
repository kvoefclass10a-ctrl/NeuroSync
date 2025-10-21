// study-library.js - Handle study materials upload and management

// Firebase SDK imports
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth-compat.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore-compat.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage-compat.js";

const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

// Initialize study library functionality
export function initStudyLibrary() {
  loadStudyMaterials();
  setupUploadForm();
}

// Load and display study materials
export async function loadStudyMaterials() {
  try {
    const materialsRef = collection(db, 'StudyLibrary');
    const q = query(materialsRef, where('approved', '==', true), orderBy('uploadedAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const materialsContainer = document.getElementById('materials-container');
    if (!materialsContainer) return;

    materialsContainer.innerHTML = '';

    if (querySnapshot.empty) {
      materialsContainer.innerHTML = '<p class="text-center text-secondary py-8">No study materials available yet. Be the first to share!</p>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const material = doc.data();
      const materialElement = createMaterialElement(material, doc.id);
      materialsContainer.appendChild(materialElement);
    });

  } catch (error) {
    console.error('Error loading study materials:', error);
    showNotification('Failed to load study materials.', 'error');
  }
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
  const fileInput = document.getElementById('file-input');
  const uploadBtn = document.getElementById('upload-btn');

  if (!uploadForm) return;

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await uploadMaterial();
  });

  // File input change handler
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          showNotification('File size must be less than 10MB.', 'error');
          fileInput.value = '';
          return;
        }

        // Update upload button text
        if (uploadBtn) {
          uploadBtn.textContent = `Upload ${file.name}`;
        }
      }
    });
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
