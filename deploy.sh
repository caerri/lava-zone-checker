#!/bin/bash

# Deployment script for Next.js app to EC2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Next.js app to EC2...${NC}"

# Variables - UPDATE THESE
EC2_IP="98.88.64.220"
EC2_USER="ubuntu"
PEM_FILE="../.pems/umyeah-ubuntu-key.pem"
APP_NAME="carrie-nextjs-sandbox"
REMOTE_PATH="/home/ubuntu/apps/$APP_NAME"

# Check if PEM file exists
if [ ! -f "$PEM_FILE" ]; then
    echo -e "${RED}❌ PEM file not found: $PEM_FILE${NC}"
    exit 1
fi

# Build the app locally
echo -e "${YELLOW}📦 Building Next.js app...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"

# Create deployment archive (excluding node_modules and .git)
echo -e "${YELLOW}📁 Creating deployment archive...${NC}"
tar -czf deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.next/cache' \
    --exclude='deploy.tar.gz' \
    .

# Copy files to EC2
echo -e "${YELLOW}📤 Uploading to EC2...${NC}"
scp -i "$PEM_FILE" -o ConnectTimeout=10 -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -o StrictHostKeyChecking=no deploy.tar.gz "$EC2_USER@$EC2_IP:/tmp/"

# SSH into EC2 and deploy
echo -e "${YELLOW}🔧 Setting up on EC2...${NC}"
ssh -i "$PEM_FILE" -o ConnectTimeout=10 -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" << 'EOF'
    # Update system
    sudo apt update

    # Install Node.js and npm if not already installed
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi

    # Install PM2 for process management
    if ! command -v pm2 &> /dev/null; then
        echo "Installing PM2..."
        sudo npm install -g pm2
    fi

    # Create app directory structure
    sudo mkdir -p /home/ubuntu/apps/carrie-nextjs-sandbox
    sudo chown -R ubuntu:ubuntu /home/ubuntu/apps

    # Extract and setup app
    cd /home/ubuntu/apps/carrie-nextjs-sandbox
    tar -xzf /tmp/deploy.tar.gz
    rm /tmp/deploy.tar.gz

    # Install dependencies
    npm install --production

    # Stop existing PM2 process if running
    pm2 delete carrie-nextjs-sandbox 2>/dev/null || true

    # Start the app with PM2
    pm2 start npm --name "carrie-nextjs-sandbox" -- start
    pm2 save
    pm2 startup

    echo "🎉 Deployment complete!"
    echo "Your app should be running on port 3000"
    echo "Access it at: http://$(curl -s ifconfig.me):3000"
EOF

# Cleanup
rm deploy.tar.gz

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${YELLOW}💡 Don't forget to:${NC}"
echo -e "   1. Open port 3000 in your EC2 security group"
echo -e "   2. Access your app at: http://98.88.64.220:3000"
echo -e "   3. Your app is now organized in: /home/ubuntu/apps/carrie-nextjs-sandbox"