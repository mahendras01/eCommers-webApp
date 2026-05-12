#!/bin/bash

# E-Commerce Backend Setup Script
# Safe to run multiple times (idempotent)

set -e  # Exit on first error

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PYTHON="$BACKEND_DIR/venv/bin/python"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 E-Commerce Backend Setup${NC}"
echo "   Backend directory: $BACKEND_DIR"
echo ""

# Check if venv exists
if [ ! -f "$VENV_PYTHON" ]; then
    echo -e "${RED}❌ Virtual environment not found at $VENV_PYTHON${NC}"
    echo "   Please create it first:"
    echo "   cd $BACKEND_DIR"
    echo "   python -m venv venv"
    exit 1
fi

# Check if run_setup.py exists
if [ ! -f "$BACKEND_DIR/run_setup.py" ]; then
    echo -e "${RED}❌ run_setup.py not found${NC}"
    exit 1
fi

# Run the Python setup runner
echo -e "${BLUE}=== Executing Setup Scripts ===${NC}"
echo ""

cd "$BACKEND_DIR"
"$VENV_PYTHON" run_setup.py

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Setup complete!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  Start your backend server:"
    echo "  cd $BACKEND_DIR"
    echo "  ./venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Setup failed${NC}"
    exit $exit_code
fi
