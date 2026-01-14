#!/bin/bash

# Script test API evaluation/jobs
# Usage: ./test-evaluation-api.sh <YOUR_ACCESS_TOKEN>

TOKEN=$1

if [ -z "$TOKEN" ]; then
    echo "❌ Cần cung cấp access token"
    echo "Usage: ./test-evaluation-api.sh <YOUR_ACCESS_TOKEN>"
    echo ""
    echo "Lấy token từ:"
    echo "1. Đăng nhập vào app"
    echo "2. Mở Console (F12)"
    echo "3. Gõ: localStorage.getItem('accessToken')"
    exit 1
fi

echo "🔍 Testing API: GET /api/v1/evaluation/jobs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

curl -v -X GET "http://localhost:8000/api/v1/evaluation/jobs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  2>&1 | grep -E "< HTTP|< Content-Type|viewed_jobs|saved_jobs|\{|\}|401|403|404|500"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

