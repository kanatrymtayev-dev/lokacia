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
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          phone?: string | null;
          role?: "host" | "renter";
          avatar_url?: string | null;
        };
        Update: {
          name?: string;
          phone?: string | null;
          role?: "host" | "renter";
          avatar_url?: string | null;
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
        };
        Update: {
          status?: "pending" | "confirmed" | "rejected" | "completed" | "cancelled";
        };
      };
      reviews: {
        Row: {
          id: string;
          listing_id: string;
          author_id: string;
          rating: number;
          text: string;
          created_at: string;
        };
        Insert: {
          listing_id: string;
          author_id: string;
          rating: number;
          text: string;
        };
        Update: {
          rating?: number;
          text?: string;
        };
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
