#!/usr/bin/env bash
set -euo pipefail

# validate-and-send.sh
# Validates payload.json against a small jq-based schema and sends a repository_dispatch
# Usage: ./scripts/validate-and-send.sh payload.json

PAYLOAD_FILE="${1:-payload.json}"
REPO="defynepay-dye/Gas-dUP"
TOKEN_VAR_NAME="GITHUB_TRIGGER_TOKEN"

# Prefer token from environment variable GITHUB_TRIGGER_TOKEN, fall back to prompt
if [ -z "${!TOKEN_VAR_NAME-}" ]; then
  if [ -t 0 ]; then
    echo "Enter GitHub trigger token (will not be stored):"
    read -s GITHUB_TRIGGER_TOKEN
  else
    echo "Environment variable GITHUB_TRIGGER_TOKEN is required"
    exit 1
  fi
fi

TOKEN="${GITHUB_TRIGGER_TOKEN}"

if [ ! -f "$PAYLOAD_FILE" ]; then
  echo "Payload file not found: $PAYLOAD_FILE"
  exit 1
fi

# Basic shape checks using jq
# - event_type must be 'supabase-deploy'
# - client_payload must exist and be an object
# - client_payload.functions (if present) must be an array of safe function names
# - client_payload.deploy_only (if present) must be boolean
# - client_payload.commit_msg (if present) must be a string <= 200 chars

if ! jq -e '(.event_type == "supabase-deploy") and (has("client_payload") and (.client_payload | type == "object"))' "$PAYLOAD_FILE" >/dev/null; then
  echo "Invalid payload: event_type must be 'supabase-deploy' and client_payload must be an object"
  exit 1
fi

# Validate functions array if present
if jq -e '.client_payload.functions? != null' "$PAYLOAD_FILE" >/dev/null 2>&1; then
  if ! jq -e '.client_payload.functions | type == "array"' "$PAYLOAD_FILE" >/dev/null; then
    echo "Invalid payload: client_payload.functions must be an array"
    exit 1
  fi
  # ensure each function name matches pattern
  if ! jq -e '.client_payload.functions[] | test("^[a-zA-Z0-9_\-]+$")' "$PAYLOAD_FILE" >/dev/null 2>&1; then
    echo "Invalid payload: each function name must match ^[a-zA-Z0-9_\-]+$"
    exit 1
  fi
  # limit number of functions for safety
  if ! jq -e '( .client_payload.functions | length ) <= 50' "$PAYLOAD_FILE" >/dev/null; then
    echo "Invalid payload: functions array too large (max 50)"
    exit 1
  fi
fi

# deploy_only boolean
if jq -e '.client_payload.deploy_only? != null' "$PAYLOAD_FILE" >/dev/null 2>&1; then
  if ! jq -e '.client_payload.deploy_only | type == "boolean"' "$PAYLOAD_FILE" >/dev/null; then
    echo "Invalid payload: client_payload.deploy_only must be a boolean"
    exit 1
  fi
fi

# commit_msg length
if jq -e '.client_payload.commit_msg? != null' "$PAYLOAD_FILE" >/dev/null 2>&1; then
  if ! jq -e '.client_payload.commit_msg | type == "string" and (length <= 200)' "$PAYLOAD_FILE" >/dev/null; then
    echo "Invalid payload: commit_msg must be a string of max 200 chars"
    exit 1
  fi
fi

# Block additional top-level properties beyond event_type and client_payload
if jq -e 'length > 2 or (has("other") )' "$PAYLOAD_FILE" >/dev/null 2>&1; then
  # we won't be strict about top-level extra keys in this script, but you can add stricter checks if desired
  :
fi

# Send the dispatch
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/${REPO}/dispatches" \
  -d @"${PAYLOAD_FILE}")

if [ "$HTTP_STATUS" -eq 204 ] || [ "$HTTP_STATUS" -eq 201 ]; then
  echo "Dispatch sent successfully (HTTP $HTTP_STATUS)"
  exit 0
else
  echo "Failed to send dispatch (HTTP $HTTP_STATUS)"
  # output response body for debugging
  curl -s -X POST \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    "https://api.github.com/repos/${REPO}/dispatches" \
    -d @"${PAYLOAD_FILE}"
  exit 2
fi
