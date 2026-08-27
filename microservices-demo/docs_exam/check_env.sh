#!/bin/bash

# =============================================================
# 🔍 KIỂM TRA MÔI TRƯỜNG - Online Boutique Exam Setup Checker
# =============================================================
# Chạy: bash check_env.sh
# Mục đích: Kiểm tra tất cả công cụ cần thiết cho bài thi/demo
# =============================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

PASS=0
FAIL=0
WARN=0

check() {
    local name="$1"
    local cmd="$2"
    local expected_hint="$3"
    local install_hint="$4"

    if eval "$cmd" &>/dev/null; then
        local version=$(eval "$cmd" 2>&1 | head -1)
        echo -e "  ${GREEN}✅ $name${NC} — $version"
        ((PASS++))
    else
        echo -e "  ${RED}❌ $name${NC} — CHƯA CÀI / KHÔNG TÌM THẤY"
        echo -e "     ${YELLOW}→ Cần: $expected_hint${NC}"
        echo -e "     ${YELLOW}→ Cài: $install_hint${NC}"
        ((FAIL++))
    fi
}

check_optional() {
    local name="$1"
    local cmd="$2"
    local note="$3"

    if eval "$cmd" &>/dev/null; then
        local version=$(eval "$cmd" 2>&1 | head -1)
        echo -e "  ${GREEN}✅ $name${NC} — $version ${BLUE}(tùy chọn)${NC}"
        ((PASS++))
    else
        echo -e "  ${YELLOW}⚠️  $name${NC} — chưa có ${BLUE}(tùy chọn)${NC}"
        echo -e "     → $note"
        ((WARN++))
    fi
}

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║    🔍 KIỂM TRA MÔI TRƯỜNG - microservices-demo      ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ──────────────────────────────────────────────
echo -e "${BOLD}📦 [1] NỀN TẢNG CƠ BẢN${NC}"
# ──────────────────────────────────────────────

check "Docker" \
    "docker --version" \
    "Docker Desktop cho macOS" \
    "https://docs.docker.com/desktop/install/mac-install/"

check "Docker daemon đang chạy" \
    "docker ps" \
    "Mở Docker Desktop và chờ icon cá voi ngừng nhấp nháy" \
    "Mở ứng dụng Docker Desktop"

check "kubectl" \
    "kubectl version --client --short 2>/dev/null || kubectl version --client" \
    "kubectl (đi kèm Docker Desktop hoặc cài riêng)" \
    "brew install kubectl"

check "minikube" \
    "minikube version" \
    "minikube để chạy K8s local" \
    "brew install minikube  hoặc  https://minikube.sigs.k8s.io/docs/start/"

echo ""

# ──────────────────────────────────────────────
echo -e "${BOLD}☸️  [2] KUBERNETES CLUSTER${NC}"
# ──────────────────────────────────────────────

if minikube status &>/dev/null 2>&1; then
    MSTATUS=$(minikube status 2>/dev/null | grep "host:" | awk '{print $2}')
    if [ "$MSTATUS" = "Running" ]; then
        echo -e "  ${GREEN}✅ Minikube cluster${NC} — Đang chạy (Running)"
        ((PASS++))

        # Kiểm tra có thể connect kubectl không
        if kubectl cluster-info &>/dev/null 2>&1; then
            echo -e "  ${GREEN}✅ kubectl kết nối cluster${NC} — OK"
            ((PASS++))
        else
            echo -e "  ${RED}❌ kubectl kết nối cluster${NC} — Không kết nối được"
            echo -e "     ${YELLOW}→ Thử: minikube update-context${NC}"
            ((FAIL++))
        fi

        # Đếm pods Online Boutique
        RUNNING=$(kubectl get pods 2>/dev/null | grep "Running" | wc -l | tr -d ' ')
        TOTAL=$(kubectl get pods 2>/dev/null | grep -v "NAME" | wc -l | tr -d ' ')
        if [ "$RUNNING" -ge 10 ] 2>/dev/null; then
            echo -e "  ${GREEN}✅ Online Boutique pods${NC} — $RUNNING/$TOTAL Running"
            ((PASS++))
        elif [ "$TOTAL" -gt 0 ] 2>/dev/null; then
            echo -e "  ${YELLOW}⚠️  Online Boutique pods${NC} — $RUNNING/$TOTAL Running (chưa đủ)"
            echo -e "     ${YELLOW}→ Thử: kubectl get pods   để xem chi tiết${NC}"
            ((WARN++))
        else
            echo -e "  ${RED}❌ Online Boutique pods${NC} — Chưa deploy"
            echo -e "     ${YELLOW}→ Chạy: kubectl apply -f kubernetes-manifests/${NC}"
            ((FAIL++))
        fi
    else
        echo -e "  ${YELLOW}⚠️  Minikube cluster${NC} — Đã cài nhưng CHƯA CHẠY (status: $MSTATUS)"
        echo -e "     ${YELLOW}→ Chạy: minikube start${NC}"
        ((WARN++))
    fi
