export async function loadCatalog(client, signal) {
  if (!client) throw new Error('Configure o Supabase no arquivo .env.local.');
  const items = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from('titles')
      .select('id,type,title,details').order('id').range(offset, offset + 499).abortSignal(signal);
    if (error) throw new Error('Não foi possível consultar o catálogo no Supabase.');
    items.push(...data);
    if (data.length < 500) break;
  }
  if (!items.length) throw new Error('O catálogo do Supabase está vazio. Execute a migração e o seed.sql.');
  if (items.some(row => !row.details || typeof row.details !== 'object' ||
      !row.details.poster || !row.details.year)) {
    throw new Error('O catálogo ainda não tem os detalhes dos filmes. Execute a migração e o seed.sql.');
  }
  return items.map(row => ({ ...row.details, id: row.id, type: row.type, title: row.title }));
}
