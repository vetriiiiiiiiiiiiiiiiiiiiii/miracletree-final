#!/bin/sh

# Start Nginx in background as daemon
nginx

# Start Next.js standalone application on port 3000
PORT=3000 HOSTNAME=0.0.0.0 node server.js
