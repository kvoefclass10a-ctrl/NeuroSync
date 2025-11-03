const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cloudinary = require('cloudinary').v2;

admin.initializeApp();

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dwlxccz91',
  api_key: '499129969588495',
  api_secret: 'dWeJIxy56N5V2rHpzYPcWKs41t8'
});

// Cloud Function to get study materials from Cloudinary based on user class
exports.getStudyMaterials = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const userClass = data.class;

  if (!userClass) {
    throw new functions.https.HttpsError('invalid-argument', 'User class is required');
  }

  try {
    // Get user profile to verify class
    const userDoc = await admin.firestore().collection('Profiles').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User profile not found');
    }

    const userData = userDoc.data();
    if (userData.class !== userClass) {
      throw new functions.https.HttpsError('permission-denied', 'Class mismatch');
    }

    // List resources from Cloudinary in the user's class folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: `${userClass}/`, // e.g., "9th/"
      max_results: 500
    });

    // Group resources by subject (folder)
    const materialsBySubject = {};

    result.resources.forEach(resource => {
      // Extract subject from public_id (e.g., "9th/Mathematics/file.pdf" -> "Mathematics")
      const parts = resource.public_id.split('/');
      if (parts.length >= 2) {
        const subject = parts[1];
        if (!materialsBySubject[subject]) {
          materialsBySubject[subject] = [];
        }
        materialsBySubject[subject].push({
          public_id: resource.public_id,
          url: resource.secure_url,
          filename: resource.public_id.split('/').pop(),
          format: resource.format,
          bytes: resource.bytes,
          created_at: resource.created_at
        });
      }
    });

    return {
      class: userClass,
      materials: materialsBySubject
    };

  } catch (error) {
    console.error('Error fetching study materials:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch study materials');
  }
});
