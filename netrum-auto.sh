#!/bin/bash

# Load .env
set -a
source .env
set +a

send_telegram() {
  local message="$1"
  curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
    -d chat_id="$CHAT_ID" \
    -d text="$message" \
    -d parse_mode="Markdown"
}

while true; do
  # Send enhanced start report with NPT balance and Base name
  node send-report.js start

  netrum-mining &
  mining_pid=$!

  sleep 24h

  # Send claim report with current balance
  node send-report.js claim
  echo "y" | netrum-claim
  kill $mining_pid

  # Send completion report with updated balance
  node send-report.js complete
done
