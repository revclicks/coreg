#!/bin/bash

# CoReg Platform - One-Command Installer
# Usage: curl -sSL https://raw.githubusercontent.com/user/repo/main/install.sh | bash

set -e

echo "🚀 CoReg Platform - One-Command Installer"
echo "=========================================="

# Download and run the main setup script
curl -sSL https://raw.githubusercontent.com/yourusername/coreg-platform/main/setup-digitalocean.sh -o setup-digitalocean.sh
chmod +x setup-digitalocean.sh
./setup-digitalocean.sh

# Clean up
rm setup-digitalocean.sh

echo "✅ Installation completed!"