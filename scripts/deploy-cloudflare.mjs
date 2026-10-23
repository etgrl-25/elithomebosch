import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const configPath=resolve('dist/server/wrangler.json');
const config=JSON.parse(readFileSync(configPath,'utf8'));
for(const db of config.d1_databases??[])db.migrations_dir=resolve('drizzle');
config.workers_dev=true;
config.preview_urls=false;
writeFileSync(configPath,JSON.stringify(config,null,2));
for(const args of [
 ['d1','migrations','apply','DB','--remote','--config',configPath,'--yes'],
 ['deploy','--config',configPath]
]){
 const result=spawnSync(process.execPath,[resolve('node_modules/wrangler/bin/wrangler.js'),...args],{stdio:'inherit',env:process.env});
 if(result.status!==0)process.exit(result.status||1);
}
