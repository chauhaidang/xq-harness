import uuid

PREFIXES = {
    "requirement": "REQ",
    "decision": "DEC",
    "spec": "SPEC",
    "solution": "SOL",
    "task": "TASK",
    "artifact": "ART",
    "event": "EVT",
    "workspace": "WS",
}


def new_id(entity_type: str) -> str:
    prefix = PREFIXES.get(entity_type, entity_type.upper())
    short = uuid.uuid4().hex[:8].upper()
    return f"{prefix}-{short}"
