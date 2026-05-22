export type Category = {
  id: string
  name: string
  slug: string
  icon: string
  is_active: boolean
  sort_order: number
}

export type PetCategory = {
  id: string
  name: string
  slug: string
  emoji: string
  type: 'home' | 'farm'
  is_active: boolean
  listing_count: number
}

export type Listing = {
  id: string
  user_id: string
  category_id: string
  title: string
  description: string
  price: number
  currency: 'ALL' | 'EUR'
  condition: 'i_ri' | 'i_perdorur' | null
  city: string
  is_premium: boolean
  is_active: boolean
  images: string[]
  views_count: number
  created_at: string
  profiles?: Profile
  categories?: Category
}

export type Profile = {
  id: string
  username: string
  full_name: string
  avatar_url: string
  city: string
  phone: string
  is_premium: boolean
  is_admin: boolean
  premium_expires_at: string
  created_at: string
}

export type PaymentMethod = {
  id: string
  name: string
  type: 'card' | 'paypal' | 'bank' | 'mobile'
  config_json: Record<string, string>
  is_active: boolean
}

export type AdminSetting = {
  id: string
  key: string
  value: string
  updated_at: string
}

export type PremiumSubscription = {
  id: string
  user_id: string
  plan: 'monthly' | 'yearly'
  amount_eur: number
  period: number
  start_date: string
  end_date: string
  payment_method: string
  status: 'active' | 'pending' | 'cancelled' | 'suspended'
}

export type Report = {
  id: string
  reporter_id: string
  listing_id: string
  reason: string
  status: 'pending' | 'resolved' | 'dismissed'
  admin_note: string
  created_at: string
}
