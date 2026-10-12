#!/usr/bin/env python3
"""Redact secret values in scanner SARIF and write a Markdown job summary.

Secret findings are reported as file:line and rule id only. Matched values are
removed from the SARIF uploaded to code scanning and from the job summary.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter
from pathlib import Path

SEVERITIES = ("critical", "high", "medium", "low", "unknown")
RANK = {name: index for index, name in enumerate(SEVERITIES)}
EXPLICIT = {
    "CRITICAL": "critical",
    "HIGH": "high",
    "ERROR": "high",
    "MEDIUM": "medium",
    "WARNING": "medium",
    "LOW": "low",
    "INFO": "low",
    "NOTE": "low",
    "UNKNOWN": "unknown",
}
LEVEL = {
    "error": "high",
    "warning": "medium",
    "note": "low",
    "none": "unknown",
}
SECRET_ID = re.compile(
    r"(secret|password|passwd|credential|api[-_]?key|private[-_]?key|"
    r"access[-_]?key|github[-_]?(pat|fine[-_]?grained)|"
    r"aws[-_]?(access|secret)|slack[-_]|stripe[-_]|"
    r"privatekey|hardcoded[-_](password|secret|token|credential)|"
    r"detected-generic-api-key|detected-private-key)",
    re.I,
)
SEVERITY_IN_TEXT = re.compile(
    r"\bSeverity:\s*(CRITICAL|HIGH|MEDIUM|LOW|UNKNOWN|INFO)\b",
    re.I,
)
LONG_TOKEN = re.compile(
    r"\b(?=[A-Za-z0-9+/_=-]{40,}\b)(?=[A-Za-z0-9+/_=-]*[A-Za-z])"
    r"(?=[A-Za-z0-9+/_=-]*\d)[A-Za-z0-9+/_=-]{40,}\b"
)
SECRET_MESSAGE = "Potential secret detected. Value omitted."
SECRET_PROPERTY_KEYS = {
    "match",
    "secret",
    "code",
    "raw",
    "line",
    "extracted",
    "content",
    "snippet",
    "value",
}
TOP_LIMIT = 15
VULN_PREFIXES = ("cve-", "ghsa-", "avd-", "dso-", "k8s-", "ds")


def score_severity(value):
    try:
        score = float(value)
    except (TypeError, ValueError):
        return None
    if score >= 9.0:
        return "critical"
    if score >= 7.0:
        return "high"
    if score >= 4.0:
        return "medium"
    if score > 0:
        return "low"
    return "unknown"


def explicit_from_tags(tags):
    found = []
    for tag in tags:
        key = str(tag).strip().upper()
        if key in EXPLICIT:
            found.append(EXPLICIT[key])
    if not found:
        return None
    return min(found, key=lambda item: RANK[item])


def properties_of(*objects):
    tags = []
    scores = []
    named = []
    for obj in objects:
        props = (obj or {}).get("properties") or {}
        if not isinstance(props, dict):
            continue
        tags.extend(str(tag) for tag in (props.get("tags") or []))
        if props.get("security-severity") is not None:
            scores.append(props.get("security-severity"))
        if props.get("severity"):
            named.append(str(props.get("severity")))
    return tags, scores, named


def classify_severity(result, rule):
    tags, scores, named = properties_of(result, rule)
    explicit = explicit_from_tags([*tags, *named])
    if explicit:
        return explicit, tags
    message = ((result.get("message") or {}).get("text") or "")
    match = SEVERITY_IN_TEXT.search(message)
    if match:
        return EXPLICIT.get(match.group(1).upper(), "unknown"), tags
    for score in scores:
        scored = score_severity(score)
        if scored:
            return scored, tags
    level = result.get("level") or (rule.get("defaultConfiguration") or {}).get("level") or ""
    return LEVEL.get(str(level).lower(), "unknown"), tags


def is_secret(rule_id, tags):
    tagset = {str(tag).lower() for tag in tags}
    if "secret" in tagset or "secrets" in tagset:
        return True
    rule = rule_id or ""
    lowered = rule.lower()
    if lowered.startswith(VULN_PREFIXES):
        return False
    return bool(SECRET_ID.search(rule))


def location_of(result):
    locations = result.get("locations") or []
    if not locations:
        return "unknown", None
    physical = (locations[0] or {}).get("physicalLocation") or {}
    artifact = physical.get("artifactLocation") or {}
    uri = str(artifact.get("uri") or "unknown")
    if uri.startswith("file://"):
        uri = uri[len("file://") :]
    for marker in ("/src/", "/github/workspace/"):
        if marker in uri:
            uri = uri.split(marker, 1)[1]
    uri = uri.lstrip("./")
    line = (physical.get("region") or {}).get("startLine")
    return uri, line


def scrub_text(text):
    if not text:
        return ""
    cleaned = LONG_TOKEN.sub("[redacted]", str(text))
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if len(cleaned) > 280:
        cleaned = cleaned[:277] + "..."
    return cleaned


def help_text(rule):
    help_obj = rule.get("help") or {}
    if not isinstance(help_obj, dict):
        return ""
    return scrub_text(help_obj.get("text") or help_obj.get("markdown") or "")


def display_risk(rule, message):
    short = (rule.get("shortDescription") or {}).get("text") or ""
    if short and not str(short).startswith("Semgrep Finding:"):
        return scrub_text(short)
    if message:
        return scrub_text(message)
    return scrub_text((rule.get("fullDescription") or {}).get("text") or "")


def concise_fix(message, rule):
    pkg = re.search(r"Package:\s*(\S+)", message or "")
    fixed = re.search(r"Fixed Version:\s*(\S+)", message or "")
    if pkg and fixed and fixed.group(1).lower() not in {"n/a", "none"}:
        return f"Upgrade {pkg.group(1)} to {fixed.group(1)} or later."
    text = help_text(rule)
    if not text:
        return ""
    sentence = text.split(". ")[0].strip()
    if sentence and not sentence.endswith("."):
        sentence += "."
    return sentence


def add_secret_value(sink, text):
    if isinstance(text, str) and len(text.strip()) >= 12:
        sink.append(text.strip())


def collect_secret_values(result):
    found = []

    def walk_location(location):
        physical = (location or {}).get("physicalLocation") or {}
        region = physical.get("region") or {}
        snippet = region.get("snippet") or {}
        add_secret_value(found, snippet.get("text") if isinstance(snippet, dict) else None)
        context = physical.get("contextRegion") or {}
        context_snippet = context.get("snippet") or {}
        add_secret_value(
            found,
            context_snippet.get("text") if isinstance(context_snippet, dict) else None,
        )

    for location in result.get("locations") or []:
        walk_location(location)
    for location in result.get("relatedLocations") or []:
        walk_location(location)
    props = result.get("properties") or {}
    if isinstance(props, dict):
        for key, value in props.items():
            if str(key).lower() in SECRET_PROPERTY_KEYS:
                add_secret_value(found, value)
    message = (result.get("message") or {}).get("text")
    add_secret_value(found, message)
    return found


def drop_snippets(location):
    physical = (location or {}).get("physicalLocation") or {}
    region = physical.get("region") or {}
    if isinstance(region, dict):
        region.pop("snippet", None)
    physical.pop("contextRegion", None)


def redact_result(result):
    message = result.get("message")
    if isinstance(message, dict):
        message["text"] = SECRET_MESSAGE
        message.pop("markdown", None)
    else:
        result["message"] = {"text": SECRET_MESSAGE}
    for location in result.get("locations") or []:
        drop_snippets(location)
    for location in result.get("relatedLocations") or []:
        drop_snippets(location)
    props = result.get("properties")
    if isinstance(props, dict):
        for key in list(props):
            if str(key).lower() in SECRET_PROPERTY_KEYS:
                props.pop(key, None)
    result.pop("fixes", None)


def index_rules(run):
    driver = ((run.get("tool") or {}).get("driver") or {})
    rules = {}
    for index, rule in enumerate(driver.get("rules") or []):
        rules[index] = rule
        rule_id = rule.get("id")
        if rule_id:
            rules[rule_id] = rule
    return rules


def rule_for(result, rules):
    rule_index = result.get("ruleIndex")
    if rule_index in rules:
        return rules[rule_index]
    return rules.get(result.get("ruleId")) or {}


def analyze(data):
    findings = []
    counts = Counter()
    secret_values = []
    if not data:
        return findings, counts, secret_values
    for run in data.get("runs") or []:
        rules = index_rules(run)
        for result in run.get("results") or []:
            rule_id = result.get("ruleId") or "unknown-rule"
            rule = rule_for(result, rules)
            severity, tags = classify_severity(result, rule)
            counts[severity] += 1
            path, line = location_of(result)
            secret = is_secret(rule_id, tags)
            message = ((result.get("message") or {}).get("text") or "")
            risk = "" if secret else display_risk(rule, message)
            fix = "" if secret else concise_fix(message, rule)
            if secret:
                secret_values.extend(collect_secret_values(result))
                redact_result(result)
            findings.append(
                {
                    "severity": severity,
                    "path": path,
                    "line": line,
                    "rule": rule_id,
                    "secret": secret,
                    "risk": risk,
                    "fix": fix,
                }
            )
    return findings, counts, secret_values


def load_sarif(path: Path):
    if not path.is_file():
        return None, "missing"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError, UnicodeError):
        return None, "invalid"
    if not isinstance(data, dict) or not isinstance(data.get("runs"), list):
        return None, "invalid"
    return data, "ok"


def format_where(item):
    if item["line"]:
        return f"{item['path']}:{item['line']}"
    return str(item["path"])


def scrub_serialized(text, values):
    cleaned = text
    unique = sorted({value for value in values if len(value) >= 12}, key=len, reverse=True)
    for value in unique:
        cleaned = cleaned.replace(value, "[redacted]")
        escaped = json.dumps(value)[1:-1]
        if escaped != value:
            cleaned = cleaned.replace(escaped, "[redacted]")
    return cleaned


def markdown(tools):
    lines = [
        "## Security scan (report only)",
        "",
        "Semgrep OSS and Trivy ran in report-only mode. Findings do not fail this job. "
        "Secret findings are listed as file:line and rule only; values are omitted.",
        "",
        "### Counts by severity",
        "",
        "| Tool | Critical | High | Medium | Low | Unknown | Total |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for tool in tools:
        if tool["status"] != "ok":
            lines.append(f"| {tool['name']} | — | — | — | — | — | — |")
            continue
        counts = tool["counts"]
        total = sum(counts[severity] for severity in SEVERITIES)
        cells = " | ".join(str(counts[severity]) for severity in SEVERITIES)
        lines.append(f"| {tool['name']} | {cells} | {total} |")
    lines.extend(["", "### Top critical and high findings", ""])
    for tool in tools:
        lines.append(f"#### {tool['name']}")
        lines.append("")
        if tool["status"] == "missing":
            lines.append("Scan output was not available.")
            lines.append("")
            continue
        if tool["status"] != "ok":
            lines.append("Scan output could not be parsed.")
            lines.append("")
            continue
        ranked = [item for item in tool["findings"] if item["severity"] in ("critical", "high")]
        ranked.sort(key=lambda item: (RANK[item["severity"]], item["path"], item["line"] or 0, item["rule"]))
        if not ranked:
            lines.append("No critical or high findings.")
            lines.append("")
            continue
        for item in ranked[:TOP_LIMIT]:
            where = format_where(item)
            if item["secret"]:
                lines.append(f"- **{item['severity']}** `{where}` `{item['rule']}`")
                continue
            detail = item["risk"] or "Review this finding."
            if item["fix"] and item["fix"] != item["risk"]:
                lines.append(
                    f"- **{item['severity']}** `{where}` `{item['rule']}` — {detail} Suggested fix: {item['fix']}"
                )
            else:
                lines.append(f"- **{item['severity']}** `{where}` `{item['rule']}` — {detail}")
        extra = len(ranked) - TOP_LIMIT
        if extra > 0:
            lines.append("")
            lines.append(f"{extra} more critical or high findings are in the uploaded SARIF.")
        lines.append("")
    lines.append(
        "SARIF is uploaded to GitHub code scanning with categories `semgrep-oss` and `trivy-fs` when a file was produced."
    )
    lines.append("")
    return "\n".join(lines)


def write_summary(text):
    destination = os.environ.get("GITHUB_STEP_SUMMARY")
    if destination:
        with open(destination, "a", encoding="utf-8") as handle:
            handle.write(text)
            if not text.endswith("\n"):
                handle.write("\n")
    sys.stdout.write(text)
    if not text.endswith("\n"):
        sys.stdout.write("\n")


def self_check():
    planted = "zz" + ("9f3c" * 10)
    sarif = {
        "version": "2.1.0",
        "runs": [
            {
                "tool": {
                    "driver": {
                        "name": "fixture",
                        "rules": [
                            {
                                "id": "generic.secrets.security.detected-generic-api-key",
                                "shortDescription": {"text": "Generic API key"},
                                "properties": {
                                    "tags": ["secret", "CRITICAL"],
                                    "security-severity": "9.1",
                                },
                            },
                            {
                                "id": "CVE-2024-0001",
                                "shortDescription": {"text": "Example vulnerability in a test fixture."},
                                "help": {"text": "Upgrade the example package."},
                                "properties": {"tags": ["HIGH"], "security-severity": "8.2"},
                            },
                        ],
                    }
                },
                "results": [
                    {
                        "ruleId": "generic.secrets.security.detected-generic-api-key",
                        "ruleIndex": 0,
                        "level": "error",
                        "message": {"text": f"Generic API key {planted}"},
                        "locations": [
                            {
                                "physicalLocation": {
                                    "artifactLocation": {"uri": "src/example.js"},
                                    "region": {"startLine": 12, "snippet": {"text": planted}},
                                }
                            }
                        ],
                        "properties": {"match": planted},
                    },
                    {
                        "ruleId": "CVE-2024-0001",
                        "ruleIndex": 1,
                        "level": "warning",
                        "message": {"text": "Severity: HIGH. Example package is vulnerable."},
                        "locations": [
                            {
                                "physicalLocation": {
                                    "artifactLocation": {"uri": "package-lock.json"},
                                    "region": {"startLine": 40},
                                }
                            }
                        ],
                    },
                ],
            }
        ],
    }
    findings, counts, values = analyze(sarif)
    rendered = scrub_serialized(
        markdown(
            [
                {
                    "name": "Fixture",
                    "status": "ok",
                    "findings": findings,
                    "counts": counts,
                }
            ]
        ),
        values,
    )
    serialized = scrub_serialized(json.dumps(sarif), values)
    if planted in serialized or planted in rendered:
        print("redaction self-check failed", file=sys.stderr)
        return 1
    if counts["critical"] != 1 or counts["high"] != 1:
        print("severity self-check failed", file=sys.stderr)
        return 1
    if "src/example.js:12" not in rendered or "package-lock.json:40" not in rendered:
        print("location self-check failed", file=sys.stderr)
        return 1
    secret_lines = [line for line in rendered.splitlines() if "example.js" in line]
    if len(secret_lines) != 1 or "—" in secret_lines[0] or "Generic API" in secret_lines[0]:
        print("secret label self-check failed", file=sys.stderr)
        return 1
    if "detected-generic-api-key" not in secret_lines[0]:
        print("secret rule self-check failed", file=sys.stderr)
        return 1
    if "Upgrade the example package." not in rendered:
        print("fix text self-check failed", file=sys.stderr)
        return 1
    print("redaction self-check passed")
    return 0


def main(argv):
    parser = argparse.ArgumentParser(description="Summarize report-only security SARIF.")
    parser.add_argument("--semgrep", default="semgrep.sarif")
    parser.add_argument("--trivy", default="trivy.sarif")
    parser.add_argument("--self-check", action="store_true")
    args = parser.parse_args(argv)
    if args.self_check:
        return self_check()

    tools = []
    secret_values = []
    for name, raw_path in (("Semgrep OSS", args.semgrep), ("Trivy", args.trivy)):
        path = Path(raw_path)
        try:
            data, status = load_sarif(path)
            findings, counts, values = analyze(data) if status == "ok" else ([], Counter(), [])
            secret_values.extend(values)
            if status == "ok":
                serialized = scrub_serialized(json.dumps(data, indent=2) + "\n", values)
                path.write_text(serialized, encoding="utf-8")
            tools.append(
                {
                    "name": name,
                    "status": status,
                    "findings": findings,
                    "counts": counts,
                }
            )
        except Exception:
            tools.append(
                {
                    "name": name,
                    "status": "invalid",
                    "findings": [],
                    "counts": Counter(),
                }
            )
    text = scrub_serialized(markdown(tools), secret_values)
    write_summary(text)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except Exception:
        write_summary(
            "## Security scan (report only)\n\n"
            "The summary step could not finish. Scan findings were not failed closed; "
            "see the scanner logs for tool errors. Secret values are not printed here.\n"
        )
        sys.exit(0)