else
    echo -e "  ${RED}❌ Minikube cluster${NC} — Chưa cài hoặc chưa khởi tạo"
    echo -e "     ${YELLOW}→ Cài: brew install minikube${NC}"
    echo -e "     ${YELLOW}→ Sau đó: minikube start --cpus=2 --memory=4096${NC}"
    ((FAIL++))
fi

echo ""

# ──────────────────────────────────────────────
echo -e "${BOLD}🐍 [3] PYTHON & LOAD TESTING${NC}"
# ──────────────────────────────────────────────

check "Python 3" \
    "python3 --version" \
    "Python 3.8 trở lên" \
    "brew install python3"

check "pip" \
    "pip3 --version" \
    "pip (đi kèm Python)" \
    "python3 -m ensurepip --upgrade"

check_optional "Locust (load test)" \
    "locust --version" \
    "Cài: pip install locust  (trong thư mục src/loadgenerator)"

check_optional "bandit (security scan Python)" \
    "bandit --version" \
    "Cài: pipx install bandit"

check_optional "semgrep (security scan đa ngôn ngữ)" \
    "semgrep --version" \
    "Cài: pipx install semgrep"

echo ""

# ──────────────────────────────────────────────
echo -e "${BOLD}🔧 [4] CÔNG CỤ BỔ SUNG${NC}"
# ──────────────────────────────────────────────

check "git" \
    "git --version" \
    "git (cần để clone kube-prometheus)" \
    "brew install git  hoặc  xcode-select --install"

check_optional "istioctl (Istio CLI)" \
    "istioctl version --remote=false" \
    "Cần nếu demo Istio. Tải: curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.20.0 sh -"

check_optional "helm (Helm package manager)" \
    "helm version --short" \
    "Tùy chọn cho cài Prometheus bằng Helm. Cài: brew install helm"

check_optional "trivy (Docker image security scan)" \
    "trivy --version" \
    "Cài: brew install trivy"

echo ""

# ──────────────────────────────────────────────
echo -e "${BOLD}📂 [5] FILE DỰ ÁN${NC}"
# ──────────────────────────────────────────────

PROJECT_DIR="/Users/apple/microservices-demo"

if [ -d "$PROJECT_DIR/kubernetes-manifests" ]; then
    COUNT=$(ls "$PROJECT_DIR/kubernetes-manifests/"*.yaml 2>/dev/null | wc -l | tr -d ' ')
    echo -e "  ${GREEN}✅ kubernetes-manifests/${NC} — $COUNT file YAML"
    ((PASS++))
else
    echo -e "  ${RED}❌ kubernetes-manifests/${NC} — Không tìm thấy thư mục"
    ((FAIL++))
fi

if [ -d "$PROJECT_DIR/istio-manifests" ]; then
    echo -e "  ${GREEN}✅ istio-manifests/${NC} — Có"
    ((PASS++))
else
    echo -e "  ${RED}❌ istio-manifests/${NC} — Không tìm thấy"
    ((FAIL++))
fi

if [ -f "$PROJECT_DIR/src/loadgenerator/locustfile.py" ]; then
    echo -e "  ${GREEN}✅ locustfile.py${NC} — Có (dùng cho load test)"
    ((PASS++))
else
    echo -e "  ${RED}❌ locustfile.py${NC} — Không tìm thấy tại src/loadgenerator/"
    ((FAIL++))
fi

echo ""

# ──────────────────────────────────────────────
# KẾT QUẢ TỔNG HỢP
# ──────────────────────────────────────────────
TOTAL_CHECKS=$((PASS + FAIL + WARN))
echo -e "${BOLD}════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}📊 KẾT QUẢ: ${GREEN}$PASS ✅ OK${NC}  |  ${RED}$FAIL ❌ Thiếu${NC}  |  ${YELLOW}$WARN ⚠️  Tùy chọn${NC}  (/$TOTAL_CHECKS)"
echo -e "${BOLD}════════════════════════════════════════════════════════${NC}"

if [ $FAIL -eq 0 ] && [ $WARN -eq 0 ]; then
    echo -e ""
    echo -e "  ${GREEN}${BOLD}🎉 Môi trường đã sẵn sàng hoàn toàn!${NC}"
elif [ $FAIL -eq 0 ]; then
    echo -e ""
    echo -e "  ${YELLOW}${BOLD}⚠️  Môi trường đã sẵn sàng cho cơ bản, nhưng có $WARN công cụ tùy chọn chưa cài!${NC}"
else
    echo -e ""
    echo -e "  ${RED}${BOLD}🚨 Có $FAIL công cụ bắt buộc chưa cài — cần fix trước khi demo!${NC}"
fi

echo ""
echo -e "  ${BLUE}📖 Xem hướng dẫn cài đặt: docs_exam/README.md${NC}"
echo ""
