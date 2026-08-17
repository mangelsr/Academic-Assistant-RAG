#!/usr/bin/env bash
# ==============================================================================
# Academic Assistant RAG - Local Development Launcher
# ==============================================================================

set -euo pipefail

# ANSI Color Codes
BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
RESET='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

# Default configuration
MODE="native" # options: native, docker, backend-only, frontend-only
INSTALL_DEPS=false
BACKEND_PORT=8000
FRONTEND_PORT=4200

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down local development environment...${RESET}"
    if [ -n "${BACKEND_PID}" ] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
        echo -e "${CYAN}Stopping Backend API (PID: ${BACKEND_PID})...${RESET}"
        kill -TERM "${BACKEND_PID}" 2>/dev/null || true
    fi
    if [ -n "${FRONTEND_PID}" ] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
        echo -e "${CYAN}Stopping Frontend SPA (PID: ${FRONTEND_PID})...${RESET}"
        kill -TERM "${FRONTEND_PID}" 2>/dev/null || true
    fi
    wait 2>/dev/null || true
    echo -e "${GREEN}✓ All processes terminated.${RESET}"
}

print_banner() {
    echo -e "${MAGENTA}${BOLD}"
    echo "============================================================"
    echo "   🎓 ACADEMIC ASSISTANT RAG - LOCAL DEV ENVIRONMENT"
    echo "============================================================"
    echo -e "${RESET}"
}

usage() {
    print_banner
    echo -e "${BOLD}Usage:${RESET} ./start.sh [options]"
    echo ""
    echo -e "${BOLD}Options:${RESET}"
    echo "  --docker          Run backend via Docker Compose and frontend locally"
    echo "  --backend-only    Run only the FastAPI backend server"
    echo "  --frontend-only   Run only the Angular frontend server"
    echo "  --install         Force dependency re-installation before starting"
    echo "  --help, -h        Show this help message"
    echo ""
    exit 0
}

# Parse CLI arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --docker)
            MODE="docker"
            shift
            ;;
        --backend-only)
            MODE="backend-only"
            shift
            ;;
        --frontend-only)
            MODE="frontend-only"
            shift
            ;;
        --install)
            INSTALL_DEPS=true
            shift
            ;;
        --help|-h)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${RESET}"
            usage
            ;;
    esac
done

trap cleanup EXIT INT TERM

print_banner

# Docker execution mode
if [ "$MODE" = "docker" ]; then
    echo -e "${CYAN}🐳 Starting backend via Docker Compose...${RESET}"
    docker-compose up --build -d backend
    echo -e "${GREEN}✓ Backend container is up on http://localhost:${BACKEND_PORT}${RESET}"
    
    echo -e "${CYAN}🅰️  Starting Frontend Angular SPA locally...${RESET}"
    cd "${FRONTEND_DIR}"
    if [ "$INSTALL_DEPS" = true ] || [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing frontend dependencies...${RESET}"
        pnpm install
    fi
    echo -e "${GREEN}🚀 Running Angular Frontend at http://localhost:${FRONTEND_PORT}${RESET}"
    pnpm start
    exit 0
fi

# Native execution mode
echo -e "${CYAN}🔍 Checking prerequisites...${RESET}"

if ! command -v python3 &>/dev/null; then
    echo -e "${RED}❌ python3 is required but not installed.${RESET}"
    exit 1
fi

if command -v pnpm &>/dev/null; then
    PKG_MGR="pnpm"
elif command -v npm &>/dev/null; then
    PKG_MGR="npm"
else
    echo -e "${RED}❌ Neither pnpm nor npm is installed.${RESET}"
    exit 1
fi

setup_backend() {
    echo -e "${CYAN}🐍 Setting up Python backend environment...${RESET}"
    cd "${BACKEND_DIR}"
    
    if [ ! -d ".venv" ]; then
        echo -e "${YELLOW}Creating Python virtual environment (.venv)...${RESET}"
        python3 -m venv .venv
    fi

    source .venv/bin/activate

    if [ "$INSTALL_DEPS" = true ]; then
        echo -e "${YELLOW}Installing Python dependencies from requirements.txt...${RESET}"
        pip install -r requirements.txt
    fi
}

setup_frontend() {
    echo -e "${CYAN}🅰️  Setting up Angular frontend environment...${RESET}"
    cd "${FRONTEND_DIR}"
    if [ "$INSTALL_DEPS" = true ] || [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing frontend dependencies with ${PKG_MGR}...${RESET}"
        ${PKG_MGR} install
    fi
}

start_backend() {
    setup_backend
    echo -e "${CYAN}🚀 Starting FastAPI Backend (Local Dev Mode)...${RESET}"
    cd "${BACKEND_DIR}"
    source .venv/bin/activate
    export LOCAL_DEV_MODE=true
    export API_KEY="espol-secret-api-key"
    export PYTHONPATH="${BACKEND_DIR}"
    
    uvicorn app.main:app --reload --port "${BACKEND_PORT}" &
    BACKEND_PID=$!
    echo -e "${GREEN}✓ FastAPI Backend started (PID: ${BACKEND_PID}) on http://localhost:${BACKEND_PORT}${RESET}"
}

start_frontend() {
    setup_frontend
    echo -e "${CYAN}🚀 Starting Angular Frontend...${RESET}"
    cd "${FRONTEND_DIR}"
    ${PKG_MGR} start &
    FRONTEND_PID=$!
    echo -e "${GREEN}✓ Angular Frontend started (PID: ${FRONTEND_PID}) on http://localhost:${FRONTEND_PORT}${RESET}"
}

case "$MODE" in
    backend-only)
        start_backend
        ;;
    frontend-only)
        start_frontend
        ;;
    native)
        start_backend
        start_frontend
        ;;
esac

echo ""
echo -e "${MAGENTA}${BOLD}============================================================${RESET}"
echo -e "${GREEN}${BOLD}🎉 Development environment active!${RESET}"
if [[ "$MODE" == "native" || "$MODE" == "frontend-only" ]]; then
    echo -e "${CYAN}  • Frontend Application: ${BOLD}http://localhost:${FRONTEND_PORT}${RESET}"
fi
if [[ "$MODE" == "native" || "$MODE" == "backend-only" || "$MODE" == "docker" ]]; then
    echo -e "${CYAN}  • Backend API Docs:     ${BOLD}http://localhost:${BACKEND_PORT}/docs${RESET}"
    echo -e "${CYAN}  • Backend Health Check: ${BOLD}http://localhost:${BACKEND_PORT}/health${RESET}"
fi
echo -e "${MAGENTA}${BOLD}============================================================${RESET}"
echo -e "${YELLOW}Press Ctrl+C to stop all background services.${RESET}"
echo ""

wait
