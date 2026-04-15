export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          role: "host" | "renter";
          avatar_url: string | null;
          response_rate: number | null;
          response_time: string | null;
          avg_rating: number | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          phone?: string | null;
          role?: "host" | "renter";
          avatar_url?: string | null;
          response_rate?: number | null;
          response_time?: string | null;
          avg_rating?: number | null;
          email?: string | null;
        };
        Update: {
          name?: string;
          phone?: string | null;
          role?: "host" | "renter";
          avatar_url?: string | null;
          response_rate?: number | null;
          response_time?: string | null;
          avg_rating?: number | null;
          email?: string | null;
        };
      };
      listings: {
        Row: {
          id: string;
          host_id: string;
          title: string;
          slug: string;
          description: string;
          space_type: string;
          activity_types: string[];
          city: string;
          district: string;
          address: string;
          lat: number | null;
          lng: number | null;
          area: number;
          capacity: number;
          ceiling_height: number | null;
          price_per_hour: number;
          price_per_day: number | null;
          min_hours: number;
          images: string[];
          styles: string[];
          amenities: string[];
          rules: string[];
          allows_alcohol: boolean;
          allows_loud_music: boolean;
          allows_pets: boolean;
          allows_smoking: boolean;
          allows_food: boolean;
          rating: number;
          review_count: number;
          instant_book: boolean;
          superhost: boolean;
          pricing_tiers: Array<{ max_guests: number; price_per_hour: number }>;
          add_ons: Array<{ id: string; name: string; price: number; charge_type: "flat" | "per_hour" }>;
          featured_until: string | null;
          status: "active" | "draft" | "moderation" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          host_id: string;
          title: string;
          slug: string;
          description: string;
          space_type: string;
          activity_types: string[];
          city: string;
          district: string;
          address: string;
          lat?: number | null;
          lng?: number | null;
          area: number;
          capacity: number;
          ceiling_height?: number | null;
          price_per_hour: number;
          price_per_day?: number | null;
          min_hours?: number;
          images?: string[];
          styles?: string[];
          amenities?: string[];
          rules?: string[];
          allows_alcohol?: boolean;
          allows_loud_music?: boolean;
          allows_pets?: boolean;
          allows_smoking?: boolean;
          allows_food?: boolean;
          pricing_tiers?: Array<{ max_guests: number; price_per_hour: number }>;
          add_ons?: Array<{ id: string; name: string; price: number; charge_type: "flat" | "per_hour" }>;
          status?: "active" | "draft" | "moderation" | "archived";
        };
        Update: Partial<Database["public"]["Tables"]["listings"]["Insert"]>;
      };
      bookings: {
        Row: {
          id: string;
          listing_id: string;
          renter_id: string;
          date: string;
          start_time: string;
          end_time: string;
          guest_count: number;
          activity_type: string;
          description: string | null;
          total_price: number;
          status: "pending" | "confirmed" | "rejected" | "completed" | "cancelled";
          conversation_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          listing_id: string;
          renter_id: string;
          date: string;
          start_time: string;
          end_time: string;
          guest_count: number;
          activity_type: string;
          description?: string | null;
          total_price: number;
          status?: "pending" | "confirmed" | "rejected" | "completed" | "cancelled";
          conversation_id?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: {
          status?: "pending" | "confirmed" | "rejected" | "completed" | "cancelled";
          conversation_id?: string | null;
          metadata?: Record<string, unknown>;
        };
      };
      conversations: {
        Row: {
          id: string;
          listing_id: string | null;
          guest_id: string;
          host_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id?: string | null;
          guest_id: string;
          host_id: string;
        };
        Update: {
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_read: boolean;
          type: "text" | "system" | "quote";
          booking_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_read?: boolean;
          type?: "text" | "system" | "quote";
          booking_id?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: {
          is_read?: boolean;
          content?: string;
          metadata?: Record<string, unknown>;
        };
      };
      listing_blackouts: {
        Row: {
          id: string;
          listing_id: string;
          start_date: string;
          end_date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          start_date: string;
          end_date: string;
          reason?: string | null;
        };
        Update: {
          start_date?: string;
          end_date?: string;
          reason?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          listing_id: string;
          author_id: string;
          booking_id: string | null;
          target_type: "listing" | "guest";
          target_user_id: string | null;
          rating: number;
          text: string;
          created_at: string;
        };
        Insert: {
          listing_id: string;
          author_id: string;
          booking_id?: string | null;
          target_type?: "listing" | "guest";
          target_user_id?: string | null;
          rating: number;
          text: string;
        };
        Update: {
          rating?: number;
          text?: string;
        };
      };
      listing_views: {
        Row: {
          id: string;
          listing_id: string;
          viewer_id: string | null;
          viewed_at: string;
        };
        Insert: {
          listing_id: string;
          viewer_id?: string | null;
        };
        Update: never;
      };
      favorites: {
        Row: {
          user_id: string;
          listing_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          listing_id: string;
        };
        Update: never;
      };
      host_applications: {
        Row: {
          id: string;
          name: string;
          phone: string;
          city: string;
          space_type: string;
          area: number | null;
          description: string | null;
          status: "new" | "contacted" | "onboarded" | "rejected";
          created_at: string;
        };
        Insert: {
          name: string;
          phone: string;
          city: string;
          space_type: string;
          area?: number | null;
          description?: string | null;
        };
        Update: {
          status?: "new" | "contacted" | "onboarded" | "rejected";
        };
      };
    };
  };
}
