import os
import json
import re
import datetime
import argparse

def generate_manifest():
    # Base history directory
    history_base = os.path.join("dashboard", "public", "history")
    manifest_file = os.path.join("dashboard", "public", "manifest.json")
    
    print(f"[{datetime.datetime.now()}] Generating multi-app manifest from {history_base}...")
    
    if not os.path.exists(history_base):
        print(f"Error: {history_base} directory not found.")
        return

    # Regex to match YYYY-MM-DD...
    date_pattern = re.compile(r"^\d{4}-\d{2}-\d{2}")
    
    manifest_data = {}
    
    # App Name Mapping
    app_names = {
        "com.nextbillion.groww": "Groww",
        "com.zerodha.kite3": "Kite by Zerodha",
        "com.dot.app.sancharsaathi": "Sanchar Saathi",
        "in.powerup.money": "PowerUp Money",
        "com.wealthmonitor": "Wealth Monitor",
        "com.kuvera.android": "Kuvera"
    }

    try:
        # Iterate through each App ID folder
        for app_id in os.listdir(history_base):
            app_dir = os.path.join(history_base, app_id)
            
            if not os.path.isdir(app_dir):
                continue
                
            # Skip hidden folders/files
            if app_id.startswith('.'):
                continue
                
            print(f"Scanning App: {app_id}")
            
            versions = []
            for entry in os.listdir(app_dir):
                full_path = os.path.join(app_dir, entry)
                if os.path.isdir(full_path) and date_pattern.match(entry):
                    versions.append(entry)
            
            # Sort descending (newest first)
            versions.sort(reverse=True)
            
            if versions:
                manifest_data[app_id] = {
                    "name": app_names.get(app_id, app_id),
                    "latest": versions[0],
                    "versions": versions
                }
        
        # Write to manifest.json
        with open(manifest_file, "w") as f:
            json.dump(manifest_data, f, indent=4)
            
        print(f"Manifest generated for {len(manifest_data)} apps.")
        print(f"Saved to {manifest_file}")
        
    except Exception as e:
        print(f"Error generating manifest: {e}")

if __name__ == "__main__":
    # No args needed anymore as it scans everything
    generate_manifest()
