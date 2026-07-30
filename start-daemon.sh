#!/bin/bash
# Double-fork daemon pattern
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=1536"

# First fork
(
  # Second fork
  (
    exec node node_modules/.bin/next dev -H 0.0.0.0 -p 3000 >> /home/z/my-project/dev.log 2>&1
  ) &
  exit 0
) &
exit 0
