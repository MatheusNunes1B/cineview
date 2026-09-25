-- Execute no SQL Editor do projeto Supabase para remover o exemplo antigo.
-- A exclusão só ocorre se a tabela ainda tiver exatamente os dois registros de demonstração.
begin;
do $$
declare
  somente_exemplo boolean;
begin
  if to_regclass('public.produtos') is null then
    return;
  end if;

  select count(*) = 2
     and count(distinct nome) = 2
     and bool_and(
       (nome = 'Produto de demonstração A' and preco = 19.90)
       or (nome = 'Produto de demonstração B' and preco = 29.90)
     )
  into somente_exemplo
  from public.produtos;

  if not coalesce(somente_exemplo, false) then
    raise exception 'A tabela produtos contém dados diferentes do exemplo; exclusão cancelada.';
  end if;

  drop table public.produtos;
end $$;
commit;
