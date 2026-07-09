#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const INDEX_PATH = path.join(ROOT, '.repo-harness', 'context-index.json');
const FEATURES_PATH = path.join(ROOT, 'feature_list.json');
const PROGRESS_PATH = path.join(ROOT, 'progress.md');

function usage() {
  console.log(`Usage:
  node scripts/harness-context.mjs summary
  node scripts/harness-context.mjs list topics|modules|features
  node scripts/harness-context.mjs topic <topic-id>
  node scripts/harness-context.mjs module <module-name>
  node scripts/harness-context.mjs feature <feature-id|active>
  node scripts/harness-context.mjs search <term>`);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function readText(filePath) {
  return readFile(filePath, 'utf8');
}

function findFeature(features, id) {
  return features.find((feature) => feature.id === id);
}

function printFeature(feature) {
  console.log(`# ${feature.id} - ${feature.name}`);
  console.log(`status: ${feature.status}`);
  console.log(`depends_on: ${feature.dependencies.length ? feature.dependencies.join(', ') : 'none'}`);
  console.log('');
  console.log(feature.description);
  if (feature.evidence) {
    console.log('');
    console.log(`evidence: ${feature.evidence}`);
  }
}

function printModule(module) {
  console.log(`# ${module.name}`);
  console.log(`path: ${module.path}`);
  console.log(`skill: ${module.skill}`);
  console.log(`verification: ${module.verification}`);
  console.log('');
  console.log(module.summary);
  console.log('');
  console.log(`when to load: ${module.when}`);
}

function printTopicIndex(topic) {
  console.log(`# ${topic.id} - ${topic.title}`);
  console.log(`file: ${topic.file}`);
  console.log('');
  console.log(topic.summary);
  console.log('');
  console.log(`when to load: ${topic.when}`);
}

function searchIndex(index, features, term) {
  const needle = term.toLowerCase();
  const topicHits = index.topics.filter((topic) =>
    [topic.id, topic.title, topic.summary, topic.when].join(' ').toLowerCase().includes(needle)
  );
  const moduleHits = index.modules.filter((module) =>
    [module.name, module.summary, module.when, module.skill].join(' ').toLowerCase().includes(needle)
  );
  const featureHits = features.filter((feature) =>
    [feature.id, feature.name, feature.description, feature.status, feature.evidence].join(' ').toLowerCase().includes(needle)
  );

  console.log(`# search: ${term}`);
  console.log('');

  console.log('topics:');
  if (topicHits.length === 0) console.log('- none');
  for (const topic of topicHits) {
    console.log(`- ${topic.id}: ${topic.summary}`);
  }

  console.log('');
  console.log('modules:');
  if (moduleHits.length === 0) console.log('- none');
  for (const module of moduleHits) {
    console.log(`- ${module.name}: ${module.summary}`);
  }

  console.log('');
  console.log('features:');
  if (featureHits.length === 0) console.log('- none');
  for (const feature of featureHits) {
    console.log(`- ${feature.id} (${feature.status}): ${feature.name}`);
  }
}

async function main() {
  const [command, arg] = process.argv.slice(2);
  const index = await readJson(INDEX_PATH);
  const featureState = await readJson(FEATURES_PATH);

  switch (command) {
    case undefined:
    case 'summary': {
      console.log('# xq-harness summary');
      console.log('');
      console.log(index.purpose);
      console.log('');
      console.log(`active feature: ${featureState.activeFeature}`);
      console.log(`updated at: ${index.updatedAt}`);
      console.log('');
      console.log('query next:');
      for (const entry of index.startup.queryCommands) {
        console.log(`- ${entry}`);
      }
      console.log('');
      console.log('topics:');
      for (const topic of index.topics) {
        console.log(`- ${topic.id}: ${topic.summary}`);
      }
      console.log('');
      console.log('modules:');
      for (const module of index.modules) {
        console.log(`- ${module.name}: ${module.summary}`);
      }
      break;
    }
    case 'list': {
      if (arg === 'topics') {
        for (const topic of index.topics) console.log(topic.id);
        break;
      }
      if (arg === 'modules') {
        for (const module of index.modules) console.log(module.name);
        break;
      }
      if (arg === 'features') {
        for (const feature of featureState.features) console.log(feature.id);
        break;
      }
      usage();
      process.exitCode = 1;
      break;
    }
    case 'feature': {
      const featureId = arg === 'active' ? featureState.activeFeature : arg;
      const feature = findFeature(featureState.features, featureId);
      if (!feature) {
        console.error(`Unknown feature: ${arg}`);
        process.exit(1);
      }
      printFeature(feature);
      break;
    }
    case 'module': {
      const module = index.modules.find((entry) => entry.name === arg);
      if (!module) {
        console.error(`Unknown module: ${arg}`);
        process.exit(1);
      }
      printModule(module);
      break;
    }
    case 'topic': {
      const topic = index.topics.find((entry) => entry.id === arg);
      if (!topic) {
        console.error(`Unknown topic: ${arg}`);
        process.exit(1);
      }
      printTopicIndex(topic);
      console.log('');
      console.log(await readText(path.join(ROOT, topic.file)));
      break;
    }
    case 'search': {
      if (!arg) {
        usage();
        process.exit(1);
      }
      searchIndex(index, featureState.features, arg);
      break;
    }
    case 'progress': {
      console.log(await readText(PROGRESS_PATH));
      break;
    }
    default:
      usage();
      process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
