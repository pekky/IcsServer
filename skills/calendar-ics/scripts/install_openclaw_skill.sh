#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SKILL_NAME="$(basename "${SKILL_DIR}")"
OPENCLAW_SKILLS_DIR="${OPENCLAW_SKILLS_DIR:-${HOME}/.openclaw/skills}"
MODE="${1:-both}"
TMP_DIR=""

cleanup() {
  if [[ -n "${TMP_DIR}" && -d "${TMP_DIR}" ]]; then
    rm -rf "${TMP_DIR}"
  fi
}

trap cleanup EXIT

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

install_directory() {
  require_cmd rsync
  mkdir -p "${OPENCLAW_SKILLS_DIR}"
  rsync -a --delete "${SKILL_DIR}/" "${OPENCLAW_SKILLS_DIR}/${SKILL_NAME}/"
  echo "Installed directory: ${OPENCLAW_SKILLS_DIR}/${SKILL_NAME}"
}

install_package() {
  require_cmd rsync
  require_cmd zip
  mkdir -p "${OPENCLAW_SKILLS_DIR}"
  TMP_DIR="$(mktemp -d)"
  mkdir -p "${TMP_DIR}/${SKILL_NAME}"
  rsync -a --delete "${SKILL_DIR}/" "${TMP_DIR}/${SKILL_NAME}/"
  (
    cd "${TMP_DIR}"
    rm -f "${OPENCLAW_SKILLS_DIR}/${SKILL_NAME}.skill"
    zip -qr "${OPENCLAW_SKILLS_DIR}/${SKILL_NAME}.skill" "${SKILL_NAME}"
  )
  echo "Installed package: ${OPENCLAW_SKILLS_DIR}/${SKILL_NAME}.skill"
}

show_summary() {
  echo "Skill name: ${SKILL_NAME}"
  echo "Target dir: ${OPENCLAW_SKILLS_DIR}"
  if [[ -d "${OPENCLAW_SKILLS_DIR}/${SKILL_NAME}" ]]; then
    echo "Directory contents:"
    find "${OPENCLAW_SKILLS_DIR}/${SKILL_NAME}" -maxdepth 3 -type f | sort
  fi
  if [[ -f "${OPENCLAW_SKILLS_DIR}/${SKILL_NAME}.skill" ]]; then
    echo "Package contents:"
    unzip -l "${OPENCLAW_SKILLS_DIR}/${SKILL_NAME}.skill"
  fi
}

case "${MODE}" in
  both)
    install_directory
    install_package
    ;;
  dir-only)
    install_directory
    ;;
  package-only)
    install_package
    ;;
  *)
    echo "Usage: $0 [both|dir-only|package-only]" >&2
    exit 1
    ;;
esac

show_summary
