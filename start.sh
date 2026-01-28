#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           AI Interior Design - Startup Script              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Configuration
BACKEND_PORT=3001
FRONTEND_PORT=3000
DB_NAME="ai_interior_design"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill process on a port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

# Function to wait for a port to be available
wait_for_port() {
    local port=$1
    local service=$2
    local max_attempts=30
    local attempt=0

    echo -e "${YELLOW}Waiting for $service on port $port...${NC}"
    while [ $attempt -lt $max_attempts ]; do
        if nc -z localhost $port 2>/dev/null; then
            echo -e "${GREEN}$service is ready on port $port${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    echo -e "${RED}$service failed to start on port $port${NC}"
    return 1
}

# Step 1: Clean up ports
echo -e "\n${BLUE}[1/7] Cleaning up ports...${NC}"
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT
echo -e "${GREEN}Ports cleaned${NC}"

# Step 2: Check prerequisites
echo -e "\n${BLUE}[2/7] Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}npm is not installed. Please install npm${NC}"
    exit 1
fi

echo -e "${GREEN}Node.js version: $(node --version)${NC}"
echo -e "${GREEN}npm version: $(npm --version)${NC}"

# Step 3: Check PostgreSQL
echo -e "\n${BLUE}[3/7] Checking PostgreSQL...${NC}"

# Check if PostgreSQL is running
if command_exists pg_isready; then
    if pg_isready -q; then
        echo -e "${GREEN}PostgreSQL is running${NC}"
    else
        echo -e "${YELLOW}Starting PostgreSQL...${NC}"
        if command_exists brew; then
            brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null
        elif command_exists pg_ctl; then
            pg_ctl start -D /usr/local/var/postgres
        fi
        sleep 3
    fi
else
    echo -e "${YELLOW}pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# Create database if it doesn't exist
echo -e "${YELLOW}Checking database...${NC}"
if command_exists psql; then
    psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME || createdb $DB_NAME 2>/dev/null
    echo -e "${GREEN}Database '$DB_NAME' is ready${NC}"
else
    echo -e "${YELLOW}psql not found, skipping database check${NC}"
fi

# Step 4: Install dependencies
echo -e "\n${BLUE}[4/7] Installing dependencies...${NC}"

cd "$(dirname "$0")"
ROOT_DIR=$(pwd)

# Load environment variables from root .env
echo -e "${YELLOW}Loading environment variables...${NC}"
set -a
source "$ROOT_DIR/.env"
set +a

echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd "$ROOT_DIR/backend"
npm install --silent
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install backend dependencies${NC}"
    exit 1
fi

echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd "$ROOT_DIR/frontend"
npm install --silent
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install frontend dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}Dependencies installed${NC}"

# Step 5: Run database migrations
echo -e "\n${BLUE}[5/7] Running database migrations...${NC}"
cd "$ROOT_DIR/backend"

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push --accept-data-loss
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to run database migrations${NC}"
    exit 1
fi
echo -e "${GREEN}Database schema updated${NC}"

# Step 6: Seed database
echo -e "\n${BLUE}[6/7] Seeding database with sample data...${NC}"
cd "$ROOT_DIR/backend"
node src/seed.js
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to seed database${NC}"
    exit 1
fi
echo -e "${GREEN}Database seeded successfully${NC}"

# Step 7: Start services
echo -e "\n${BLUE}[7/7] Starting services...${NC}"

# Start backend
cd "$ROOT_DIR/backend"
echo -e "${YELLOW}Starting backend server on port $BACKEND_PORT...${NC}"
npm run dev &
BACKEND_PID=$!

# Start frontend
cd "$ROOT_DIR/frontend"
echo -e "${YELLOW}Starting frontend server on port $FRONTEND_PORT...${NC}"
npm run dev &
FRONTEND_PID=$!

# Wait for services to be ready
sleep 3
wait_for_port $BACKEND_PORT "Backend"
wait_for_port $FRONTEND_PORT "Frontend"

# Print success message
echo -e "\n${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              All services started successfully!            ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║                                                           ║"
echo "║  Frontend:  http://localhost:$FRONTEND_PORT                      ║"
echo "║  Backend:   http://localhost:$BACKEND_PORT                      ║"
echo "║                                                           ║"
echo "║  Demo Login:                                              ║"
echo "║    Email:    demo@aiinterior.com                          ║"
echo "║    Password: demo123456                                   ║"
echo "║                                                           ║"
echo "║  Press Ctrl+C to stop all services                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Handle shutdown
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    echo -e "${GREEN}Services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait
