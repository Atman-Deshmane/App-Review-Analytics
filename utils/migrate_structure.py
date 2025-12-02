import os
import shutil
import datetime

def migrate_structure():
    print(f"[{datetime.datetime.now()}] Starting Repository Migration...")

    # 1. Rename 'app-review-dashbaord' to 'dashboard'
    old_dashboard_name = "app-review-dashbaord"
    new_dashboard_name = "dashboard"
    
    if os.path.exists(old_dashboard_name):
        if os.path.exists(new_dashboard_name):
            print(f"Warning: Target folder '{new_dashboard_name}' already exists. Merging/Overwriting...")
            # In a real scenario, we might want to be more careful, but for now let's assume rename is fine
            # or we might need to move contents. 
            # Let's try simple rename first, if it fails because dest exists, we handle it.
            try:
                os.rename(old_dashboard_name, new_dashboard_name)
                print(f"Renamed '{old_dashboard_name}' to '{new_dashboard_name}'")
            except OSError:
                print(f"Could not rename directly (maybe '{new_dashboard_name}' is not empty). Skipping rename.")
        else:
            os.rename(old_dashboard_name, new_dashboard_name)
            print(f"Renamed '{old_dashboard_name}' to '{new_dashboard_name}'")
    else:
        print(f"Folder '{old_dashboard_name}' not found. Checking if already renamed...")
        if os.path.exists(new_dashboard_name):
            print(f"Folder '{new_dashboard_name}' found. Proceeding.")
        else:
            print(f"Error: Neither '{old_dashboard_name}' nor '{new_dashboard_name}' found.")
            return

    # 2. Migrate History
    # Target: dashboard/public/history/com.nextbillion.groww/
    history_base = os.path.join(new_dashboard_name, "public", "history")
    app_id = "com.nextbillion.groww"
    target_app_dir = os.path.join(history_base, app_id)

    if not os.path.exists(history_base):
        print(f"Error: History folder '{history_base}' not found.")
        return

    # Create app-specific folder
    if not os.path.exists(target_app_dir):
        os.makedirs(target_app_dir)
        print(f"Created directory: {target_app_dir}")

    # Move existing date-based folders
    # We look for folders that start with 202... (simple heuristic for YYYY-MM-DD)
    # or just move everything that is a directory and NOT the app_id itself.
    
    items = os.listdir(history_base)
    moved_count = 0
    
    for item in items:
        item_path = os.path.join(history_base, item)
        
        # Skip if it's the target directory itself
        if item == app_id:
            continue
            
        # Skip files (like .DS_Store)
        if not os.path.isdir(item_path):
            continue
            
        # Check if it looks like a date folder (starts with 20)
        if item.startswith("20"):
            target_path = os.path.join(target_app_dir, item)
            
            # Move it
            try:
                shutil.move(item_path, target_path)
                print(f"Moved '{item}' to '{target_app_dir}'")
                moved_count += 1
            except Exception as e:
                print(f"Error moving '{item}': {e}")
                
    print(f"Migration complete. Moved {moved_count} folders.")

if __name__ == "__main__":
    migrate_structure()
