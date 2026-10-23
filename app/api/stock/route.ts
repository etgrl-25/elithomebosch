import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {getDb} from '../../../db';
import {products,stockMoves} from '../../../db/schema';
import {eq,and,desc} from 'drizzle-orm';
import {z} from 'zod';
const productInput=z.object({id:z.string().uuid(),name:z.string().trim().min(1).max(100),brand:z.string().trim().max(60),model:z.string().trim().max(100),sku:z.string().trim().max(80),quantity:z.number().int().min(0).max(1000000),minimum:z.number().int().min(0).max(1000000)});
const moveInput=z.object({id:z.string().uuid(),productId:z.string().uuid(),delta:z.number().int().min(-1000000).max(1000000).refine(n=>n!==0),reason:z.string().trim().min(1).max(200)});
export async function GET(){
 const u=await getChatGPTUser();if(!u)return Response.json({error:'Giriş gerekli.'},{status:401});
 const db=getDb();
 const items=await db.select().from(products).where(eq(products.owner,u.userId)).orderBy(desc(products.createdAt));
 const moves=await db.select().from(stockMoves).where(eq(stockMoves.owner,u.userId)).orderBy(desc(stockMoves.createdAt)).limit(200);
 return Response.json({products:items,moves},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(req:Request){
 const u=await getChatGPTUser();if(!u)return Response.json({error:'Giriş gerekli.'},{status:401});
 const parsed=productInput.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:'Ürün bilgilerini ve adetleri kontrol edin.'},{status:400});
 const p=parsed.data;const db=getDb();
 if(p.sku){const existing=await db.select().from(products).where(and(eq(products.owner,u.userId),eq(products.sku,p.sku)));if(existing.some(r=>r.id!==p.id))return Response.json({error:'Bu stok kodu zaten kullanılıyor.'},{status:409});}
 await db.insert(products).values({...p,owner:u.userId,createdAt:new Date().toISOString()}).onConflictDoNothing();
 return Response.json({ok:true});
}
export async function PATCH(req:Request){
 const u=await getChatGPTUser();if(!u)return Response.json({error:'Giriş gerekli.'},{status:401});
 const parsed=moveInput.safeParse(await req.json().catch(()=>null));if(!parsed.success)return Response.json({error:'Geçerli adet ve açıklama girin.'},{status:400});
 const b=parsed.data;const db=env.DB!;
 // D1 batches are atomic: append a movement only when stock is sufficient,
 // then update its product once. The movement id makes network retries safe.
 const result=await db.batch([
 db.prepare('INSERT INTO stock_moves (id,owner,product_id,delta,reason,created_at) SELECT ?,owner,id,?,?,? FROM products WHERE id=? AND owner=? AND quantity+? BETWEEN 0 AND 1000000 ON CONFLICT(id) DO NOTHING RETURNING id').bind(b.id,b.delta,b.reason,new Date().toISOString(),b.productId,u.userId,b.delta),
 db.prepare('UPDATE products SET quantity=quantity+? WHERE id=? AND owner=? AND changes()=1').bind(b.delta,b.productId,u.userId)
 ]);
 if(!result[0].results?.length){
 const previous=await getDb().select().from(stockMoves).where(and(eq(stockMoves.id,b.id),eq(stockMoves.owner,u.userId)));
 if(!previous.length)return Response.json({error:'Stok yetersiz veya ürün bulunamadı.'},{status:409});
 }
 return Response.json({ok:true});
}
