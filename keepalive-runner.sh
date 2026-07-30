#!/bin/bash
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=1536"
export NEXT_DISABLE_TURBOPACK=1

LOGFILE=/home/z/my-project/dev.log

echo "[$(date)] === Keepalive started (Webpack mode) PID=$$ ===" > $LOGFILE

while true; do
  echo "[$(date)] Starting dev server (Webpack) on 0.0.0.0:3000..." >> $LOGFILE
  node node_modules/.bin/next dev -H 0.0.0.0 -p 3000 >> $LOGFILE 2>&1 &
  SERVER_PID=$!
  echo "[$(date)] Server PID: $SERVER_PID" >> $LOGFILE
  
  # Monitor server in background
  (
    while kill -0 $SERVER_PID 2>/dev/null; do
      sleep 30
      MEM=$(ps -o rss= -p $SERVER_PID 2>/dev/null | awk '{print $1/1024 " MB"}')
      echo "[$(date)] Server alive, MEM: $MEM" >> $LOGFILE
    done
  ) &
  MONITOR_PID=$!
  
  wait $SERVER_PID
  EXIT_CODE=$?
  kill $MONITOR_PID 2>/dev/null
  
  echo "[$(date)] Server exited with code $EXIT_CODE" >> $LOGFILE
  echo "[$(date)] Restarting in 3s..." >> $LOGFILE
  sleep 3
done
