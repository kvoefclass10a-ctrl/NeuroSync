# TODO: Integrate Cloudinary for Profile Image Uploads

## Tasks
- [ ] Add Cloudinary upload widget script to profile.html
- [ ] Modify photo upload logic in profile.html to use Cloudinary instead of Firebase Storage
- [ ] Update saveProfile function to retrieve Cloudinary URL and save to Firestore
- [ ] Handle upload errors and validation
- [ ] Test the integration by uploading an image and verifying in Firestore
- [ ] Update profile.js if needed to match changes

## Notes
- Cloudinary config: cloud_name: 'dwlxccz91', api_key: '499129969588495'
- Use upload preset 'unsigned_preset' (placeholder; create in Cloudinary dashboard if needed)
- Ensure secure_url is stored in photoUrl field in Profiles collection
