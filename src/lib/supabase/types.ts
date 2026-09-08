import type { DnaKind } from "@/lib/creator-dna/types";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      oauth_states: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          provider: "linkedin" | "x";
          state_hash: string;
          pkce_verifier_encrypted: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: "linkedin" | "x";
          state_hash: string;
          pkce_verifier_encrypted?: string | null;
          expires_at: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["oauth_states"]["Insert"]>;
      };
      social_connections: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          provider: "linkedin" | "x";
          provider_user_id: string | null;
          provider_username: string | null;
          provider_display_name: string | null;
          provider_avatar_url: string | null;
          scopes: Json;
          access_token_encrypted: string;
          refresh_token_encrypted: string | null;
          access_token_expires_at: string | null;
          metadata: Json;
          connected_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: "linkedin" | "x";
          provider_user_id?: string | null;
          provider_username?: string | null;
          provider_display_name?: string | null;
          provider_avatar_url?: string | null;
          scopes?: Json;
          access_token_encrypted: string;
          refresh_token_encrypted?: string | null;
          access_token_expires_at?: string | null;
          metadata?: Json;
          connected_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["social_connections"]["Insert"]
        >;
      };
      brand_territories: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          name: string;
          normalized_name: string;
          description: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          normalized_name: string;
          description?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["brand_territories"]["Insert"]
        >;
      };
      profiles: {
        Relationships: [];
        Row: {
          id: string;
          username: string;
          display_name: string;
          created_at: string;
          updated_at: string;
          profile_changed_at: string | null;
          onboarding_completed: boolean;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          created_at?: string;
          updated_at?: string;
          profile_changed_at?: string | null;
          onboarding_completed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      content_items: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          platform: string | null;
          external_source: string | null;
          external_id: string | null;
          external_url: string | null;
          published_at: string | null;
          raw_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          platform?: string | null;
          external_source?: string | null;
          external_id?: string | null;
          external_url?: string | null;
          published_at?: string | null;
          raw_text: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["content_items"]["Insert"]
        >;
      };
      content_item_playlists: {
        Relationships: [];
        Row: {
          content_id: string;
          playlist_id: string;
          playlist_title: string;
          playlist_position: number | null;
          created_at: string;
        };
        Insert: {
          content_id: string;
          playlist_id: string;
          playlist_title: string;
          playlist_position?: number | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["content_item_playlists"]["Insert"]
        >;
      };
      dna_nodes: {
        Relationships: [];
        Row: {
          id: string;
          content_id: string | null;
          type: DnaKind;
          label: string;
          summary: string;
          evidence_quote: string | null;
          confidence: number | null;
          source_title: string | null;
          source_date: string | null;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_id?: string | null;
          type: DnaKind;
          label: string;
          summary: string;
          evidence_quote?: string | null;
          confidence?: number | null;
          source_title?: string | null;
          source_date?: string | null;
          embedding?: number[] | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dna_nodes"]["Insert"]>;
      };
      dna_edges: {
        Relationships: [];
        Row: {
          id: string;
          source_node_id: string;
          target_node_id: string;
          relationship: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_node_id: string;
          target_node_id: string;
          relationship: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dna_edges"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_dna_nodes: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
          match_user_id: string;
        };
        Returns: Array<{
          id: string;
          content_id: string | null;
          type: DnaKind;
          label: string;
          summary: string;
          evidence_quote: string | null;
          confidence: number | null;
          source_title: string | null;
          source_date: string | null;
          similarity: number;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ContentItemRow =
  Database["public"]["Tables"]["content_items"]["Row"];
export type ContentItemInsert =
  Database["public"]["Tables"]["content_items"]["Insert"];
export type DnaNodeRow = Database["public"]["Tables"]["dna_nodes"]["Row"];
export type DnaNodeInsert = Database["public"]["Tables"]["dna_nodes"]["Insert"];
