# Kraken CLI exploratory QA report

Date: 2026-07-19 (Asia/Ho_Chi_Minh)

Result: **Gates A-E representative journeys passed; Gate F partially tested; no product defects found.**

## Environment and seam

- Commit: `3b92c9538f6792fca919bd6ca2f609ac1c88fcc0`
- OS/architecture: Darwin 24.6.0, x86_64
- Python: 3.14.4
- Installed wheel executable: `/var/folders/g8/ybg26s2s0bb28r97s5mqp2g80000gn/T/kraken-cli-wheel-qve_iksc/venv/bin/kraken`
- Final isolated fixture root: `/var/folders/g8/ybg26s2s0bb28r97s5mqp2g80000gn/T/kraken-qa-public-cr8ymb02`
- Config: `/var/folders/g8/ybg26s2s0bb28r97s5mqp2g80000gn/T/kraken-qa-public-cr8ymb02/workspace with space-δ/kraken.yaml`
- Effective state root: `/var/folders/g8/ybg26s2s0bb28r97s5mqp2g80000gn/T/kraken-qa-public-cr8ymb02/xdg state-δ`
- Session: `qa δ`; commands ran from the separate `other-cwd` directory.
- Fixture: deterministic `127.0.0.1:0` HTTP server using the acceptance-harness widget contract and append-only public request ledger. Inherited Kraken variables and proxy variables were removed. SQLite/private implementation data was not inspected.

The baseline installed-process suite was executed exactly as:

```sh
UV_CACHE_DIR=/tmp/xq-kraken-uv-cache modules/xq-kraken/.venv/bin/behave modules/xq-kraken/features/kraken_cli.feature --no-capture
```

Result: exit `0`; stdout reported `1 feature passed`, `6 scenarios passed`, `24 steps passed`; stderr empty. A prior sandboxed attempt could not bind loopback (`PermissionError: [Errno 1] Operation not permitted`), so the same command was rerun with loopback permission. That was an execution-environment restriction, not a Kraken failure.

The final adversarial charter was executed exactly as:

```sh
modules/xq-kraken/.venv/bin/python /tmp/kraken_qa_blackbox.py
```

The script only launched the wheel-installed executable as separate public subprocesses and observed argv/stdin, stdout, stderr, exit code, request ledger, later-process public state commands, and documented filesystem modes.

## Gate evidence

All commands below share this exact prefix:

```text
/var/folders/g8/ybg26s2s0bb28r97s5mqp2g80000gn/T/kraken-cli-wheel-qve_iksc/venv/bin/kraken --config "/var/folders/g8/ybg26s2s0bb28r97s5mqp2g80000gn/T/kraken-qa-public-cr8ymb02/workspace with space-δ/kraken.yaml" --session "qa δ"
```

### Gate A - discovery

- `search widget` from `other-cwd`: exit `0`; stdout canonical JSON, stderr empty, ledger `[]`. Returned only the allowed `widgets` operations in deterministic order: `createWidget -> @o1`, `getWidget -> @o2`; the second API's explicit empty allowlist exposed nothing.
- `describe @o2`: exit `0`; stdout echoed `"ref":"@o2","api":"widgets","operation_id":"getWidget"`; stderr empty; ledger `[]`. This proved relative YAML resolution, spaces/non-ASCII paths and sessions, and cross-process identity.
- Installed help smoke: `modules/xq-kraken/.venv/bin/kraken --help` exited `0` and exposed `search`, `describe`, `invoke`, `refs`, and `resolve`.

### Gate B - invocation, streams, exits, assertions

- `--api widgets invoke getWidget --input - --no-state` with stdin `{"parameters":{"widgetId":"stdin-widget"}}`: exit `0`; stdout success with `state:{"persisted":false,"reason":"no_state"}`; stderr empty; ledger exactly `GET /widgets/stdin-widget`.
- Invalid body invocation (`quantity: 0`): exit `4`; stdout empty; stderr `{"ok":false,"error":{"kind":"request_contract_violation",...}}`; ledger `[]`.
- Documented 404 without a status assertion: exit `7`; assertion result on stdout only, with actual `404`, expected `2xx`; stderr empty; ledger exactly one `GET /widgets/missing`.
- Same documented 404 with status/body assertions: exit `0`; compact stdout counts `total:2, passed:2, failed:0`; stderr empty. The unrelated body sentinel was absent.
- RFC 6901 escapes `/meta/a~1b` and `/meta/til~0de`, array subset `[2,1]`, and numeric `2.0 == 2`: exit `0`; stdout counts `5/5`; stderr empty.
- Boolean-versus-number plus indexed-array failures: exit `7`; stdout contained only unmatched `/meta/flag` (`true` versus `1`) and `/items/0` (`1` versus `2`); stderr empty.

