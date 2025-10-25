#!/usr/bin/env python3
"""
Initialize user preferences file for Docker container
This script ensures user_preferences.pkl is a file, not a directory
"""

import pickle
import os
import shutil

def init_preferences():
    prefs_file = "/app/database/user_preferences.pkl"
    
    print("Initializing user preferences file...")
    
    # Remove if it's a directory
    if os.path.isdir(prefs_file):
        print(f"Warning: {prefs_file} is a directory. Removing...")
        shutil.rmtree(prefs_file)
        print(f"✓ Removed directory")
    
    # Ensure parent directory exists
    os.makedirs(os.path.dirname(prefs_file), exist_ok=True)
    
    # Create empty preferences file if it doesn't exist
    if not os.path.exists(prefs_file) or not os.path.isfile(prefs_file):
        with open(prefs_file, "wb") as f:
            pickle.dump({}, f)
        print(f"✓ Created user preferences file at {prefs_file}")
    else:
        print(f"✓ User preferences file already exists at {prefs_file}")
    
    return True

if __name__ == "__main__":
    try:
        init_preferences()
        exit(0)
    except Exception as e:
        print(f"✗ Error initializing preferences: {e}")
        exit(1)