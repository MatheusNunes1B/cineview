const { test, expect } = require('@playwright/test');
const user = { id: '00000000-0000-0000-0000-000000000001', email: 'cineview@example.test', aud: 'authenticated', role: 'authenticated' };
const key = 'CapacitorStorage.supabase_session';
const token = expires => [Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),
  Buffer.from(JSON.stringify({sub:user.id,exp:expires,aud:'authenticated',role:'authenticated'})).toString('base64url'), 'test-signature'].join('.');
const session = expired => ({ access_token: token(Math.floor(Date.now()/1000)+(expired?-3600:3600)), refresh_token:'test-refresh', expires_in:3600, token_type:'bearer', user });
async function api(page, options = {}) {
  const { movies } = await import('../../www/data/movies.js');
  const titles = movies.slice(0,6).map(item=>({id:item.id,type:item.type,title:item.title,details:item}));
  const counts={users:0,tokens:0,collections:0,documents:0};
  page.on('request', request=>{if(request.resourceType()==='document')counts.documents++;});
  await page.route('https://cineview-test.supabase.co/**', async route=>{
    const url=route.request().url();
    let body={}, status=200;
    if(url.includes('/auth/v1/user')) {counts.users++; if(options.delay)await new Promise(r=>setTimeout(r,options.delay));body=user;}
    else if(url.includes('/auth/v1/token')) {counts.tokens++;body=session(false);if(options.revoked){status=400;body={error_code:'refresh_token_not_found',code:'refresh_token_not_found',msg:'Revoked'};}}
    else if(url.includes('/auth/v1/signup'))body={user,session:null};
    else if(url.includes('/rest/v1/titles'))body=titles;
    else if(url.includes('/rest/v1/user_collections')){counts.collections++;body=options.rows||[];}
    if(options.offline && url.includes('/auth/v1/')) return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Unavailable'})});
    await route.fulfill({status,contentType:'application/json',headers:{'x-supabase-api-version':'2024-01-01'},body:JSON.stringify(body)});
  });
  return counts;
}
async function seed(page, value) {await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key,value});}
async function login(page) {
  await page.locator('[data-account]').click();
  await page.locator('[name=email]').fill(user.email);await page.locator('[name=password]').fill('example-password');
  await page.locator('[value=login]').click();await expect(page.locator('[data-account]')).toHaveText('Minha conta');
}
test('login, navegação multipágina, nova página e logout sem reload', async({page,context})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const counts=await api(page);await page.goto('/');await login(page);
  expect(counts.documents).toBe(1);expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).user.email,key)).toBe(user.email);
  await page.locator('a[href="favorites.html"]').first().click();await expect(page.locator('[data-account]')).toHaveText('Minha conta');
  expect(counts.users).toBeGreaterThan(0);await page.close();
  const reopened=await context.newPage();const again=await api(reopened);await reopened.goto('/watchlist.html');
  await expect(reopened.locator('[data-account]')).toHaveText('Minha conta');await reopened.locator('[data-account]').click();
  await expect(reopened.locator('[data-account-status]')).toContainText(user.email);await reopened.locator('[data-signout]').click();
  await expect(reopened.locator('[data-account]')).toHaveText('Entrar');expect(again.documents).toBe(1);
  expect(await reopened.evaluate(key=>localStorage.getItem(key),key)).toBeNull();await reopened.reload();
  await expect(reopened.locator('[data-account]')).toHaveText('Entrar');expect(await reopened.locator('dialog.account-dialog').count()).toBe(1);expect(errors).toEqual([]);
});
test('bootstrap não mostra login nem consulta coleções antes da restauração', async({page})=>{
  const counts=await api(page,{delay:700,rows:[{kind:'favorites',title_id:'m1'}]});await seed(page,JSON.stringify(session(false)));
  await page.goto('/favorites.html');await expect(page.getByText('Restaurando sua conta…')).toBeVisible();
  expect(counts.collections).toBe(0);await expect(page.locator('[data-account]')).toHaveCount(0);
  await expect(page.locator('[data-account]')).toHaveText('Minha conta');await expect(page.locator('[data-collection-grid] .card')).toHaveCount(1);
});
test('SDK renova access token expirado e Preferences recebe refresh novo',async({page})=>{
  const counts=await api(page);await seed(page,JSON.stringify(session(true)));await page.goto('/');
  await expect(page.locator('[data-account]')).toHaveText('Minha conta');expect(counts.tokens).toBe(1);
  expect(await page.evaluate(key=>JSON.parse(atob(JSON.parse(localStorage.getItem(key)).access_token.split('.')[1])).exp,key)).toBeGreaterThan(Math.floor(Date.now()/1000));
});
for(const [name,value,options] of [['JSON inválido','{broken',{}],['JWT inválido',JSON.stringify({access_token:'not-a-jwt',refresh_token:'refresh'}),{}],['token revogado',JSON.stringify(session(true)),{revoked:true}]]) {
 test(name+' abre como visitante e remove sessão inválida',async({page})=>{
   await api(page,options);await seed(page,value);await page.goto('/');await expect(page.locator('[data-account]')).toHaveText('Entrar');
   expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBeNull();
 });
}
test('erro temporário preserva sessão e retry restaura',async({page})=>{
 const options={offline:true};await api(page,options);const saved=JSON.stringify(session(false));await seed(page,saved);await page.goto('/');
 await expect(page.getByRole('alert')).toBeVisible({timeout:25000});expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(saved);
 options.offline=false;await page.getByRole('button',{name:'Tentar novamente'}).click();await expect(page.locator('[data-account]')).toHaveText('Minha conta',{timeout:25000});
});
test('vários ciclos de login/logout não duplicam diálogos ou listeners',async({page})=>{
 const counts=await api(page);await page.goto('/');
 for(let i=0;i<3;i++) {await login(page);await page.locator('[data-account]').click();await page.locator('[data-signout]').click();await expect(page.locator('[data-account]')).toHaveText('Entrar');expect(await page.locator('dialog.account-dialog').count()).toBe(1);}
 expect(counts.tokens).toBe(3);expect(counts.documents).toBe(1);
});
