export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  org_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface TeamInvitation {
  id: string;
  org_id: string;
  email: string;
  role: string;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string;
  status: string;
  current_period_end: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface BrandSettings {
  id: string;
  app_name: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  hero_style: string | null;
  header_bg: string | null;
  header_text: string | null;
  footer_bg: string | null;
  footer_text: string | null;
  updated_at: string;
}

export interface FeatureToggle {
  id: string;
  key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  updated_at: string;
}

export interface ContentPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  author_id: string;
  published_at: string | null;
  created_at: string;
}

export interface Waitlist {
  id: string;
  email: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string | null;
  message: string;
  nps_score: number | null;
  created_at: string;
}

export interface WebhookConfig {
  id: string;
  url: string;
  secret: string | null;
  enabled: boolean;
  events: string[];
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[] | null;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  service: string;
  key_encrypted: string;
  source: string | null;
  created_at: string;
}

export interface SocialPost {
  id: string;
  user_id: string;
  content: string;
  platform: string;
  media_urls: string[] | null;
  status: string;
  scheduled_at: string | null;
  posted_at: string | null;
  platform_post_id: string | null;
  engagement_data: Record<string, unknown>;
  error_message: string | null;
  ai_generated: boolean;
  brand_voice: string | null;
  trend_source: string | null;
  niche_triggered: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: string;
  platform_user_id: string | null;
  platform_username: string | null;
  display_name: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
  is_valid: boolean;
  last_validated_at: string | null;
  last_error: string | null;
  connected_at: string;
  updated_at: string;
}

export interface BrandPreference {
  id: string;
  user_id: string;
  org_id: string | null;
  tone: string;
  niche: string;
  location: string | null;
  sample_urls: string[];
  target_audience: string | null;
  posting_goals: string | null;
  preferred_platforms: string[];
  post_frequency: string;
  created_at: string;
  updated_at: string;
}

export interface SocialAnalytics {
  id: string;
  post_id: string;
  platform: string;
  likes: number;
  shares: number;
  comments: number;
  reach: number;
  impressions: number;
  recorded_at: string;
}

export interface PostQueue {
  id: string;
  user_id: string;
  post_id: string;
  position: number;
  scheduled_at: string | null;
}

