const { cpSync } = require('node:fs');
const { resolve } = require('node:path');
cpSync(resolve(__dirname, '../www/img'), resolve(__dirname, '../dist/img'), { recursive: true });
