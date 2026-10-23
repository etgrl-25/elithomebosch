import {getChatGPTUser} from '../../chatgpt-auth';
import {getDb} from '../../../db';
import {sales} from '../../../db/schema';
import {and,eq,desc} from 'drizzle-orm';
import {z} from 'zod';
const input=z.object({id:z.string().uuid(),amount:z.number().int().positive().max(10000000000),payment:z.enum(['Nakit','Kart','Havale','WebPOS']),installments:z.number().int().min(1).max(12).default(1),note:z.string().trim().max(200),soldAt:z.string().datetime().refine(v=>Date.parse(v)<=Date.now()+60000)});
export async function GET(){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Devam etmek için giriş yapın.'},{status:401});
 const rows=await getDb().select().from(sales).where(eq(sales.owner,user.userId)).orderBy(desc(sales.soldAt));
 return Response.json(rows,{headers:{'Cache-Control':'no-store'}});
}
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Giriş gerekli.'},{status:401});
 const parsed=input.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:'Tutar, tarih ve ödeme türünü kontrol edin.'},{status:400});
 const b=parsed.data;
 await getDb().insert(sales).values({...b,installments:b.payment==='Kart'?b.installments:1,owner:user.userId,soldAt:new Date(b.soldAt).toISOString()}).onConflictDoNothing();
 return Response.json({ok:true});
}
export async function PATCH(req:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Giriş gerekli.'},{status:401});
 const parsed=z.object({id:z.string().uuid()}).safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:'Geçersiz kayıt.'},{status:400});
 await getDb().update(sales).set({cancelled:1}).where(and(eq(sales.id,parsed.data.id),eq(sales.owner,user.userId)));
 return Response.json({ok:true});
}

export async function DELETE(req:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Giriş gerekli.'},{status:401});
 const parsed=z.object({id:z.string().uuid()}).safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:'Geçersiz kayıt.'},{status:400});
 const deleted=await getDb().delete(sales).where(and(eq(sales.id,parsed.data.id),eq(sales.owner,user.userId))).returning({id:sales.id});
 if(!deleted.length)return Response.json({error:'Satış bulunamadı.'},{status:404});
 return Response.json({ok:true});
}
