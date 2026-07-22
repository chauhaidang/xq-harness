import fs from 'node:fs';
import path from 'node:path';

const evidenceDirectory = process.argv[2];
if (!evidenceDirectory) {
  throw new Error('usage: node audit-policy.mjs <evidence-directory>');
}

const severities = ['info', 'low', 'moderate', 'high', 'critical'];

function loadAudit(scope) {
  const auditPath = path.join(evidenceDirectory, `audit-${scope}.json`);
  const report = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  if (report.error) {
    throw new Error(`${scope} audit endpoint error: ${report.error.summary ?? report.error.message ?? 'unknown error'}`);
  }
  if (!report.metadata?.vulnerabilities || !report.vulnerabilities) {
    throw new Error(`${scope} audit did not return npm audit v2 metadata`);
  }

  const counts = Object.fromEntries(
    severities.map((severity) => [severity, Number(report.metadata.vulnerabilities[severity] ?? 0)]),
  );
  counts.total = Number(report.metadata.vulnerabilities.total ?? 0);

  const findings = Object.entries(report.vulnerabilities)
    .map(([name, finding]) => ({
      name,
      severity: finding.severity,
      direct: Boolean(finding.isDirect),
      range: finding.range,
      fixAvailable: finding.fixAvailable,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return { scope, counts, findings };
}

const production = loadAudit('production');
const development = loadAudit('development');
const summary = {
  generatedAt: new Date().toISOString(),
  policy: 'No undispositioned npm advisory is accepted by the import candidate.',
  production,
  development,
};

fs.writeFileSync(
  path.join(evidenceDirectory, 'audit-summary.json'),
  `${JSON.stringify(summary, null, 2)}\n`,
);

const markdown = [
  '# XQ Fitness write-service audit summary',
  '',
  '| Scope | Info | Low | Moderate | High | Critical | Total |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...[production, development].map(({ scope, counts }) =>
    `| ${scope} | ${counts.info} | ${counts.low} | ${counts.moderate} | ${counts.high} | ${counts.critical} | ${counts.total} |`,
  ),
  '',
  ...[production, development].flatMap(({ scope, findings }) => [
    `## ${scope} findings`,
    '',
    ...(findings.length === 0
      ? ['None.']
      : findings.map(({ name, severity, direct, range }) =>
          `- ${name}: ${severity}; ${direct ? 'direct' : 'transitive'}; affected range ${range}`,
        )),
    '',
  ]),
].join('\n');
fs.writeFileSync(path.join(evidenceDirectory, 'audit-summary.md'), `${markdown}\n`);
process.stdout.write(`${markdown}\n`);

if (production.counts.total !== 0 || development.counts.total !== 0) {
  process.exitCode = 1;
}
