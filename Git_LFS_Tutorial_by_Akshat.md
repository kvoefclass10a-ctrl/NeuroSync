🎧 Git LFS (Large File Storage) — Full Tutorial (for Future Uploads)
⚙️ 1️⃣ Setup (Only Once per System)
git lfs install

🎯 2️⃣ Track File Type (e.g. MP3, MP4, ZIP, PDF)
git lfs track "*.mp3"
git lfs track "*.mp4"
git lfs track "*.zip"
git lfs track "*.pdf"

📄 3️⃣ Verify .gitattributes File
* text=auto
*.mp3 filter=lfs diff=lfs merge=lfs -text

📂 4️⃣ Add and Commit Files
git add .gitattributes
git add path/to/your/file.mp3
git commit -m "Added new large file with LFS tracking"

☁️ 5️⃣ Push Files
git push origin main

🔍 6️⃣ Verify Upload
git lfs ls-files

🧠 7️⃣ Next Time (New Large Files)
git add your_file.mp3
git commit -m "Added new MP3 via LFS"
git push origin main

⚠️ 8️⃣ Common Errors and Fixes
Error	Fix
file >100MB	git lfs track "*.ext"
cannot lock ref	git pull origin main --rebase
object not found	git lfs fetch --all && git lfs checkout

⚡ Optional (Rename Files with Spaces)
git mv "Rain Sounds .mp3" Rain_Sounds.mp3
git commit -m "Rename file for safety"
git push origin main