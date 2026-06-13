#!/usr/bin/env bash
# apply_from_migration_bundle.sh — legacy wrapper; use apply_from_optiplex_shares.sh instead.
exec "$(dirname "$0")/apply_from_optiplex_shares.sh" "$@"
