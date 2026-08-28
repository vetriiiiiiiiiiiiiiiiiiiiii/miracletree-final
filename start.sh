#!/bin/sh

# Start Nginx in the background
nginx -g "daemon off;" &

# Start the Next.js application
# The standalone build outputs a server.js file
node server.js
