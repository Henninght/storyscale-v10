# /backup

Creates a timestamped zip backup of the entire project.

## Steps
1. Get current timestamp in format YYYY-MM-DD-HH-mm
2. Create zip file named `backup-{timestamp}.zip` in project root
3. Exclude these folders/files from backup:
   - node_modules
   - .next
   - .git
   - dist
   - build
   - out
   - backup (folder)
   - *.zip (existing backups)
4. Show confirmation with backup file name and size
5. Suggest moving the backup to a safe location if needed
