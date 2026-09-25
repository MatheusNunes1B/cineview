const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const items = ['movies', 'series'].flatMap(name => {
  const source = fs.readFileSync(path.join(root, 'www/data', name + '.js'), 'utf8');
  return vm.runInNewContext(source.replace('export const ' + name + ' =', 'globalThis.items ='));
});
const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
const rows = items.map(({ id, type, title, ...details }) =>
  '(' + [quote(id), quote(type), quote(title), quote(JSON.stringify(details)) + '::jsonb'].join(', ') + ')');
fs.writeFileSync(path.join(root, 'supabase/seed.sql'),
  '-- Execute após 202609250003_titles_details.sql.\n' +
  'insert into public.titles (id, type, title, details) values\n' + rows.join(',\n') +
  '\non conflict (id) do update set type = excluded.type, title = excluded.title, details = excluded.details;\n');
console.log(items.length + ' títulos exportados para supabase/seed.sql');
