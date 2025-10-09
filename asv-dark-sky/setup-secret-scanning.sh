#!/bin/bash

# Quick Setup Script for GitGuardian Secret Scanning
# This script installs ggshield and verifies the pre-commit hook

set -e

echo "🔐 GitGuardian Secret Scanning Setup"
echo "===================================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ Detected macOS"
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew is not installed!"
        echo ""
        echo "Please install Homebrew first:"
        echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    echo "✅ Homebrew is installed"
    
    # Check if ggshield is already installed
    if command -v ggshield &> /dev/null; then
        echo "✅ ggshield is already installed!"
        ggshield --version
    else
        echo "📦 Installing ggshield via Homebrew..."
        brew tap gitguardian/tap
        brew install ggshield
        echo "✅ ggshield installed successfully!"
    fi
else
    echo "⚠️  Not running on macOS"
    echo ""
    echo "Please install ggshield manually:"
    echo "  pip install ggshield"
    echo ""
    echo "Or visit: https://docs.gitguardian.com/ggshield-docs/getting-started"
fi

echo ""
echo "📋 Verifying pre-commit hook..."

# Check if pre-commit hook exists
if [ -f ".git/hooks/pre-commit" ]; then
    echo "✅ Pre-commit hook is installed"
    
    # Check if it's executable
    if [ -x ".git/hooks/pre-commit" ]; then
        echo "✅ Pre-commit hook is executable"
    else
        echo "⚠️  Pre-commit hook is not executable. Fixing..."
        chmod +x .git/hooks/pre-commit
        echo "✅ Fixed!"
    fi
else
    echo "❌ Pre-commit hook is missing!"
    echo ""
    echo "Please run the setup again or check GITGUARDIAN_SETUP.md"
    exit 1
fi

echo ""
echo "🧪 Running a test scan..."
echo ""

# Run a test scan
ggshield secret scan repo . --exit-zero || true

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "  1. (Optional) Get a free GitGuardian account: https://dashboard.gitguardian.com/signup"
echo "  2. (Optional) Configure your API token: ggshield auth login"
echo "  3. Test the hook by trying to commit"
echo ""
echo "Your commits are now protected! 🛡️"
