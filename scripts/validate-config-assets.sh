#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

json_files=()
while IFS= read -r -d '' path; do
  [[ ! -f "$path" ]] || json_files+=("$path")
done < <(git ls-files -z --cached --others --exclude-standard -- ':(glob)**/*.json')
if ((${#json_files[@]} > 0)); then
  python3 - "${json_files[@]}" <<'PYTHON'
import json
import sys

for path in sys.argv[1:]:
    try:
        with open(path, encoding="utf-8") as config_file:
            json.load(config_file)
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        print(f"{path}: {error}", file=sys.stderr)
        raise SystemExit(1) from error
PYTHON
fi

yaml_files=()
while IFS= read -r -d '' path; do
  [[ ! -f "$path" ]] || yaml_files+=("$path")
done < <(git ls-files -z --cached --others --exclude-standard -- ':(glob)**/*.yaml' ':(glob)**/*.yml')
if ((${#yaml_files[@]} > 0)); then
  ruby -ryaml -e '
    ARGV.each do |path|
      YAML.safe_load_file(path, aliases: true)
    rescue StandardError => error
      warn "#{path}: #{error.message}"
      exit 1
    end
  ' -- "${yaml_files[@]}"
fi

printf 'Validated %d JSON and %d YAML files.\n' \
  "${#json_files[@]}" "${#yaml_files[@]}"
