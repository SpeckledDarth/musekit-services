export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  role: 'admin' | 'member' | 'viewer';
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string | Date;
}

export interface TeamMember {
  id: string;
  org_id: string;
  user_id: string;
  role: string;
  joined_at: string | Date;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end: string | Date;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, any>;
  ip_address: string;
  created_at: string | Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string | Date;
}

export interface BrandSettings {
  app_name: string;
  logo_url: string;
  primary_color: string;
  accent_color: string;
  hero_style: string;
  header_bg: string;
  header_text: string;
  footer_bg: string;
  footer_text: string;
}

export interface FeatureToggle {
  id: string;
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string;
  children?: NavItem[];
  roles?: string[];
}

export interface AppConfig {
  name: string;
  description: string;
  url: string;
  support: string;
  billing: string;
  features: Record<string, boolean>;
}
