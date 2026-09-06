const assert = require('node:assert/strict');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const OUT=path.resolve(__dirname,'_shots'); fs.mkdirSync(OUT,{recursive:true});
const BASE=process.env.BASE || 'http://127.0.0.1:8777';
(async()=>{
 const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
 try {
 const page=await browser.newPage(); const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>errors.push(r.url()));
 await page.setViewport({width:1366,height:768});
 await page.goto(BASE,{waitUntil:'networkidle0'});
 await page.evaluate(()=>{localStorage.removeItem('woos.world.v1.progress');SFX.on=false;});
 const cards=await page.$$('.gcard');
 for(const card of cards) if((await card.$eval('h3',e=>e.textContent))==='세계탐험하기') await card.$eval('[data-act=play]',e=>e.click());
 assert.equal(await page.$eval('#gh-title',e=>e.textContent),'세계탐험하기');
 assert.equal((await page.$$('#gh-levels button:disabled')).length,4);
 await page.screenshot({path:path.join(OUT,'world-desktop.png')});
 const layout=await page.$eval('.world-stage',e=>({scroll:e.scrollHeight-e.clientHeight,width:e.scrollWidth-e.clientWidth}));
 assert.ok(layout.scroll<=2 && layout.width<=2,JSON.stringify(layout));
 for(let level=1;level<=5;level++) {
  for(let i=0;i<10;i++) {
   const answer=await page.evaluate(()=>{const g=gameInstances[3];return g.question.choices.indexOf(g.question.answer);});
   await page.click('[data-choice="'+answer+'"]');
   if(level===1 && i===0) {
    await page.click('#btn-review');
    assert.ok(await page.$eval('#review-scroll',e=>e.textContent.includes('지리를 배울 수 있는가')));
    await page.click('#review-close');
   }
   await page.click('#world-next');
  }
  assert.ok(await page.evaluate(()=>gameInstances[3].done));
  if(level<5) await page.click('#world-next-level');
 }
 assert.equal(await page.$('#world-next-level'),null);
 await page.screenshot({path:path.join(OUT,'world-complete.png')});
 await page.reload({waitUntil:'networkidle0'}); await page.keyboard.press('3');
 assert.equal(await page.evaluate(()=>gameInstances[3].level),5);
 await page.click('#gh-levels [data-lv="2"]');
 const wrong=await page.evaluate(()=>{const g=gameInstances[3];return g.question.choices.findIndex(c=>c!==g.question.answer);});
 await page.click('[data-choice="'+wrong+'"]');
 await page.screenshot({path:path.join(OUT,'world-wrong.png')});
 await page.click('#world-next');
 assert.equal(await page.evaluate(()=>gameInstances[3].position),0);
 assert.equal(await page.evaluate(()=>gameInstances[3].level),2);
 await page.click('#btn-sheet');
 for(let i=0;i<4;i++) {const imgs=await page.$$('#sheet-scroll img');await imgs[i].evaluate(e=>e.scrollIntoView());await page.waitForFunction(i=>{const e=document.querySelectorAll('#sheet-scroll img')[i];return e.complete && e.naturalWidth>0;},{},i);}
 assert.equal((await page.$$('#sheet-scroll img')).length,4);
 await page.click('#sheet-close');
 await page.setViewport({width:390,height:844});
 await page.click('#gh-levels [data-lv="1"]');
 await page.screenshot({path:path.join(OUT,'world-mobile.png')});
 assert.ok(await page.$eval('.world-stage',e=>e.scrollWidth<=e.clientWidth+2),'mobile no horizontal overflow');
 const mobileAnswer=await page.evaluate(()=>{const g=gameInstances[3];return g.question.choices.indexOf(g.question.answer);});
 await page.click('[data-choice="'+mobileAnswer+'"]'); await page.click('#world-next');
 assert.equal(await page.evaluate(()=>gameInstances[3].position),1);
 await page.setViewport({width:1366,height:768});
 for(const [file,expected] of [['review',3],['worksheet',4]]) {
  await page.goto(BASE+'/'+file+'.html',{waitUntil:'networkidle0'});
  assert.equal((await page.$$('.sheet')).length,expected);
  await page.pdf({path:path.join(OUT,file+'.pdf'),preferCSSPageSize:true,printBackground:true});
 }
 assert.deepEqual(errors,[]);
 console.log('WORLD BROWSER PASS: real clicks through 5 levels, persisted locks, wrong answer, modals, 4 source photos, mobile play, print PDFs.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
