import os
import json
import re
import datetime

def generate_manifest():
    history_dir = "history"
    # Save to dashboard public folder so React can access it locally
    manifest_file = "app-review-dashbaord/public/manifest.json"
    
    print(f"[{datetime.datetime.now()}] Generating manifest from {history_dir}...")
    
    if not os.path.exists(history_dir):
        print(f"Error: {history_dir} directory not found.")
        return

    # Regex to match YYYY-MM-DD and YYYY-MM-DD_vX
    # Matches 2025-12-01, 2025-12-01_v2, etc.
    date_pattern = re.compile(r"^\d{4}-\d{2}-\d{2}(_v\d+)?$")
    
    versions = []
    
    try:
        # List all subdirectories in history
        for entry in os.listdir(history_dir):
            full_path = os.path.join(history_dir, entry)
            if os.path.isdir(full_path) and date_pattern.match(entry):
                versions.append(entry)
        
        # Sort descending (newest first)
        # We can just sort strings descending because ISO date format sorts correctly alphabetically
        # 2025-12-01_v2 comes after 2025-12-01, which is what we want (v2 is newer)
        versions.sort(reverse=True)
        
        # Write to manifest.json
        with open(manifest_file, "w") as f:
            json.dump(versions, f, indent=4)
            
        print(f"Manifest generated with {len(versions)} entries.")
        print(f"Saved to {manifest_file}")
        print(f"Latest version: {versions[0] if versions else 'None'}")
        
    except Exception as e:
        print(f"Error generating manifest: {e}")

if __name__ == "__main__":
    generate_manifest()
