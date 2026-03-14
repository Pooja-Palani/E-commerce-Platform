#!/bin/bash
# Generate self-signed SSL certificate for development/testing
# For production, use Let's Encrypt: certbot certonly --nginx -d yourdomain.com

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="${SCRIPT_DIR}/certs"
mkdir -p "$CERT_DIR"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "${CERT_DIR}/key.pem" \
  -out "${CERT_DIR}/cert.pem" \
  -subj "/C=US/ST=Dev/L=Local/O=Ecommerce/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1"

echo "Self-signed certificate created at ${CERT_DIR}/"
echo "  cert.pem"
echo "  key.pem"
