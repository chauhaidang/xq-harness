#!/usr/bin/env bash
set -euo pipefail

readonly output_dir="${1:?usage: xq-fitness-production-preflight.sh OUTPUT_DIR}"
readonly policy_version="1"

: "${XQ_FITNESS_DATABASE_URL:?XQ_FITNESS_DATABASE_URL is required}"
: "${XQ_RECORDS_DATABASE_URL:?XQ_RECORDS_DATABASE_URL is required}"
: "${XQ_FITNESS_NEON_PROJECT_ID:?XQ_FITNESS_NEON_PROJECT_ID is required}"
: "${XQ_RECORDS_NEON_PROJECT_ID:?XQ_RECORDS_NEON_PROJECT_ID is required}"
: "${XQ_FITNESS_NEON_API_KEY:?XQ_FITNESS_NEON_API_KEY is required}"
: "${XQ_RECORDS_NEON_API_KEY:?XQ_RECORDS_NEON_API_KEY is required}"
: "${DIGITALOCEAN_ACCESS_TOKEN:?DIGITALOCEAN_ACCESS_TOKEN is required}"
: "${DO_APP_ID:?DO_APP_ID is required}"
: "${DO_SERVICE_NAME:?DO_SERVICE_NAME is required}"

umask 077
mkdir -p "$output_dir"
readonly private_dir="$(mktemp -d)"
trap 'rm -rf "$private_dir"' EXIT

export PGAPPNAME="xq-harness-production-preflight"
export PGCONNECT_TIMEOUT=15
export PGOPTIONS="-c default_transaction_read_only=on -c statement_timeout=30000 -c lock_timeout=5000 -c idle_in_transaction_session_timeout=30000"

capture_query() {
  local database_url="$1"
  local destination="$2"
  local sql="$3"
  psql "$database_url" --no-psqlrc -X -v ON_ERROR_STOP=1 \
    --csv --quiet --command "$sql" > "$destination"
}

capture_common_database_evidence() {
  local label="$1"
  local database_url="$2"

  capture_query "$database_url" "$output_dir/$label-server.csv" \
    "SELECT current_database() AS database_name, current_user AS role_name, current_setting('server_version') AS postgres_version, current_setting('transaction_read_only') AS transaction_read_only;"

  capture_query "$database_url" "$output_dir/$label-columns.csv" \
    "SELECT table_schema, table_name, ordinal_position, column_name, data_type, udt_name, is_nullable FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog', 'information_schema') ORDER BY table_schema, table_name, ordinal_position;"

  capture_query "$database_url" "$output_dir/$label-constraints.csv" \
    "SELECT n.nspname AS schema_name, c.relname AS table_name, con.conname AS constraint_name, con.contype AS constraint_type, pg_get_constraintdef(con.oid, true) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') ORDER BY n.nspname, c.relname, con.conname;"

  capture_query "$database_url" "$output_dir/$label-indexes.csv" \
    "SELECT schemaname AS schema_name, tablename AS table_name, indexname AS index_name, indexdef AS definition FROM pg_indexes WHERE schemaname NOT IN ('pg_catalog', 'information_schema') ORDER BY schemaname, tablename, indexname;"

  capture_query "$database_url" "$output_dir/$label-roles.csv" \
    "SELECT rolname AS role_name, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin, rolreplication, rolbypassrls FROM pg_roles ORDER BY rolname;"

  capture_query "$database_url" "$output_dir/$label-grants.csv" \
    "SELECT grantee, table_schema, table_name, privilege_type, is_grantable FROM information_schema.table_privileges WHERE table_schema NOT IN ('pg_catalog', 'information_schema') ORDER BY grantee, table_schema, table_name, privilege_type;"

  local migration_table
  migration_table="$(psql "$database_url" --no-psqlrc -X -v ON_ERROR_STOP=1 --tuples-only --no-align --quiet --command "SELECT COALESCE(to_regclass('public._prisma_migrations')::text, '');")"
  if [[ -n "$migration_table" ]]; then
    capture_query "$database_url" "$output_dir/$label-prisma-migrations.csv" \
      "SELECT migration_name, checksum, started_at, finished_at, rolled_back_at, applied_steps_count FROM public._prisma_migrations ORDER BY started_at, migration_name;"
  else
    printf 'status\nabsent\n' > "$output_dir/$label-prisma-migrations.csv"
  fi

  {
    printf 'table_schema,table_name,row_count\n'
    psql "$database_url" --no-psqlrc -X -v ON_ERROR_STOP=1 \
      --tuples-only --no-align --field-separator=',' --quiet <<'SQL'
SELECT format(
  'SELECT %L, %L, count(*)::bigint FROM %I.%I;',
  n.nspname,
  c.relname,
  n.nspname,
  c.relname
)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'p')
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, c.relname
\gexec
SQL
  } > "$output_dir/$label-row-counts.csv"
}

