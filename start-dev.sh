#!/bin/bash
# Fully detached dev server launcher
cd /home/z/my-project

# Kill any existing next dev processes
pkill -f "next dev" 2>/dev/null
sleep 1

# Truncate the log
> /home/z/my-project/dev.log

# Launch next dev in a fully detached session
# Redirect all stdio to /dev/null for stdin and dev.log for stdout/stderr
# Use setsid to create a new session so it survives parent shell exit
nohup setsid bun run dev -- -H 0.0.0.0 \
  </dev/null \
  >/home/z/my-project/dev.log 2>&1 &

# Save the PID
DEVPID=$!
echo "Dev server started, PID: $DEVPID"
echo $DEVPID > /home/z/my-project/dev.pid

# Give it a moment to start
sleep 3
exit 0
