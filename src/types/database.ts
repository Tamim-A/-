/**
 * Supabase Database type definitions.
 *
 * In production you can auto-generate this file with:
 *   npx supabase gen types typescript --project-id YOUR_ID > src/types/database.ts
 *
 * This hand-written version matches our migration schema and
 * provides full type safety until codegen is configured.
 */

export type UserRole = "admin" | "staff" | "viewer";
export type BeneficiaryStatus = "active" | "inactive" | "archived";
export type AuditAction =
  | "create_beneficiary"
  | "update_beneficiary"
  | "archive_beneficiary"
  | "import_beneficiaries"
  | "export_beneficiaries"
  | "create_user"
  | "update_user";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: UserRole;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          email?: string;
          role?: UserRole;
          is_active?: boolean;
        };
        Relationships: [];
      };
      beneficiaries: {
        Row: {
          id: string;
          national_id: string;
          full_name: string;
          phone: string;
          city: string;
          support_amount: number;
          notes: string | null;
          status: BeneficiaryStatus;
          source: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          national_id: string;
          full_name: string;
          phone: string;
          city: string;
          support_amount: number;
          notes?: string | null;
          status?: BeneficiaryStatus;
          source?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
          archived_at?: string | null;
        };
        Update: {
          national_id?: string;
          full_name?: string;
          phone?: string;
          city?: string;
          support_amount?: number;
          notes?: string | null;
          status?: BeneficiaryStatus;
          source?: string;
          updated_by?: string | null;
          archived_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "beneficiaries_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "beneficiaries_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      import_logs: {
        Row: {
          id: string;
          file_name: string;
          imported_by: string;
          imported_at: string;
          total_rows: number;
          success_rows: number;
          failed_rows: number;
          duplicate_rows: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          file_name: string;
          imported_by: string;
          imported_at?: string;
          total_rows: number;
          success_rows: number;
          failed_rows: number;
          duplicate_rows: number;
          notes?: string | null;
        };
        Update: {
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "import_logs_imported_by_fkey";
            columns: ["imported_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: AuditAction;
          entity_type: string;
          entity_id: string | null;
          old_data: Record<string, unknown> | null;
          new_data: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: AuditAction;
          entity_type: string;
          entity_id?: string | null;
          old_data?: Record<string, unknown> | null;
          new_data?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      beneficiary_status: BeneficiaryStatus;
      audit_action: AuditAction;
    };
  };
}
