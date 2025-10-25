#!/usr/bin/env python3
"""
Quick fix script to resolve the user_preferences.pkl directory issue
Run this script if you encounter: "[Errno 21] Is a directory: './database/user_preferences.pkl'"
"""

import os
import shutil

def fix_preferences_file():
    base_path = "./database"
    preferences_path = os.path.join(base_path, "user_preferences.pkl")
    
    print("=" * 60)
    print("User Preferences File Fix Script")
    print("=" * 60)
    
    # Ensure base directory exists
    if not os.path.exists(base_path):
        print(f"Creating base directory: {base_path}")
        os.makedirs(base_path, exist_ok=True)
    
    # Check if user_preferences.pkl exists
    if os.path.exists(preferences_path):
        if os.path.isdir(preferences_path):
            print(f"❌ Found directory at: {preferences_path}")
            print(f"Removing directory...")
            try:
                shutil.rmtree(preferences_path)
                print(f"✓ Directory removed successfully")
            except Exception as e:
                print(f"✗ Error removing directory: {e}")
                return False
        elif os.path.isfile(preferences_path):
            print(f"✓ File already exists at: {preferences_path}")
            print(f"File size: {os.path.getsize(preferences_path)} bytes")
            return True
    
    # Create an empty preferences file
    try:
        import pickle
        from collections import defaultdict
        
        empty_prefs = {}
        with open(preferences_path, "wb") as f:
            pickle.dump(empty_prefs, f)
        
        print(f"✓ Created empty preferences file at: {preferences_path}")
        return True
    except Exception as e:
        print(f"✗ Error creating file: {e}")
        return False

def check_other_files():
    """Check if other required database files exist"""
    print("\n" + "=" * 60)
    print("Checking other required database files...")
    print("=" * 60)
    
    required_files = [
        "database/map.pkl",
        "database/ncf_model.pth",
        "database/product_meta.json",
        "database/product_faiss.index",
        "database/prod_embeddings.npy"
    ]
    
    all_found = True
    for file_path in required_files:
        if os.path.exists(file_path):
            if os.path.isfile(file_path):
                size = os.path.getsize(file_path)
                print(f"✓ {file_path} ({size:,} bytes)")
            else:
                print(f"❌ {file_path} (is a directory, should be a file!)")
                all_found = False
        else:
            print(f"✗ {file_path} (missing)")
            all_found = False
    
    return all_found

def main():
    print("\nStarting diagnostic and fix process...\n")
    
    # Fix preferences file
    preferences_fixed = fix_preferences_file()
    
    # Check other files
    other_files_ok = check_other_files()
    
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    if preferences_fixed:
        print("✓ user_preferences.pkl: FIXED")
    else:
        print("✗ user_preferences.pkl: FAILED TO FIX")
    
    if other_files_ok:
        print("✓ All other database files: OK")
    else:
        print("⚠ Some database files: MISSING or INCORRECT")
    
    print("\n" + "=" * 60)
    
    if preferences_fixed and other_files_ok:
        print("✓ All checks passed! You can now start the API.")
        print("\nRun: uvicorn api:app --reload")
        return 0
    elif preferences_fixed:
        print("⚠ Preferences file fixed, but some database files are missing.")
        print("Please ensure all required database files are present.")
        return 1
    else:
        print("✗ Failed to fix preferences file. Please check permissions.")
        return 1

if __name__ == "__main__":
    exit(main())