capture_query "$XQ_FITNESS_DATABASE_URL" "$output_dir/xq-fitness-invariants.csv" \
  "SELECT 'workout_days_without_routine' AS invariant, count(*)::bigint AS violations FROM workout_days d LEFT JOIN workout_routines r ON r.id = d.routine_id WHERE r.id IS NULL
   UNION ALL SELECT 'workout_day_sets_without_day', count(*)::bigint FROM workout_day_sets s LEFT JOIN workout_days d ON d.id = s.workout_day_id WHERE d.id IS NULL
   UNION ALL SELECT 'workout_day_sets_without_muscle_group', count(*)::bigint FROM workout_day_sets s LEFT JOIN muscle_groups m ON m.id = s.muscle_group_id WHERE m.id IS NULL
   UNION ALL SELECT 'exercises_without_day', count(*)::bigint FROM exercises e LEFT JOIN workout_days d ON d.id = e.workout_day_id WHERE d.id IS NULL
   UNION ALL SELECT 'exercises_without_muscle_group', count(*)::bigint FROM exercises e LEFT JOIN muscle_groups m ON m.id = e.muscle_group_id WHERE m.id IS NULL
   UNION ALL SELECT 'snapshots_without_routine', count(*)::bigint FROM weekly_snapshots s LEFT JOIN workout_routines r ON r.id = s.routine_id WHERE r.id IS NULL
   UNION ALL SELECT 'snapshot_days_without_snapshot', count(*)::bigint FROM snapshot_workout_days d LEFT JOIN weekly_snapshots s ON s.id = d.snapshot_id WHERE s.id IS NULL
   UNION ALL SELECT 'snapshot_sets_without_day', count(*)::bigint FROM snapshot_workout_day_sets s LEFT JOIN snapshot_workout_days d ON d.id = s.snapshot_workout_day_id WHERE d.id IS NULL
   UNION ALL SELECT 'snapshot_exercises_without_day', count(*)::bigint FROM snapshot_exercises e LEFT JOIN snapshot_workout_days d ON d.id = e.snapshot_workout_day_id WHERE d.id IS NULL
   UNION ALL SELECT 'weekly_report_join_rows', count(*)::bigint FROM weekly_snapshots s LEFT JOIN snapshot_workout_days d ON d.snapshot_id = s.id LEFT JOIN snapshot_exercises e ON e.snapshot_workout_day_id = d.id;"

capture_query "$XQ_RECORDS_DATABASE_URL" "$output_dir/xq-records-invariants.csv" \
  "SELECT 'objects_without_type' AS invariant, count(*)::bigint AS violations FROM objects o LEFT JOIN object_types t ON t.id = o.object_type_id WHERE t.id IS NULL
   UNION ALL SELECT 'versions_without_object', count(*)::bigint FROM object_versions v LEFT JOIN objects o ON o.id = v.object_id WHERE o.id IS NULL
   UNION ALL SELECT 'invalid_status', count(*)::bigint FROM objects WHERE status NOT IN ('active', 'archived', 'deleted')
   UNION ALL SELECT 'invalid_version_number', count(*)::bigint FROM object_versions WHERE version <= 0
   UNION ALL SELECT 'duplicate_version_sequence', count(*)::bigint FROM (SELECT object_id, version FROM object_versions GROUP BY object_id, version HAVING count(*) > 1) duplicates
   UNION ALL SELECT 'invalid_history_range', count(*)::bigint FROM object_versions WHERE valid_to IS NOT NULL AND valid_to <= valid_from
   UNION ALL SELECT 'current_pointer_missing', count(*)::bigint FROM objects o LEFT JOIN object_versions v ON v.id = o.current_version_id WHERE o.current_version_id IS NOT NULL AND v.id IS NULL
   UNION ALL SELECT 'current_pointer_wrong_object', count(*)::bigint FROM objects o JOIN object_versions v ON v.id = o.current_version_id WHERE v.object_id <> o.id;"

capture_common_database_evidence "xq-fitness" "$XQ_FITNESS_DATABASE_URL"
capture_common_database_evidence "xq-records" "$XQ_RECORDS_DATABASE_URL"

