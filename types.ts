// Kategoritë kryesore
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

// Listing (shpalljet)
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
  profiles?: Profile        // lidhje opsionale me profilin
  categories?: Category     // lidhje opsionale me kategorinë
}

// Profilet e përdoruesve
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

// Metodat e pagesës
export type PaymentMethod = {
  id: string
  name: string
  type: 'card' | 'paypal' | 'bank' | 'mobile'
  config_json: Record<string, string>
  is_active: boolean
}

// Konfigurime admin
export type AdminSetting = {
  id: string
  key: string
  value: string
  updated_at: string
}

// Abonimet premium
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

// Raportet e përdoruesve
export type Report = {
  id: string
  reporter_id: string
  listing_id: string
  reason: string
  status: 'pending' | 'resolved' | 'dismissed'
  admin_note: string
  created_at: string
}