export interface ProfileInsert {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationInsert {
  name: string;
  slug: string;
  owner_id: string;
  id?: string;
  created_at?: string;
}

export interface TeamMemberInsert {
  org_id: string;
  user_id: string;
  id?: string;
  role?: string;
  joined_at?: string;
}

export interface TeamInvitationInsert {
  org_id: string;
  email: string;
  invited_by: string;
  token: string;
  expires_at: string;
  id?: string;
  role?: string;
  accepted_at?: string | null;
}

export interface SubscriptionInsert {
  user_id: string;
  id?: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan?: string;
  status?: string;
  current_period_end?: string | null;
  created_at?: string;
}

export interface AuditLogInsert {
  action: string;
  resource_type: string;
  id?: string;
  user_id?: string | null;
  resource_id?: string | null;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at?: string;
}

export interface NotificationInsert {
  user_id: string;
  type: string;
  title: string;
  message: string;
  id?: string;
  read?: boolean;
  created_at?: string;
}

export interface BrandSettingsInsert {
  id?: string;
  app_name?: string;
  logo_url?: string | null;
  primary_color?: string;
  accent_color?: string;
  hero_style?: string | null;
  header_bg?: string | null;
  header_text?: string | null;
  footer_bg?: string | null;
  footer_text?: string | null;
  updated_at?: string;
}

export interface FeatureToggleInsert {
  key: string;
  label: string;
  id?: string;
  description?: string | null;
  enabled?: boolean;
  updated_at?: string;
}

export interface ContentPostInsert {
  title: string;
  slug: string;
  content: string;
  author_id: string;
  id?: string;
  status?: string;
  published_at?: string | null;
  created_at?: string;
}

export interface WaitlistInsert {
  email: string;
  id?: string;
  created_at?: string;
}

export interface FeedbackInsert {
  message: string;
  id?: string;
  user_id?: string | null;
  nps_score?: number | null;
  created_at?: string;
}

export interface WebhookConfigInsert {
  url: string;
  id?: string;
  secret?: string | null;
  enabled?: boolean;
  events?: string[];
  created_at?: string;
}

export interface EmailTemplateInsert {
  name: string;
  subject: string;
  body: string;
  id?: string;
  variables?: string[] | null;
  updated_at?: string;
}

export interface ApiKeyInsert {
  service: string;
  key_encrypted: string;
  id?: string;
  source?: string | null;
  created_at?: string;
}

export interface SocialPostInsert {
  user_id: string;
  platform: string;
  content: string;
  id?: string;
  media_urls?: string[] | null;
  status?: string;
  scheduled_at?: string | null;
  posted_at?: string | null;
  platform_post_id?: string | null;
  engagement_data?: Record<string, unknown>;
  error_message?: string | null;
  ai_generated?: boolean;
  brand_voice?: string | null;
  trend_source?: string | null;
  niche_triggered?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SocialAccountInsert {
  user_id: string;
  platform: string;
  id?: string;
  platform_user_id?: string | null;
  platform_username?: string | null;
  display_name?: string | null;
  access_token_encrypted?: string | null;
  refresh_token_encrypted?: string | null;
  token_expires_at?: string | null;
  scopes?: string[] | null;
  is_valid?: boolean;
  last_validated_at?: string | null;
  last_error?: string | null;
  connected_at?: string;
  updated_at?: string;
}

export interface BrandPreferenceInsert {
  user_id: string;
  id?: string;
  org_id?: string | null;
  tone?: string;
  niche?: string;
  location?: string | null;
  sample_urls?: string[];
  target_audience?: string | null;
  posting_goals?: string | null;
  preferred_platforms?: string[];
  post_frequency?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SocialAnalyticsInsert {
  post_id: string;
  platform: string;
  id?: string;
  likes?: number;
  shares?: number;
  comments?: number;
  reach?: number;
  impressions?: number;
  recorded_at?: string;
}

export interface PostQueueInsert {
  user_id: string;
  post_id: string;
  id?: string;
  position?: number;
  scheduled_at?: string | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: Partial<ProfileInsert>;
        Relationships: [];
      };
      organizations: {
        Row: Organization;
        Insert: OrganizationInsert;
        Update: Partial<OrganizationInsert>;
        Relationships: [];
      };
      team_members: {
        Row: TeamMember;
        Insert: TeamMemberInsert;
        Update: Partial<TeamMemberInsert>;
        Relationships: [
          { foreignKeyName: "team_members_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] }
        ];
      };
      team_invitations: {
        Row: TeamInvitation;
        Insert: TeamInvitationInsert;
        Update: Partial<TeamInvitationInsert>;
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: SubscriptionInsert;
        Update: Partial<SubscriptionInsert>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: AuditLogInsert;
        Update: Partial<AuditLogInsert>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: NotificationInsert;
        Update: Partial<NotificationInsert>;
        Relationships: [];
      };
      brand_settings: {
        Row: BrandSettings;
        Insert: BrandSettingsInsert;
        Update: Partial<BrandSettingsInsert>;
        Relationships: [];
      };
      feature_toggles: {
        Row: FeatureToggle;
        Insert: FeatureToggleInsert;
        Update: Partial<FeatureToggleInsert>;
        Relationships: [];
      };
      content_posts: {
        Row: ContentPost;
        Insert: ContentPostInsert;
        Update: Partial<ContentPostInsert>;
        Relationships: [];
      };
      waitlist: {
        Row: Waitlist;
        Insert: WaitlistInsert;
        Update: Partial<WaitlistInsert>;
        Relationships: [];
      };
      feedback: {
        Row: Feedback;
        Insert: FeedbackInsert;
        Update: Partial<FeedbackInsert>;
        Relationships: [];
      };
      webhook_configs: {
        Row: WebhookConfig;
        Insert: WebhookConfigInsert;
        Update: Partial<WebhookConfigInsert>;
        Relationships: [];
      };
      email_templates: {
        Row: EmailTemplate;
        Insert: EmailTemplateInsert;
        Update: Partial<EmailTemplateInsert>;
        Relationships: [];
      };
      api_keys: {
        Row: ApiKey;
        Insert: ApiKeyInsert;
        Update: Partial<ApiKeyInsert>;
        Relationships: [];
      };
      social_posts: {
        Row: SocialPost;
        Insert: SocialPostInsert;
        Update: Partial<SocialPostInsert>;
        Relationships: [];
      };
      social_accounts: {
        Row: SocialAccount;
        Insert: SocialAccountInsert;
        Update: Partial<SocialAccountInsert>;
        Relationships: [];
      };
      brand_preferences: {
        Row: BrandPreference;
        Insert: BrandPreferenceInsert;
        Update: Partial<BrandPreferenceInsert>;
        Relationships: [];
      };
      social_analytics: {
        Row: SocialAnalytics;
        Insert: SocialAnalyticsInsert;
        Update: Partial<SocialAnalyticsInsert>;
        Relationships: [
          { foreignKeyName: "social_analytics_post_id_fkey"; columns: ["post_id"]; isOneToOne: false; referencedRelation: "social_posts"; referencedColumns: ["id"] }
        ];
      };
      post_queue: {
        Row: PostQueue;
        Insert: PostQueueInsert;
        Update: Partial<PostQueueInsert>;
        Relationships: [
          { foreignKeyName: "post_queue_post_id_fkey"; columns: ["post_id"]; isOneToOne: false; referencedRelation: "social_posts"; referencedColumns: ["id"] }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