### Gate C - operation identity and recovery

- `invoke @o2 ... --no-state`: exit `0`; stdout echoed `@o2`, `widgets`, `getWidget`; ledger exactly `GET /widgets/via-ref`.
- Contradictory `--api widgets invoke @o2 ...`: exit `2`; stdout empty; stderr kind `invalid_input`; ledger `[]`.
- `invoke @o999 ...`: exit `8`; stdout empty; stderr kind `unknown_reference`; ledger `[]`.
- `invoke @oabc ...`: exit `2`; stdout empty; stderr kind `invalid_input`; ledger `[]`.
- `describe @r1`: exit `8`; stdout empty; stderr kind `reference_kind_mismatch`; ledger `[]`.
- `refs clear`: exit `0`, stdout reported two operation and two response refs cleared. `resolve @r1` then exited `8` with `reference_target_removed`. A later `search getWidget` allocated `@o3`, proving the cleared `@o2` was not recycled.

### Gate D - response-reference privacy

- Assertion-free create returned immutable `@r1` and immediate invocation output included the fixture response header sentinel as expected. Later `resolve @r1`: exit `0`; stdout contained response data/identity/status only and contained neither request sentinel `REQUEST-SENTINEL-27ac` nor response-header sentinel `HEADER-SENTINEL-9d72`; stderr empty; ledger `[]`.
- Resolving `@r1` under exact flag session `other-session`: exit `8`, stderr kind `unknown_reference`, no stdout or transport.
- `refs list` before and after one assertion-bearing invocation and one `--no-state` invocation was unchanged at two operation plus two response refs. Both invocations exited `0`; the no-state result omitted `response_ref` and reported reason `no_state`.
- Public filesystem evidence: `$XDG_STATE_HOME/kraken/references` mode `0700`; both session database files mode `0600`. The project/config tree remained exactly `alpha.json`, `kraken.yaml`, and `widgets.yaml`; runtime state was not written beside configuration.

### Gate E - chaining, literal strings, pointer failures

- Explicit `{"$kraken_ref":"@r1","pointer":"/id"}` substitution: exit `0`; ledger exactly `GET /widgets/widget-123`, proving the selected string value reached transport.
- Literal parameter string `"@r999"`: exit `0`; ledger exactly `GET /widgets/@r999`, proving no implicit substitution.
- Missing response pointer `/missing`: exit `8`; stdout empty; stderr kind `invalid_reference_pointer` with reference/pointer details; ledger `[]`.

### Gate F - public lifecycle subset

- `refs status`: exit `0`; stdout reported `operations:2`, `responses:2`, `tombstones:0`, `response_bytes:293`, and `max_response_bytes:52428800`; stderr empty.
- `refs gc`: exit `0`; stdout `expired_responses:0,response_bytes:293`; stderr empty.
- The full small-payload search -> `@o` invoke -> `@r` chain -> assertions -> inspect -> GC -> clear journey passed.

## Defects and impact

No Critical, High, Medium, or Low product defect was observed, so there is no draft/GitHub issue and no 3/3 defect reproduction to report. Zero-transport safety held for every exercised pre-transport failure. The nearest regression boundaries are the exact command/exit/stream/ledger cases above.

## Explicitly untested / not release claims

- Exact 50 MiB (`52,428,800` bytes) just-below/at/above payload behavior, oversized-success non-persistence, and concurrent large responses were **not tested** through QA. Service tests prove the configured default and the same budget algorithm with a small deterministic limit; the exact installed-process boundary remains a coverage gap because the OpenAPI transport does not provide a stable black-box payload here.
- 24-hour expiry timing, deterministic injected-clock boundaries, busy/corrupt store and migrations were not tested; these belong to SDET service evidence.
- Concurrent allocation/fan-out, config/spec/base-URL context overrides, removed/disallowed target revalidation, transport connection failure, undocumented status, invalid response schema, malformed config/spec permutations, pretty-output usability, and duplicate-array assertion consumption were not explored in this representative pass.
- Raw persisted rows/bytes were deliberately not inspected. Privacy evidence is limited to public `resolve`, `refs list/status`, state permissions/location, and lack of state beside configuration.
- Windows ACL/state behavior, network-mounted filesystems, external APIs, authentication, and extreme concurrency remain outside the stated release claim.
