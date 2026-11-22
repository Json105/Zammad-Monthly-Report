#!/usr/bin/env bash
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT" || exit 1

if [[ -x "$REPO_ROOT/venv/bin/python" ]]; then
  PYTHON_BIN="$REPO_ROOT/venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="$(command -v python3)"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="$(command -v python)"
else
  echo "Error: Python interpreter not found." >&2
  exit 1
fi

HOOK_MODE=0
WITH_FRONTEND=0

for arg in "$@"; do
  case "$arg" in
    --hook)
      HOOK_MODE=1
      ;;
    --with-frontend)
      WITH_FRONTEND=1
      ;;
    -h|--help)
      echo "Usage: $0 [--hook] [--with-frontend]"
      exit 0
      ;;
    *)
      echo "Error: Unknown option '$arg'" >&2
      exit 2
      ;;
  esac
done

emit_hook_json() {
  local decision="$1"
  local reason="${2:-}"
  HOOK_DECISION="$decision" HOOK_REASON="$reason" "$PYTHON_BIN" - <<'PY'
import json
import os

payload = {"decision": os.environ["HOOK_DECISION"]}
reason = os.environ.get("HOOK_REASON", "")
if reason:
    payload["reason"] = reason
print(json.dumps(payload, ensure_ascii=False))
PY
}

run_checks() {
  local failed=0

  echo "=== [1/3] Python 語法檢查 (py_compile) ==="
  local py_files=()
  while IFS= read -r -d '' file; do
    py_files+=("$file")
  done < <(
    find "$REPO_ROOT" -maxdepth 1 -name '*.py' -type f -print0
    if [[ -d "$REPO_ROOT/zammad_utils" ]]; then
      find "$REPO_ROOT/zammad_utils" -name '*.py' -type f -print0
    fi
    if [[ -d "$REPO_ROOT/tests" ]]; then
      find "$REPO_ROOT/tests" -name '*.py' -type f -print0
    fi
  )

  if [[ ${#py_files[@]} -gt 0 ]]; then
    if ! "$PYTHON_BIN" -m py_compile "${py_files[@]}"; then
      echo "❌ Python 語法檢查失敗"
      failed=1
    else
      echo "✅ Python 語法檢查通過 (${#py_files[@]} 個檔案)"
    fi
  else
    echo "⚠️ 未找到 Python 檔案，略過 py_compile"
  fi

  echo "=== [2/3] 核心模組匯入檢查 ==="
  if ! "$PYTHON_BIN" -c "
import zammad_utils.config
import zammad_utils.api
import zammad_utils.date_utils
import zammad_utils.report_metrics
import generate_report
import reclassify_others
import get_states
import export_zammad_data
print('All core modules imported successfully')
"; then
    echo "❌ 核心模組匯入檢查失敗"
    failed=1
  else
    echo "✅ 核心模組匯入檢查通過"
  fi

  echo "=== [3/3] 核心單元測試 (pytest) ==="
  if ! "$PYTHON_BIN" -m pytest tests/ -q; then
    echo "❌ pytest 測試未通過"
    failed=1
  else
    echo "✅ pytest 測試全數通過"
  fi

  if [[ "$WITH_FRONTEND" -eq 1 ]]; then
    echo "=== [4/4] 前端 Open-Slide 建置檢查 ==="
    if ! (cd "$REPO_ROOT/zammad-report-slide" && npm run build); then
      echo "❌ 前端建置失敗"
      failed=1
    else
      echo "✅ 前端建置通過"
    fi
  fi

  return "$failed"
}

if [[ "$HOOK_MODE" -eq 1 ]]; then
  HOOK_INPUT="$(cat)"

  # Parse terminationReason and continuationActive safely even if stdin is empty or malformed
  PARSED_META="$(HOOK_INPUT="$HOOK_INPUT" "$PYTHON_BIN" - <<'PY'
import json
import os

raw = os.environ.get("HOOK_INPUT", "").strip()
term_reason = ""
cont_active = "false"
if raw:
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            term_reason = str(data.get("terminationReason") or "")
            cont_active = "true" if bool(data.get("continuationActive")) else "false"
    except Exception:
        pass

print(f"{term_reason}\t{cont_active}")
PY
)"
  IFS=$'\t' read -r TERM_REASON CONT_ACTIVE <<< "$PARSED_META"

  # Allow immediate stop if not a normal NO_TOOL_CALL completion
  if [[ -n "$TERM_REASON" && "$TERM_REASON" != "NO_TOOL_CALL" ]]; then
    emit_hook_json "allow"
    exit 0
  fi

  # Loop guard: allow stop if a Stop hook already forced continuation in this turn
  if [[ "$CONT_ACTIVE" == "true" ]]; then
    emit_hook_json "allow"
    exit 0
  fi

  # Skip checks if there are no modified or untracked non-ignored files in git
  if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if [[ -z "$(git status --porcelain)" ]]; then
      emit_hook_json "allow"
      exit 0
    fi
  fi

  TMP_LOG="$(mktemp)"
  trap 'rm -f "$TMP_LOG"' EXIT

  if run_checks >"$TMP_LOG" 2>&1; then
    emit_hook_json "allow"
    exit 0
  else
    TAIL_OUTPUT="$(tail -n 40 "$TMP_LOG")"
    emit_hook_json "continue" "check-done.sh 驗收未通過，請修正以下問題後再結束："$'\n'"$TAIL_OUTPUT"
    exit 0
  fi
fi

run_checks
exit $?