capture_neon_project() {
  local label="$1"
  local project_id="$2"
  local api_key="$3"
  local curl_config="$private_dir/$label-neon-curl.conf"

  printf 'silent\nshow-error\nfail-with-body\nheader = "Accept: application/json"\nheader = "Authorization: Bearer %s"\n' \
    "$api_key" > "$curl_config"
  chmod 600 "$curl_config"

  curl --config "$curl_config" \
    "https://console.neon.tech/api/v2/projects/$project_id" \
    | jq '{project: {id: .project.id, name: .project.name, region_id: .project.region_id, pg_version: .project.pg_version, history_retention_seconds: .project.history_retention_seconds, created_at: .project.created_at, updated_at: .project.updated_at}}' \
    > "$output_dir/$label-neon-project.json"

  curl --config "$curl_config" \
    "https://console.neon.tech/api/v2/projects/$project_id/branches" \
    | jq '{branches: [.branches[] | {id, name, default, primary, current_state, created_at, updated_at}]}' \
    > "$output_dir/$label-neon-branches.json"
}

capture_neon_project "xq-fitness" "$XQ_FITNESS_NEON_PROJECT_ID" "$XQ_FITNESS_NEON_API_KEY"
capture_neon_project "xq-records" "$XQ_RECORDS_NEON_PROJECT_ID" "$XQ_RECORDS_NEON_API_KEY"

doctl apps get "$DO_APP_ID" --output json \
  | jq '[.[] | {app_id: .id, app_name: .spec.name, region: (.region.slug // .region), active_deployment_id: .active_deployment.id}]' \
  > "$output_dir/digitalocean-app.json"

active_deployment_id="$(jq -r '.[0].active_deployment_id' "$output_dir/digitalocean-app.json")"

sanitize_do_spec() {
  local deployment_id="${1:-}"
  jq --arg component "$DO_SERVICE_NAME" --arg deployment_id "$deployment_id" '
    def selected_component:
      (((.services // []) + (.workers // []) + (.jobs // []) + (.static_sites // []) + (.functions // []))
      | map(select(.name == $component))
      | first
      | if . == null then null else {
          name,
          image: (if .image then {
            registry_type: .image.registry_type,
            registry: .image.registry,
            repository: .image.repository,
            tag: .image.tag,
            digest: .image.digest
          } else null end),
          routes: (.routes // []),
          env_names: [(.envs // [])[] | select(.type == "SECRET") | {key, scope, type}]
        } end);
    if $deployment_id == "" then
      {name, region, ingress: (.ingress // {}), component: selected_component}
    else
      {deployment_id: $deployment_id, name, region, ingress: (.ingress // {}), component: selected_component}
    end
  '
}

doctl apps spec get "$DO_APP_ID" --deployment "$active_deployment_id" --format json \
  | sanitize_do_spec \
  > "$output_dir/digitalocean-active-spec.json"

doctl apps list-deployments "$DO_APP_ID" --output json \
  | jq '[.[] | {id, phase, cause, created_at, updated_at}] | sort_by(.created_at) | reverse | .[:10]' \
  > "$output_dir/digitalocean-deployments.json"

previous_deployment_id="$(jq -r '[.[] | select(.phase == "SUPERSEDED")][0].id // empty' "$output_dir/digitalocean-deployments.json")"
if [[ -n "$previous_deployment_id" ]]; then
  doctl apps spec get "$DO_APP_ID" --deployment "$previous_deployment_id" --format json \
    | sanitize_do_spec "$previous_deployment_id" \
    > "$private_dir/digitalocean-previous-spec.candidate.json"
  previous_digest="$(jq -r '.component.image.digest // empty' "$private_dir/digitalocean-previous-spec.candidate.json")"
  if [[ -n "$previous_digest" ]]; then
    cp "$private_dir/digitalocean-previous-spec.candidate.json" "$output_dir/digitalocean-previous-spec.json"
  else
    printf '{"deployment_id":"%s","status":"rejected_mutable_identity","reason":"previous superseded deployment has no immutable image digest"}\n' \
      "$previous_deployment_id" > "$output_dir/digitalocean-previous-spec.json"
  fi
fi

printf 'policy_version=%s\ncaptured_at=%s\nrepository=%s\ncommit=%s\nrun_id=%s\nrun_attempt=%s\ndo_app_id=%s\ndo_service_name=%s\nfitness_neon_project_id=%s\nrecords_neon_project_id=%s\n' \
  "$policy_version" \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "${GITHUB_REPOSITORY:-local}" \
  "${GITHUB_SHA:-local}" \
  "${GITHUB_RUN_ID:-local}" \
  "${GITHUB_RUN_ATTEMPT:-local}" \
  "$DO_APP_ID" \
  "$DO_SERVICE_NAME" \
  "$XQ_FITNESS_NEON_PROJECT_ID" \
  "$XQ_RECORDS_NEON_PROJECT_ID" \
  > "$output_dir/run-metadata.txt"

(
  cd "$output_dir"
  find . -type f ! -name SHA256SUMS -print0 \
    | LC_ALL=C sort -z \
    | xargs -0 sha256sum \
    > SHA256SUMS
)
