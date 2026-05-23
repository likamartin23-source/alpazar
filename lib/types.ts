export type Category = { id:string; name:string; slug:string; icon:string; is_active:boolean; sort_order:number }
export type PetCategory = { id:string; name:string; slug:string; emoji:string; type:'home'|'farm'; listing_count:number; is_active:boolean }
export type Listing = { id:string; user_id:string; category_id:string; title:string; description:string; price:number; currency:'ALL'|'EUR'; condition:'i_ri'|'i_perdorur'|null; city:string; is_premium:boolean; is_active:boolean; images:string[]; views_count:number; created_at:string }
export type Profile = { id:string; username:string; full_name:string; avatar_url:string; city:string; is_premium:boolean; is_admin:boolean; gamification_points:number; gamification_level:string }
export type PaymentMethod = { id:string; name:string; type:string; is_active:boolean }
export type AdminSetting = { id:string; key:string; value:string }
export type PremiumSubscription = { id:string; user_id:string; plan:string; amount_eur:number; start_date:string; end_date:string; payment_method:string; status:string; profiles?:{full_name:string;username:string} }
