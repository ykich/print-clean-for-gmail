#!/usr/bin/env bash
# Build the Chrome Web Store upload zip for extension.
# Packs only git-tracked files under extension/, excluding dev/store files.
# Run from the repository root: bash tools/package.sh
set -euo pipefail

readonly SRC_DIR="extension"
readonly DIST_DIR="dist"
readonly ZIP_PREFIX="print-clean-for-gmail"

if [[ ! -f "${SRC_DIR}/manifest.json" ]]; then
  echo "error: ${SRC_DIR}/manifest.json not found. Run from the repository root." >&2
  exit 1
fi

# Refuse to package uncommitted changes (staged or unstaged) to tracked files.
dirty="$(git status --porcelain --untracked-files=no -- "${SRC_DIR}")"
if [[ -n "${dirty}" ]]; then
  echo "error: uncommitted changes in ${SRC_DIR}/. Commit or discard them first:" >&2
  echo "${dirty}" >&2
  exit 1
fi

version="$(node -p "require('./${SRC_DIR}/manifest.json').version")"
if [[ ! "${version}" =~ ^[0-9]+(\.[0-9]+){0,3}$ ]]; then
  echo "error: invalid version in manifest: '${version}'" >&2
  exit 1
fi

# Tracked files relative to SRC_DIR, minus excluded paths.
files=()
while IFS= read -r path; do
  case "${path}" in
    test/*) continue ;;
  esac
  files+=("${path}")
done < <(git -C "${SRC_DIR}" ls-files)

if [[ ${#files[@]} -eq 0 ]]; then
  echo "error: no tracked files found in ${SRC_DIR}/" >&2
  exit 1
fi

has_file() {
  local target="$1" f
  for f in "${files[@]}"; do
    [[ "${f}" == "${target}" ]] && return 0
  done
  return 1
}

for required in manifest.json icons/icon-16.png icons/icon-48.png icons/icon-128.png \
  _locales/ja/messages.json _locales/en/messages.json; do
  if ! has_file "${required}"; then
    echo "error: ${SRC_DIR}/${required} is not tracked by git" >&2
    exit 1
  fi
done

mkdir -p "${DIST_DIR}"
out="$(pwd)/${DIST_DIR}/${ZIP_PREFIX}-${version}.zip"
rm -f "${out}"

(
  cd "${SRC_DIR}"
  printf '%s\n' "${files[@]}" | zip -X "${out}" -@
)

echo "created: ${DIST_DIR}/${ZIP_PREFIX}-${version}.zip (${#files[@]} files)"
