import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const sales = sqliteTable('sales', {
 id:text('id').primaryKey(),owner:text('owner').notNull(),amount:integer('amount').notNull(),
 payment:text('payment').notNull(),note:text('note').notNull(),soldAt:text('sold_at').notNull(),
 cancelled:integer('cancelled').notNull().default(0),
 installments:integer('installments').notNull().default(1),
});
export const products = sqliteTable('products', {
 id:text('id').primaryKey(),owner:text('owner').notNull(),name:text('name').notNull(),
 brand:text('brand').notNull(),model:text('model').notNull(),sku:text('sku').notNull(),
 quantity:integer('quantity').notNull().default(0),minimum:integer('minimum').notNull().default(2),
 createdAt:text('created_at').notNull(),
});
export const stockMoves = sqliteTable('stock_moves', {
 id:text('id').primaryKey(),owner:text('owner').notNull(),productId:text('product_id').notNull().references(()=>products.id),
 delta:integer('delta').notNull(),reason:text('reason').notNull(),createdAt:text('created_at').notNull(),
});
export const sessions = sqliteTable('sessions', {
 tokenHash:text('token_hash').primaryKey(),email:text('email').notNull(),expiresAt:integer('expires_at').notNull(),
});
export const loginAttempts = sqliteTable('login_attempts', {
 key:text('key').primaryKey(),attempts:integer('attempts').notNull().default(0),expiresAt:integer('expires_at').notNull(),
});
