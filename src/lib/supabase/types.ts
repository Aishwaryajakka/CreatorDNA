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
      content_items: {
        Relationships: [];
        Row: {
          id: string;
          title: string;
          platform: string | null;
          published_at: string | null;
          raw_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          platform?: string | null;
          published_at?: string | null;
          raw_text: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["content_items"]["Insert"]
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
