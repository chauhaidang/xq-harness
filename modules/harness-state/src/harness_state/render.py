from datetime import datetime, timezone


def _body(value: str | None) -> str:
    return value or "_No body provided._"


def render_requirements(rows: list[dict]) -> str:
    lines = ["# Requirements", ""]
    if not rows:
        lines.append("_No requirements recorded._")
        lines.append("")
    for row in rows:
        lines.append(f"## {row['id']} — {row['title']}")
        lines.append("")
        lines.append(f"Status: `{row['status']}`")
        lines.append("")
        lines.append(_body(row.get("body")))
        lines.append("")
    return "\n".join(lines)


def render_decisions(rows: list[dict]) -> str:
    lines = ["# Decisions", ""]
    if not rows:
        lines.append("_No decisions recorded._")
        lines.append("")
    for row in rows:
        lines.append(f"## {row['id']} — {row['title']}")
        lines.append("")
        lines.append(f"Status: `{row['status']}`")
        lines.append("")
        lines.append(_body(row.get("body")))
        lines.append("")
        lines.append(f"**Rationale:** {row.get('rationale') or '_None provided._'}")
        lines.append("")
    return "\n".join(lines)


def render_specs(rows: list[dict]) -> str:
    lines = ["# Specs", ""]
    if not rows:
        lines.append("_No specs recorded._")
        lines.append("")
    for row in rows:
        lines.append(f"## {row['id']} — {row['title']}")
        lines.append("")
        lines.append(f"Status: `{row['status']}`")
        if row.get("requirement_id"):
            lines.append("")
            lines.append(f"Requirement: `{row['requirement_id']}`")
        lines.append("")
        lines.append(_body(row.get("body")))
        lines.append("")
    return "\n".join(lines)


def render_solutions(rows: list[dict]) -> str:
    lines = ["# Solutions", ""]
    if not rows:
        lines.append("_No solutions recorded._")
        lines.append("")
    for row in rows:
        lines.append(f"## {row['id']} — {row['title']}")
        lines.append("")
        lines.append(f"Status: `{row['status']}`")
        if row.get("spec_id"):
            lines.append("")
            lines.append(f"Spec: `{row['spec_id']}`")
        if row.get("decision_id"):
            lines.append("")
            lines.append(f"Decision: `{row['decision_id']}`")
        lines.append("")
        lines.append(_body(row.get("body")))
        lines.append("")
    return "\n".join(lines)


def render_timeline(events: list[dict]) -> str:
    lines = ["# Timeline", ""]
    if not events:
        lines.append("_No events recorded._")
        lines.append("")
        return "\n".join(lines)
    for event in events:
        title = event.get("title") or ""
        lines.append(
            f"- `{event['sequence']:04d}` "
            f"{event['timestamp']} "
            f"**{event['event_type']}** "
            f"`{event['entity_id']}` {title}".rstrip()
        )
    lines.append("")
    return "\n".join(lines)


def render_current(summary: dict) -> str:
    generated = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    lines = [
        "# Current Context",
        "",
        f"_Generated {generated}._",
        "",
        "## Summary",
        "",
        f"- Requirements: {summary.get('requirements', 0)}",
        f"- Decisions: {summary.get('decisions', 0)}",
        f"- Specs: {summary.get('specs', 0)}",
        f"- Solutions: {summary.get('solutions', 0)}",
        f"- Tasks: {summary.get('tasks', 0)}",
        f"- Events: {summary.get('events', 0)}",
        "",
    ]
    return "\n".join(lines)
