#!/bin/bash
set -e

REPO_DIR="/workspace/repo"
GOAL_FILE="$REPO_DIR/GOAL.md"

if [ ! -f "$GOAL_FILE" ]; then
    echo "ERROR: GOAL.md not found at $GOAL_FILE"
    exit 1
fi

cd "$REPO_DIR"

echo "[$(date)] Starting AI Trash Generator loop..."

while true; do
    echo "[$(date)] Running opencode -p..."
    opencode run "根据 GOAL.md 和 NEXT.md（如存在）的内容执行任务，完成后更新 NEXT.md 记录进度，提交代码并推送"

    if [ $? -eq 0 ]; then
        echo "[$(date)] Task completed successfully"
    else
        echo "[$(date)] Task failed, retrying in 60 seconds..."
        sleep 60
    fi

    sleep 5
done