#!/usr/bin/env sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
command -v dsh >/dev/null 2>&1 || { echo 'DSH is not installed or is not in PATH.' >&2; exit 1; }
echo 'Installing Better Attach 0.3.0-rc.5 into web profile. Native DSH acceptance remains required.'
dsh plugin --profile web add "$ROOT"
echo 'Restart DSH. The installer does not alter core bundles or delete attachments.'
