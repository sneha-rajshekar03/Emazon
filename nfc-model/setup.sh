#!/bin/bash

# Setup script for the Hybrid Recommender API
# This script prepares the environment and downloads necessary models

set -e  # Exit on error

echo "=================================="
echo "Hybrid Recommender API Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Python 3 found"

# Create database/models directory if it doesn't exist
echo "Creating directories..."
mkdir -p database/models
echo -e "${GREEN}✓${NC} Directories created"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✓${NC} Virtual environment created"
else
    echo -e "${YELLOW}!${NC} Virtual environment already exists"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
if [ -f "requirements.txt" ]; then
    echo "Installing requirements..."
    pip install -r requirements.txt
    echo -e "${GREEN}✓${NC} Requirements installed"
else
    echo -e "${RED}Error: requirements.txt not found${NC}"
    exit 1
fi

# Download sentence transformer model
echo "Downloading sentence transformer model..."
python3 << EOF
import os
from sentence_transformers import SentenceTransformer

cache_folder = "./database/models"
os.makedirs(cache_folder, exist_ok=True)

print("Downloading sentence-transformers/all-MiniLM-L6-v2...")
try:
    model = SentenceTransformer(
        "sentence-transformers/all-MiniLM-L6-v2",
        cache_folder=cache_folder
    )
    print("✓ Model downloaded successfully!")
except Exception as e:
    print(f"Error downloading model: {e}")
    exit(1)
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Sentence transformer model downloaded"
else
    echo -e "${RED}✗${NC} Failed to download model"
    exit 1
fi

# Check if database files exist
echo "Checking database files..."
required_files=(
    "database/map.pkl"
    "database/ncf_model.pth"
    "database/product_meta.json"
    "database/product_faiss.index"
    "database/prod_embeddings.npy"
)

missing_files=0
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗${NC} Missing: $file"
        missing_files=$((missing_files + 1))
    else
        echo -e "${GREEN}✓${NC} Found: $file"
    fi
done

if [ $missing_files -gt 0 ]; then
    echo -e "${YELLOW}Warning: $missing_files database file(s) missing${NC}"
    echo "Please ensure all database files are in the ./database/ directory"
fi

echo ""
echo "=================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=================================="
echo ""
echo "To start the API server, run:"
echo "  source venv/bin/activate"
echo "  uvicorn api:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "Or use Docker:"
echo "  docker build -t recommender-api ."
echo "  docker run -p 8000:8000 recommender-api"
echo ""
#!/bin/bash
# Quick fix script for user_preferences.pkl issue

echo "=========================================="
echo "Fixing user_preferences.pkl issue..."
echo "=========================================="

# Check if database directory exists
if [ ! -d "./database" ]; then
    echo "Creating database directory..."
    mkdir -p ./database
fi

# Remove user_preferences.pkl if it's a directory
if [ -d "./database/user_preferences.pkl" ]; then
    echo "Removing directory: ./database/user_preferences.pkl"
    rm -rf ./database/user_preferences.pkl
    echo "✓ Directory removed"
fi

# Create proper user_preferences.pkl file
echo "Creating user_preferences.pkl file..."
python3 << 'EOF'
import pickle
import os

prefs_file = "./database/user_preferences.pkl"
os.makedirs(os.path.dirname(prefs_file), exist_ok=True)

if not os.path.exists(prefs_file) or not os.path.isfile(prefs_file):
    with open(prefs_file, "wb") as f:
        pickle.dump({}, f)
    print(f"✓ Created: {prefs_file}")
else:
    print(f"✓ Already exists: {prefs_file}")
EOF

# Verify the fix
echo ""
echo "Verifying..."
if [ -f "./database/user_preferences.pkl" ]; then
    echo "✓ user_preferences.pkl is now a file"
    ls -lh ./database/user_preferences.pkl
else
    echo "✗ Failed to create user_preferences.pkl"
    exit 1
fi

echo ""
echo "=========================================="
echo "Fix completed successfully!"
echo "=========================================="
echo ""
echo "You can now build and run Docker:"
echo "  docker-compose up --build"
echo ""
echo "Or run locally:"
echo "  uvicorn api:app --reload"