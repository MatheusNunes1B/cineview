const { cpSync, writeFileSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');
cpSync(resolve(__dirname, '../www/img'), resolve(__dirname, '../dist/img'), { recursive: true });
let commit = process.env.GITHUB_SHA || process.env.CF_PAGES_COMMIT_SHA || 'unknown';
try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
writeFileSync(resolve(__dirname, '../dist/version.json'), JSON.stringify({ commit, builtAt: new Date().toISOString() }) + '\n');
