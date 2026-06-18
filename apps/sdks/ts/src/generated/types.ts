/**
 * API Types
 * AUTO-GENERATED - Do not edit manually
 *
 * Re-exports Database types copied from apps/api — used for optional typings in apps that need them.
 */

/**
 * API Types
 *
 * This file contains only the types exposed through the API.
 *
 * Generated from database.types.ts - only includes:
 * - Exposed enums (39 enums)
 * - Exposed tables (17 tables)
 * - Exposed functions (96 functions)
 *
 * DO NOT EDIT MANUALLY - This file is auto-generated
 * Run: npm run generate:api-types
 */

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
      accounts: {
        Row: {
          account_id: string;
          balance: number;
          created_at: string;
          currency_code: APIEnums['currency_code'];
          is_spi_account: boolean;
          organization_id: string;
          spi_account_balance: number | null;
          spi_account_balance_sync_error: string | null;
          spi_account_balance_synced_at: string | null;
          spi_account_number: string | null;
          spi_account_status: APIEnums['spi_account_status'] | null;
          spi_account_type: APIEnums['spi_account_type'] | null;
          updated_at: string;
        };
        Insert: {
          account_id?: string;
          balance?: number;
          created_at?: string;
          currency_code?: APIEnums['currency_code'];
          is_spi_account?: boolean;
          organization_id: string;
          spi_account_balance?: number | null;
          spi_account_balance_sync_error?: string | null;
          spi_account_balance_synced_at?: string | null;
          spi_account_number?: string | null;
          spi_account_status?: APIEnums['spi_account_status'] | null;
          spi_account_type?: APIEnums['spi_account_type'] | null;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          balance?: number;
          created_at?: string;
          currency_code?: APIEnums['currency_code'];
          is_spi_account?: boolean;
          organization_id?: string;
          spi_account_balance?: number | null;
          spi_account_balance_sync_error?: string | null;
          spi_account_balance_synced_at?: string | null;
          spi_account_number?: string | null;
          spi_account_status?: APIEnums['spi_account_status'] | null;
          spi_account_type?: APIEnums['spi_account_type'] | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'accounts_currency_code_fkey';
            columns: ['currency_code'];
            isOneToOne: false;
            referencedRelation: 'currencies';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'merchant_accounts_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['organization_id'];
          },
        ];
      };
      organizations: {
        Row: {
          arr: number;
          created_at: string;
          default_currency: APIEnums['currency_code'];
          deleted_at: string | null;
          email: string;
          employee_number: string | null;
          industry: string | null;
          is_deleted: boolean;
          is_starter_business: boolean;
          logo_url: string | null;
          merchant_lifetime_value: number;
          metadata: Json | null;
          mrr: number;
          name: string;
          organization_id: string;
          payout_pin_set_at: string | null;
          phone_number: string;
          pin_code_hash: string | null;
          pricing_plan_last_changed_at: string | null;
          pricing_plan_type: APIEnums['pricing_plan_type'] | null;
          slug: string | null;
          status: APIEnums['organization_status'];
          storefront_enabled: boolean;
          total_customers: number | null;
          total_merchants: number | null;
          total_revenue: number | null;
          total_transactions: number | null;
          updated_at: string;
          verification_status: APIEnums['organization_verification_status'];
          website_url: string | null;
          whatsapp_number: string | null;
        };
        Insert: {
          arr?: number;
          created_at?: string;
          default_currency?: APIEnums['currency_code'];
          deleted_at?: string | null;
          email: string;
          employee_number?: string | null;
          industry?: string | null;
          is_deleted?: boolean;
          is_starter_business?: boolean;
          logo_url?: string | null;
          merchant_lifetime_value?: number;
          metadata?: Json | null;
          mrr?: number;
          name: string;
          organization_id?: string;
          payout_pin_set_at?: string | null;
          phone_number: string;
          pin_code_hash?: string | null;
          pricing_plan_last_changed_at?: string | null;
          pricing_plan_type?: APIEnums['pricing_plan_type'] | null;
          slug?: string | null;
          status?: APIEnums['organization_status'];
          storefront_enabled?: boolean;
          total_customers?: number | null;
          total_merchants?: number | null;
          total_revenue?: number | null;
          total_transactions?: number | null;
          updated_at?: string;
          verification_status?: APIEnums['organization_verification_status'];
          website_url?: string | null;
          whatsapp_number?: string | null;
        };
        Update: {
          arr?: number;
          created_at?: string;
          default_currency?: APIEnums['currency_code'];
          deleted_at?: string | null;
          email?: string;
          employee_number?: string | null;
          industry?: string | null;
          is_deleted?: boolean;
          is_starter_business?: boolean;
          logo_url?: string | null;
          merchant_lifetime_value?: number;
          metadata?: Json | null;
          mrr?: number;
          name?: string;
          organization_id?: string;
          payout_pin_set_at?: string | null;
          phone_number?: string;
          pin_code_hash?: string | null;
          pricing_plan_last_changed_at?: string | null;
          pricing_plan_type?: APIEnums['pricing_plan_type'] | null;
          slug?: string | null;
          status?: APIEnums['organization_status'];
          storefront_enabled?: boolean;
          total_customers?: number | null;
          total_merchants?: number | null;
          total_revenue?: number | null;
          total_transactions?: number | null;
          updated_at?: string;
          verification_status?: APIEnums['organization_verification_status'];
          website_url?: string | null;
          whatsapp_number?: string | null;
        };
        Relationships: [];
      };
      merchants: {
        Row: {
          avatar_url: string | null;
          country: string | null;
          created_at: string;
          deleted_at: string | null;
          email: string;
          is_deleted: boolean;
          merchant_id: string;
          metadata: Json | null;
          name: string | null;
          onboarded: boolean;
          onboarding_status: APIEnums['onboarding_status'];
          phone_number: string | null;
          preferred_language: string;
          referral_code: string | null;
          retry_payment_every: number | null;
          subscription_notifications: Json | null;
          timezone: string;
          total_retries: number | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          country?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email: string;
          is_deleted?: boolean;
          merchant_id?: string;
          metadata?: Json | null;
          name?: string | null;
          onboarded?: boolean;
          onboarding_status?: APIEnums['onboarding_status'];
          phone_number?: string | null;
          preferred_language?: string;
          referral_code?: string | null;
          retry_payment_every?: number | null;
          subscription_notifications?: Json | null;
          timezone?: string;
          total_retries?: number | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          country?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email?: string;
          is_deleted?: boolean;
          merchant_id?: string;
          metadata?: Json | null;
          name?: string | null;
          onboarded?: boolean;
          onboarding_status?: APIEnums['onboarding_status'];
          phone_number?: string | null;
          preferred_language?: string;
          referral_code?: string | null;
          retry_payment_every?: number | null;
          subscription_notifications?: Json | null;
          timezone?: string;
          total_retries?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          address: string | null;
          city: string | null;
          country: string | null;
          created_at: string;
          created_by: string | null;
          customer_id: string;
          deleted_at: string | null;
          email: string | null;
          environment: string;
          is_business: boolean;
          is_deleted: boolean;
          metadata: Json | null;
          name: string;
          organization_id: string;
          phone_number: string | null;
          postal_code: string | null;
          provider_customer_id: string | null;
          spi_alias_mbno: string | null;
          spi_alias_shid: string | null;
          spi_primary_alias: string | null;
          updated_at: string;
          whatsapp_number: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string;
          deleted_at?: string | null;
          email?: string | null;
          environment?: string;
          is_business?: boolean;
          is_deleted?: boolean;
          metadata?: Json | null;
          name: string;
          organization_id: string;
          phone_number?: string | null;
          postal_code?: string | null;
          provider_customer_id?: string | null;
          spi_alias_mbno?: string | null;
          spi_alias_shid?: string | null;
          spi_primary_alias?: string | null;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string;
          deleted_at?: string | null;
          email?: string | null;
          environment?: string;
          is_business?: boolean;
          is_deleted?: boolean;
          metadata?: Json | null;
          name?: string;
          organization_id?: string;
          phone_number?: string | null;
          postal_code?: string | null;
          provider_customer_id?: string | null;
          spi_alias_mbno?: string | null;
          spi_alias_shid?: string | null;
          spi_primary_alias?: string | null;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'customers_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'merchants';
            referencedColumns: ['merchant_id'];
          },
          {
            foreignKeyName: 'customers_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['organization_id'];
          },
          {
            foreignKeyName: 'fk_customers_spi_alias_shid';
            columns: ['spi_alias_shid'];
            isOneToOne: false;
            referencedRelation: 'spi_account_aliases';
            referencedColumns: ['alias_id'];
          },
        ];
      };
      payment_requests: {
        Row: {
          amount: number;
          created_at: string;
          created_by: string | null;
          currency_code: APIEnums['currency_code'];
          customer_id: string | null;
          description: string | null;
          environment: string;
          expiry_date: string;
          organization_id: string;
          payment_link: string | null;
          payment_reference: string | null;
          request_id: string;
          spi_account_number: string | null;
          spi_bulk_instruction_id: string | null;
          spi_confirmation: boolean;
          spi_date_envoi: string | null;
          spi_date_irrevocabilite: string | null;
          spi_date_limite_paiement: string | null;
          spi_date_limite_reponse: string | null;
          spi_date_rejet: string | null;
          spi_debit_differe: boolean;
          spi_end2end_id: string | null;
          spi_payeur_alias: string | null;
          spi_payeur_nom: string | null;
          spi_payeur_pays: string | null;
          spi_payment_request_category:
            | APIEnums['spi_payment_request_category']
            | null;
          spi_payment_status: APIEnums['spi_payment_status'] | null;
          spi_ref_doc_numero: string | null;
          spi_ref_doc_type: APIEnums['spi_document_type'] | null;
          spi_rejection_reason: APIEnums['spi_rejection_reason'] | null;
          spi_remise_amount: number | null;
          spi_remise_rate: number | null;
          spi_tx_id: string | null;
          status: APIEnums['transaction_status'];
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          created_by?: string | null;
          currency_code: APIEnums['currency_code'];
          customer_id?: string | null;
          description?: string | null;
          environment?: string;
          expiry_date: string;
          organization_id: string;
          payment_link?: string | null;
          payment_reference?: string | null;
          request_id?: string;
          spi_account_number?: string | null;
          spi_bulk_instruction_id?: string | null;
          spi_confirmation?: boolean;
          spi_date_envoi?: string | null;
          spi_date_irrevocabilite?: string | null;
          spi_date_limite_paiement?: string | null;
          spi_date_limite_reponse?: string | null;
          spi_date_rejet?: string | null;
          spi_debit_differe?: boolean;
          spi_end2end_id?: string | null;
          spi_payeur_alias?: string | null;
          spi_payeur_nom?: string | null;
          spi_payeur_pays?: string | null;
          spi_payment_request_category?:
            | APIEnums['spi_payment_request_category']
            | null;
          spi_payment_status?: APIEnums['spi_payment_status'] | null;
          spi_ref_doc_numero?: string | null;
          spi_ref_doc_type?: APIEnums['spi_document_type'] | null;
          spi_rejection_reason?: APIEnums['spi_rejection_reason'] | null;
          spi_remise_amount?: number | null;
          spi_remise_rate?: number | null;
          spi_tx_id?: string | null;
          status?: APIEnums['transaction_status'];
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          currency_code?: APIEnums['currency_code'];
          customer_id?: string | null;
          description?: string | null;
          environment?: string;
          expiry_date?: string;
          organization_id?: string;
          payment_link?: string | null;
          payment_reference?: string | null;
          request_id?: string;
          spi_account_number?: string | null;
          spi_bulk_instruction_id?: string | null;
          spi_confirmation?: boolean;
          spi_date_envoi?: string | null;
          spi_date_irrevocabilite?: string | null;
          spi_date_limite_paiement?: string | null;
          spi_date_limite_reponse?: string | null;
          spi_date_rejet?: string | null;
          spi_debit_differe?: boolean;
          spi_end2end_id?: string | null;
          spi_payeur_alias?: string | null;
          spi_payeur_nom?: string | null;
          spi_payeur_pays?: string | null;
          spi_payment_request_category?:
            | APIEnums['spi_payment_request_category']
            | null;
          spi_payment_status?: APIEnums['spi_payment_status'] | null;
          spi_ref_doc_numero?: string | null;
          spi_ref_doc_type?: APIEnums['spi_document_type'] | null;
          spi_rejection_reason?: APIEnums['spi_rejection_reason'] | null;
          spi_remise_amount?: number | null;
          spi_remise_rate?: number | null;
          spi_tx_id?: string | null;
          status?: APIEnums['transaction_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_requests_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'merchants';
            referencedColumns: ['merchant_id'];
          },
          {
            foreignKeyName: 'payment_requests_currency_code_fkey';
            columns: ['currency_code'];
            isOneToOne: false;
            referencedRelation: 'currencies';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'payment_requests_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['customer_id'];
          },
          {
            foreignKeyName: 'payment_requests_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['organization_id'];
          },
        ];
      };
      transactions: {
        Row: {
          available_at: string | null;
          checkout_session_id: string | null;
          created_at: string;
          currency_code: APIEnums['currency_code'];
          customer_id: string;
          description: string | null;
          discount_amount: number;
          environment: string;
          fee_amount: number;
          fee_structure_id: string | null;
          gross_amount: number;
          integration_source: APIEnums['integration_source'];
          is_bnpl: boolean;
          is_pos: boolean;
          metadata: Json | null;
          net_amount: number;
          organization_id: string;
          payment_method_code: APIEnums['payment_method_code'];
          price_id: string | null;
          product_id: string | null;
          provider_code: APIEnums['provider_code'];
          quantity: number;
          spi_account_number: string | null;
          spi_bulk_instruction_id: string | null;
          spi_date_envoi: string | null;
          spi_date_irrevocabilite: string | null;
          spi_discount_amount: number | null;
          spi_discount_rate: number | null;
          spi_end2end_id: string | null;
          spi_payment_category: APIEnums['spi_payment_category'] | null;
          spi_payment_flow_type: APIEnums['spi_payment_flow_type'] | null;
          spi_payment_status: APIEnums['spi_payment_status'] | null;
          spi_rejection_reason: APIEnums['spi_rejection_reason'] | null;
          spi_tx_id: string | null;
          status: APIEnums['transaction_status'];
          stripe_payment_intent_id: string | null;
          subscription_id: string | null;
          tier_fee_id: string | null;
          transaction_id: string;
          transaction_type: APIEnums['transaction_type'];
          updated_at: string;
        };
        Insert: {
          available_at?: string | null;
          checkout_session_id?: string | null;
          created_at?: string;
          currency_code?: APIEnums['currency_code'];
          customer_id: string;
          description?: string | null;
          discount_amount?: number;
          environment?: string;
          fee_amount: number;
          fee_structure_id?: string | null;
          gross_amount: number;
          integration_source?: APIEnums['integration_source'];
          is_bnpl?: boolean;
          is_pos?: boolean;
          metadata?: Json | null;
          net_amount: number;
          organization_id: string;
          payment_method_code: APIEnums['payment_method_code'];
          price_id?: string | null;
          product_id?: string | null;
          provider_code: APIEnums['provider_code'];
          quantity?: number;
          spi_account_number?: string | null;
          spi_bulk_instruction_id?: string | null;
          spi_date_envoi?: string | null;
          spi_date_irrevocabilite?: string | null;
          spi_discount_amount?: number | null;
          spi_discount_rate?: number | null;
          spi_end2end_id?: string | null;
          spi_payment_category?: APIEnums['spi_payment_category'] | null;
          spi_payment_flow_type?: APIEnums['spi_payment_flow_type'] | null;
          spi_payment_status?: APIEnums['spi_payment_status'] | null;
          spi_rejection_reason?: APIEnums['spi_rejection_reason'] | null;
          spi_tx_id?: string | null;
          status?: APIEnums['transaction_status'];
          stripe_payment_intent_id?: string | null;
          subscription_id?: string | null;
          tier_fee_id?: string | null;
          transaction_id?: string;
          transaction_type: APIEnums['transaction_type'];
          updated_at?: string;
        };
        Update: {
          available_at?: string | null;
          checkout_session_id?: string | null;
          created_at?: string;
          currency_code?: APIEnums['currency_code'];
          customer_id?: string;
          description?: string | null;
          discount_amount?: number;
          environment?: string;
          fee_amount?: number;
          fee_structure_id?: string | null;
          gross_amount?: number;
          integration_source?: APIEnums['integration_source'];
          is_bnpl?: boolean;
          is_pos?: boolean;
          metadata?: Json | null;
          net_amount?: number;
          organization_id?: string;
          payment_method_code?: APIEnums['payment_method_code'];
          price_id?: string | null;
          product_id?: string | null;
          provider_code?: APIEnums['provider_code'];
          quantity?: number;
          spi_account_number?: string | null;
          spi_bulk_instruction_id?: string | null;
          spi_date_envoi?: string | null;
          spi_date_irrevocabilite?: string | null;
          spi_discount_amount?: number | null;
          spi_discount_rate?: number | null;
          spi_end2end_id?: string | null;
          spi_payment_category?: APIEnums['spi_payment_category'] | null;
          spi_payment_flow_type?: APIEnums['spi_payment_flow_type'] | null;
          spi_payment_status?: APIEnums['spi_payment_status'] | null;
          spi_rejection_reason?: APIEnums['spi_rejection_reason'] | null;
          spi_tx_id?: string | null;
          status?: APIEnums['transaction_status'];
          stripe_payment_intent_id?: string | null;
          subscription_id?: string | null;
          tier_fee_id?: string | null;
          transaction_id?: string;
          transaction_type?: APIEnums['transaction_type'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_transactions_checkout_session';
            columns: ['checkout_session_id'];
            isOneToOne: false;
            referencedRelation: 'checkout_sessions';
            referencedColumns: ['checkout_session_id'];
          },
          {
            foreignKeyName: 'transactions_currency_code_fkey';
            columns: ['currency_code'];
            isOneToOne: false;
            referencedRelation: 'currencies';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'transactions_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['customer_id'];
          },
          {
            foreignKeyName: 'transactions_fee_structure_id_fkey';
            columns: ['fee_structure_id'];
            isOneToOne: false;
            referencedRelation: 'organization_fee_structure';
            referencedColumns: ['fee_structure_id'];
          },
          {
            foreignKeyName: 'transactions_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['organization_id'];
          },
          {
            foreignKeyName: 'transactions_payment_method_code_provider_code_fkey';
            columns: ['payment_method_code', 'provider_code'];
            isOneToOne: false;
            referencedRelation: 'payment_methods';
            referencedColumns: ['payment_method_code', 'provider_code'];
          },
          {
            foreignKeyName: 'transactions_price_id_fkey';
            columns: ['price_id'];
            isOneToOne: false;
            referencedRelation: 'prices';
            referencedColumns: ['price_id'];
          },
          {
            foreignKeyName: 'transactions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'transactions_provider_code_fkey';
            columns: ['provider_code'];
            isOneToOne: false;
            referencedRelation: 'providers';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'transactions_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'subscriptions';
            referencedColumns: ['subscription_id'];
          },
          {
            foreignKeyName: 'transactions_tier_fee_id_fkey';
            columns: ['tier_fee_id'];
            isOneToOne: false;
            referencedRelation: 'tier_fee_structure';
            referencedColumns: ['tier_fee_id'];
          },
        ];
      };
      refunds: {
        Row: {
          amount: number;
          created_at: string;
          environment: string;
          fee_amount: number;
          metadata: Json | null;
          reason: string | null;
          refund_id: string;
          refunded_amount: number;
          spi_account_number: string | null;
          spi_end2end_id: string | null;
          spi_fund_return_status: APIEnums['spi_payment_status'] | null;
          spi_motif_code: APIEnums['spi_rejection_reason'] | null;
          spi_rejection_reason: APIEnums['spi_rejection_reason'] | null;
          spi_retour_date_demande: string | null;
          spi_retour_date_irrevocabilite: string | null;
          spi_tx_id: string | null;
          status: APIEnums['refund_status'];
          transaction_id: string;
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          environment?: string;
          fee_amount?: number;
          metadata?: Json | null;
          reason?: string | null;
          refund_id?: string;
          refunded_amount: number;
          spi_account_number?: string | null;
          spi_end2end_id?: string | null;
          spi_fund_return_status?: APIEnums['spi_payment_status'] | null;
          spi_motif_code?: APIEnums['spi_rejection_reason'] | null;
          spi_rejection_reason?: APIEnums['spi_rejection_reason'] | null;
          spi_retour_date_demande?: string | null;
          spi_retour_date_irrevocabilite?: string | null;
          spi_tx_id?: string | null;
          status?: APIEnums['refund_status'];
          transaction_id: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          environment?: string;
          fee_amount?: number;
          metadata?: Json | null;
          reason?: string | null;
          refund_id?: string;
          refunded_amount?: number;
          spi_account_number?: string | null;
          spi_end2end_id?: string | null;
          spi_fund_return_status?: APIEnums['spi_payment_status'] | null;
          spi_motif_code?: APIEnums['spi_rejection_reason'] | null;
          spi_rejection_reason?: APIEnums['spi_rejection_reason'] | null;
          spi_retour_date_demande?: string | null;
          spi_retour_date_irrevocabilite?: string | null;
          spi_tx_id?: string | null;
          status?: APIEnums['refund_status'];
          transaction_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'refunds_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'transactions';
            referencedColumns: ['transaction_id'];
          },
        ];
      };
      products: {
        Row: {
          charge_day: number | null;
          continue_selling_when_out_of_stock: boolean | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          display_on_storefront: boolean;
          environment: string;
          failed_payment_action: APIEnums['failed_payment_action'] | null;
          first_payment_type: APIEnums['first_payment_type'] | null;
          image_type: string | null;
          images: string[] | null;
          inventory_quantity: number | null;
          is_active: boolean;
          metadata: Json | null;
          name: string;
          organization_id: string;
          product_id: string;
          product_type: APIEnums['product_type'];
          sku: string | null;
          track_inventory: boolean | null;
          trial_enabled: boolean;
          trial_period_days: number | null;
          updated_at: string;
          usage_aggregation: APIEnums['usage_aggregation'] | null;
          usage_unit: string | null;
        };
        Insert: {
          charge_day?: number | null;
          continue_selling_when_out_of_stock?: boolean | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          display_on_storefront?: boolean;
          environment?: string;
          failed_payment_action?: APIEnums['failed_payment_action'] | null;
          first_payment_type?: APIEnums['first_payment_type'] | null;
          image_type?: string | null;
          images?: string[] | null;
          inventory_quantity?: number | null;
          is_active?: boolean;
          metadata?: Json | null;
          name: string;
          organization_id: string;
          product_id?: string;
          product_type?: APIEnums['product_type'];
          sku?: string | null;
          track_inventory?: boolean | null;
          trial_enabled?: boolean;
          trial_period_days?: number | null;
          updated_at?: string;
          usage_aggregation?: APIEnums['usage_aggregation'] | null;
          usage_unit?: string | null;
        };
        Update: {
          charge_day?: number | null;
          continue_selling_when_out_of_stock?: boolean | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          display_on_storefront?: boolean;
          environment?: string;
          failed_payment_action?: APIEnums['failed_payment_action'] | null;
          first_payment_type?: APIEnums['first_payment_type'] | null;
          image_type?: string | null;
          images?: string[] | null;
          inventory_quantity?: number | null;
          is_active?: boolean;
          metadata?: Json | null;
          name?: string;
          organization_id?: string;
          product_id?: string;
          product_type?: APIEnums['product_type'];
          sku?: string | null;
          track_inventory?: boolean | null;
          trial_enabled?: boolean;
          trial_period_days?: number | null;
          updated_at?: string;
          usage_aggregation?: APIEnums['usage_aggregation'] | null;
          usage_unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'merchant_products_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['organization_id'];
          },
          {
            foreignKeyName: 'products_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'merchants';
            referencedColumns: ['merchant_id'];
          },
        ];
      };
      subscriptions: {
        Row: {
          created_at: string;
          created_by: string | null;
          customer_id: string;
          end_date: string | null;
          environment: string;
          metadata: Json | null;
          next_billing_date: string | null;
          organization_id: string;
          price_id: string | null;
          product_id: string;
          provider_payment_method_id: string | null;
          start_date: string;
          status: APIEnums['subscription_status'];
          subscription_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          customer_id: string;
          end_date?: string | null;
          environment?: string;
          metadata?: Json | null;
          next_billing_date?: string | null;
          organization_id: string;
          price_id?: string | null;
          product_id: string;
          provider_payment_method_id?: string | null;
          start_date: string;
          status?: APIEnums['subscription_status'];
          subscription_id?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          customer_id?: string;
          end_date?: string | null;
          environment?: string;
          metadata?: Json | null;
          next_billing_date?: string | null;
          organization_id?: string;
          price_id?: string | null;
          product_id?: string;
          provider_payment_method_id?: string | null;
          start_date?: string;
          status?: APIEnums['subscription_status'];
          subscription_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'merchant_subscriptions_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['customer_id'];
          },
          {
            foreignKeyName: 'merchant_subscriptions_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['organization_id'];
          },
          {
            foreignKeyName: 'subscriptions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'merchants';
            referencedColumns: ['merchant_id'];
          },
          {
            foreignKeyName: 'subscriptions_price_id_fkey';
            columns: ['price_id'];
            isOneToOne: false;
            referencedRelation: 'prices';
            referencedColumns: ['price_id'];
          },
          {
            foreignKeyName: 'subscriptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['product_id'];
          },
        ];
      };
      discount_coupons: {
        Row: {
          applies_to_product_types: APIEnums['product_type'][] | null;
          code: string;
          coupon_id: string;
          created_at: string;
          current_uses: number;
          customer_type: APIEnums['customer_type'];
          description: string | null;
          discount_fixed_amount: number | null;
          discount_percentage: number | null;
          discount_type: APIEnums['discount_type'];
          environment: string;
          expires_at: string | null;
          is_active: boolean;
          max_quantity_per_use: number | null;
          max_uses: number | null;
          organization_id: string;
          scope_type: string;
          updated_at: string;
          usage_frequency_limit: APIEnums['usage_frequency'];
          usage_limit_value: number | null;
          valid_from: string | null;
        };
        Insert: {
          applies_to_product_types?: APIEnums['product_type'][] | null;
          code: string;
          coupon_id?: string;
          created_at?: string;
          current_uses?: number;
          customer_type?: APIEnums['customer_type'];
          description?: string | null;
          discount_fixed_amount?: number | null;
          discount_percentage?: number | null;
          discount_type?: APIEnums['discount_type'];
          environment?: string;
          expires_at?: string | null;
          is_active?: boolean;
          max_quantity_per_use?: number | null;
          max_uses?: number | null;
          organization_id: string;
          scope_type?: string;
          updated_at?: string;
          usage_frequency_limit?: APIEnums['usage_frequency'];
          usage_limit_value?: number | null;
          valid_from?: string | null;
        };
        Update: {
          applies_to_product_types?: APIEnums['product_type'][] | null;
          code?: string;
          coupon_id?: string;
          created_at?: string;
          current_uses?: number;
          customer_type?: APIEnums['customer_type'];
          description?: string | null;
          discount_fixed_amount?: number | null;
          discount_percentage?: number | null;
          discount_type?: APIEnums['discount_type'];
          environment?: string;
          expires_at?: string | null;
          is_active?: boolean;
          max_quantity_per_use?: number | null;
          max_uses?: number | null;
          organization_id?: string;
          scope_type?: string;
          updated_at?: string;
          usage_frequency_limit?: APIEnums['usage_frequency'];
          usage_limit_value?: number | null;
          valid_from?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'discount_coupons_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['organization_id'];
          },
        ];
      };
      checkout_sessions: {
        Row: {
          allow_coupon_code: boolean;
          allow_quantity: boolean;
          amount: number;
          cancel_url: string | null;
          checkout_session_id: string;
          created_at: string;
          created_by: string | null;
          currency_code: APIEnums['currency_code'];
          customer_address: string | null;
          customer_city: string | null;
          customer_country: string | null;
          customer_email: string | null;
          customer_id: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          customer_postal_code: string | null;
          description: string | null;
          environment: string;
          expires_at: string;
          installment_plan_id: string | null;
          integration_source: APIEnums['integration_source'];
          is_pos: boolean;
          is_spi: boolean;
          metadata: Json | null;
          organization_id: string;
          payment_link_id: string | null;
          payment_request_id: string | null;
          price_id: string | null;
          product_id: string | null;
          qr_code_data: Json | null;
          qr_code_type: APIEnums['qr_code_type'] | null;
          quantity: number;
          require_billing_address: boolean;
          spi_account_number: string | null;
          spi_qr_code_id: string | null;
          status: APIEnums['checkout_session_status'];
          subscription_id: string | null;
          success_url: string | null;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          allow_coupon_code?: boolean;
          allow_quantity?: boolean;
          amount: number;
          cancel_url?: string | null;
          checkout_session_id?: string;
          created_at?: string;
          created_by?: string | null;
          currency_code: APIEnums['currency_code'];
          customer_address?: string | null;
          customer_city?: string | null;
          customer_country?: string | null;
          customer_email?: string | null;
          customer_id?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_postal_code?: string | null;
          description?: string | null;
          environment?: string;
          expires_at: string;
          installment_plan_id?: string | null;
          integration_source?: APIEnums['integration_source'];
          is_pos?: boolean;
          is_spi?: boolean;
          metadata?: Json | null;
          organization_id: string;
          payment_link_id?: string | null;
          payment_request_id?: string | null;
          price_id?: string | null;
          product_id?: string | null;
          qr_code_data?: Json | null;
          qr_code_type?: APIEnums['qr_code_type'] | null;
          quantity?: number;
          require_billing_address?: boolean;
          spi_account_number?: string | null;
          spi_qr_code_id?: string | null;
          status?: APIEnums['checkout_session_status'];
          subscription_id?: string | null;
          success_url?: string | null;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          allow_coupon_code?: boolean;
          allow_quantity?: boolean;
          amount?: number;
          cancel_url?: string | null;
          checkout_session_id?: string;
          created_at?: string;
          created_by?: string | null;
          currency_code?: APIEnums['currency_code'];
          customer_address?: string | null;
          customer_city?: string | null;
          customer_country?: string | null;
          customer_email?: string | null;
          customer_id?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_postal_code?: string | null;
          description?: string | null;
          environment?: string;
          expires_at?: string;
          installment_plan_id?: string | null;
          integration_source?: APIEnums['integration_source'];
          is_pos?: boolean;
          is_spi?: boolean;
          metadata?: Json | null;
          organization_id?: string;
          payment_link_id?: string | null;
          payment_request_id?: string | null;
          price_id?: string | null;
          product_id?: string | null;
          qr_code_data?: Json | null;
          qr_code_type?: APIEnums['qr_code_type'] | null;
          quantity?: number;
          require_billing_address?: boolean;
          spi_account_number?: string | null;
          spi_qr_code_id?: string | null;
          status?: APIEnums['checkout_session_status'];
          subscription_id?: string | null;
          success_url?: string | null;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'checkout_sessions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'merchants';
            referencedColumns: ['merchant_id'];
          },
          {
            foreignKeyName: 'checkout_sessions_currency_code_fkey';
            columns: ['currency_code'];
            isOneToOne: false;
            referencedRelation: 'currencies';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'checkout_sessions_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['customer_id'];
          },
          {
            foreignKeyName: 'checkout_sessions_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['organization_id'];
          },
          {
            foreignKeyName: 'checkout_sessions_payment_link_id_fkey';
            columns: ['payment_link_id'];
            isOneToOne: false;
            referencedRelation: 'payment_links';
            referencedColumns: ['link_id'];
          },
          {
            foreignKeyName: 'checkout_sessions_payment_request_id_fkey';
            columns: ['payment_request_id'];
            isOneToOne: false;
            referencedRelation: 'payment_requests';
            referencedColumns: ['request_id'];
          },
          {
            foreignKeyName: 'checkout_sessions_price_id_fkey';
            columns: ['price_id'];
            isOneToOne: false;
            referencedRelation: 'prices';
            referencedColumns: ['price_id'];
          },
          {
            foreignKeyName: 'checkout_sessions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'checkout_sessions_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'subscriptions';
            referencedColumns: ['subscription_id'];
          },
          {
            foreignKeyName: 'fk_checkout_sessions_installment_plan';
            columns: ['installment_plan_id'];
            isOneToOne: false;
            referencedRelation: 'installment_plans';
            referencedColumns: ['plan_id'];
          },
          {
            foreignKeyName: 'fk_checkout_sessions_spi_qr_code_id';
            columns: ['spi_qr_code_id'];
            isOneToOne: false;
            referencedRelation: 'spi_qr_codes';
            referencedColumns: ['qr_code_id'];
          },
        ];
      };
      payment_links: {
        Row: {
          allow_coupon_code: boolean;
          allow_quantity: boolean;
          amount: number | null;
          cancel_url: string | null;
          created_at: string;
          created_by: string | null;
          currency_code: APIEnums['currency_code'];
          description: string | null;
          environment: string;
          expires_at: string | null;
          is_active: boolean;
          link_id: string;
          link_type: APIEnums['link_type'];
          metadata: Json | null;
          organization_id: string;
          price_id: string | null;
          product_id: string | null;
          quantity: number;
          require_billing_address: boolean;
          success_url: string | null;
          title: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          allow_coupon_code?: boolean;
          allow_quantity?: boolean;
          amount?: number | null;
          cancel_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency_code: APIEnums['currency_code'];
          description?: string | null;
          environment?: string;
          expires_at?: string | null;
          is_active?: boolean;
          link_id?: string;
          link_type: APIEnums['link_type'];
          metadata?: Json | null;
          organization_id: string;
          price_id?: string | null;
          product_id?: string | null;
          quantity?: number;
          require_billing_address?: boolean;
          success_url?: string | null;
          title: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          allow_coupon_code?: boolean;
          allow_quantity?: boolean;
          amount?: number | null;
          cancel_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency_code?: APIEnums['currency_code'];
          description?: string | null;
          environment?: string;
          expires_at?: string | null;
          is_active?: boolean;
          link_id?: string;
          link_type?: APIEnums['link_type'];
          metadata?: Json | null;
          organization_id?: string;
          price_id?: string | null;
          product_id?: string | null;
          quantity?: number;
          require_billing_address?: boolean;
          success_url?: string | null;
          title?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_links_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'merchants';
            referencedColumns: ['merchant_id'];
          },
          {
            foreignKeyName: 'payment_links_currency_code_fkey';
            columns: ['currency_code'];
            isOneToOne: false;
            referencedRelation: 'currencies';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'payment_links_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['organization_id'];
          },
          {
            foreignKeyName: 'payment_links_price_id_fkey';
            columns: ['price_id'];
            isOneToOne: false;
            referencedRelation: 'prices';
            referencedColumns: ['price_id'];
          },
          {
            foreignKeyName: 'payment_links_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['product_id'];
          },
        ];
      };
      payouts: {
        Row: {
          account_id: string;
          amount: number;
          created_at: string;
          created_by: string | null;
          currency_code: APIEnums['currency_code'];
          environment: string;
          metadata: Json | null;
          organization_id: string;
          payment_method_code: APIEnums['payment_method_code'] | null;
          payout_id: string;
          payout_method_id: string | null;
          provider_code: APIEnums['provider_code'] | null;
          status: APIEnums['payout_status'];
          updated_at: string;
        };
        Insert: {
          account_id: string;
          amount: number;
          created_at?: string;
          created_by?: string | null;
          currency_code: APIEnums['currency_code'];
          environment?: string;
          metadata?: Json | null;
          organization_id: string;
          payment_method_code?: APIEnums['payment_method_code'] | null;
          payout_id?: string;
          payout_method_id?: string | null;
          provider_code?: APIEnums['provider_code'] | null;
          status?: APIEnums['payout_status'];
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          currency_code?: APIEnums['currency_code'];
          environment?: string;
          metadata?: Json | null;
          organization_id?: string;
          payment_method_code?: APIEnums['payment_method_code'] | null;
          payout_id?: string;
          payout_method_id?: string | null;
          provider_code?: APIEnums['provider_code'] | null;
          status?: APIEnums['payout_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payouts_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['account_id'];
          },
          {
            foreignKeyName: 'payouts_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'merchant_balance_summary';
            referencedColumns: ['account_id'];
          },
          {
            foreignKeyName: 'payouts_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'merchants';
            referencedColumns: ['merchant_id'];
          },
          {
            foreignKeyName: 'payouts_currency_code_fkey';
            columns: ['currency_code'];
            isOneToOne: false;
            referencedRelation: 'currencies';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'payouts_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['organization_id'];
          },
          {
            foreignKeyName: 'payouts_payout_method_id_fkey';
            columns: ['payout_method_id'];
            isOneToOne: false;
            referencedRelation: 'payout_methods';
            referencedColumns: ['payout_method_id'];
          },
        ];
      };
      beneficiary_payouts: {
        Row: {
          account_id: string;
          amount: number;
          created_at: string;
          created_by: string | null;
          currency_code: APIEnums['currency_code'];
          metadata: Json | null;
          organization_id: string;
          payment_method_code: APIEnums['payment_method_code'] | null;
          payout_id: string;
          payout_method_id: string | null;
          provider_code: APIEnums['provider_code'] | null;
          spi_bulk_instruction_id: string | null;
          status: APIEnums['payout_status'];
          updated_at: string;
        };
        Insert: {
          account_id: string;
          amount: number;
          created_at?: string;
          created_by?: string | null;
          currency_code: APIEnums['currency_code'];
          metadata?: Json | null;
          organization_id: string;
          payment_method_code?: APIEnums['payment_method_code'] | null;
          payout_id?: string;
          payout_method_id?: string | null;
          provider_code?: APIEnums['provider_code'] | null;
          spi_bulk_instruction_id?: string | null;
          status?: APIEnums['payout_status'];
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          currency_code?: APIEnums['currency_code'];
          metadata?: Json | null;
          organization_id?: string;
          payment_method_code?: APIEnums['payment_method_code'] | null;
          payout_id?: string;
          payout_method_id?: string | null;
          provider_code?: APIEnums['provider_code'] | null;
          spi_bulk_instruction_id?: string | null;
          status?: APIEnums['payout_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'beneficiary_payouts_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['account_id'];
          },
          {
            foreignKeyName: 'beneficiary_payouts_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'merchant_balance_summary';
            referencedColumns: ['account_id'];
          },
          {
            foreignKeyName: 'beneficiary_payouts_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'merchants';
            referencedColumns: ['merchant_id'];
          },
          {
            foreignKeyName: 'beneficiary_payouts_currency_code_fkey';
            columns: ['currency_code'];
            isOneToOne: false;
            referencedRelation: 'currencies';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'beneficiary_payouts_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['organization_id'];
          },
          {
            foreignKeyName: 'beneficiary_payouts_payout_method_id_fkey';
            columns: ['payout_method_id'];
            isOneToOne: false;
            referencedRelation: 'payout_methods';
            referencedColumns: ['payout_method_id'];
          },
        ];
      };
      providers: {
        Row: {
          code: APIEnums['provider_code'];
          description: string | null;
          name: string;
        };
        Insert: {
          code: APIEnums['provider_code'];
          description?: string | null;
          name: string;
        };
        Update: {
          code?: APIEnums['provider_code'];
          description?: string | null;
          name?: string;
        };
        Relationships: [];
      };
      webhooks: {
        Row: {
          authorized_events: APIEnums['webhook_event'][];
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          environment: string;
          is_active: boolean;
          last_payload: Json | null;
          last_response_body: string | null;
          last_response_status: number | null;
          last_triggered_at: string | null;
          metadata: Json | null;
          organization_id: string;
          retry_count: number | null;
          spi_event_types: string[] | null;
          supports_spi: boolean;
          updated_at: string;
          url: string;
          verification_token: string;
          webhook_id: string;
        };
        Insert: {
          authorized_events?: APIEnums['webhook_event'][];
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          environment?: string;
          is_active?: boolean;
          last_payload?: Json | null;
          last_response_body?: string | null;
          last_response_status?: number | null;
          last_triggered_at?: string | null;
          metadata?: Json | null;
          organization_id: string;
          retry_count?: number | null;
          spi_event_types?: string[] | null;
          supports_spi?: boolean;
          updated_at?: string;
          url: string;
          verification_token: string;
          webhook_id?: string;
        };
        Update: {
          authorized_events?: APIEnums['webhook_event'][];
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          environment?: string;
          is_active?: boolean;
          last_payload?: Json | null;
          last_response_body?: string | null;
          last_response_status?: number | null;
          last_triggered_at?: string | null;
          metadata?: Json | null;
          organization_id?: string;
          retry_count?: number | null;
          spi_event_types?: string[] | null;
          supports_spi?: boolean;
          updated_at?: string;
          url?: string;
          verification_token?: string;
          webhook_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'webhooks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'merchants';
            referencedColumns: ['merchant_id'];
          },
          {
            foreignKeyName: 'webhooks_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['organization_id'];
          },
        ];
      };
      webhook_delivery_logs: {
        Row: {
          amount: number | null;
          attempt_number: number;
          compte_paye: string | null;
          compte_payeur: string | null;
          created_at: string;
          event_type: string;
          headers: Json | null;
          ip_address: string | null;
          log_id: string;
          organization_id: string;
          payload: Json;
          request_duration_ms: number | null;
          response_body: string | null;
          response_status: number | null;
          spi_event_code: APIEnums['spi_webhook_event_code'] | null;
          spi_tx_id: string | null;
          success: boolean;
          user_agent: string | null;
          webhook_id: string;
        };
        Insert: {
          amount?: number | null;
          attempt_number?: number;
          compte_paye?: string | null;
          compte_payeur?: string | null;
          created_at?: string;
          event_type: string;
          headers?: Json | null;
          ip_address?: string | null;
          log_id?: string;
          organization_id: string;
          payload: Json;
          request_duration_ms?: number | null;
          response_body?: string | null;
          response_status?: number | null;
          spi_event_code?: APIEnums['spi_webhook_event_code'] | null;
          spi_tx_id?: string | null;
          success?: boolean;
          user_agent?: string | null;
          webhook_id: string;
        };
        Update: {
          amount?: number | null;
          attempt_number?: number;
          compte_paye?: string | null;
          compte_payeur?: string | null;
          created_at?: string;
          event_type?: string;
          headers?: Json | null;
          ip_address?: string | null;
          log_id?: string;
          organization_id?: string;
          payload?: Json;
          request_duration_ms?: number | null;
          response_body?: string | null;
          response_status?: number | null;
          spi_event_code?: APIEnums['spi_webhook_event_code'] | null;
          spi_tx_id?: string | null;
          success?: boolean;
          user_agent?: string | null;
          webhook_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_webhook';
            columns: ['webhook_id'];
            isOneToOne: false;
            referencedRelation: 'webhooks';
            referencedColumns: ['webhook_id'];
          },
          {
            foreignKeyName: 'webhook_delivery_logs_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['organization_id'];
          },
          {
            foreignKeyName: 'webhook_delivery_logs_webhook_id_fkey';
            columns: ['webhook_id'];
            isOneToOne: false;
            referencedRelation: 'webhooks';
            referencedColumns: ['webhook_id'];
          },
        ];
      };
    };
    Functions: {
      fetch_balance_breakdown: {
        Args: {
          p_merchant_id: string;
          p_organization_id?: string | null;
          p_target_currency?: APIEnums['currency_code'] | null;
        };
        Returns: {
          available_balance: number;
          converted_available_balance: number;
          converted_pending_balance: number;
          converted_total_balance: number;
          converted_unavailable_balance: number;
          currency_code: APIEnums['currency_code'];
          pending_balance: number;
          target_currency: APIEnums['currency_code'];
          total_balance: number;
          unavailable_balance: number;
        }[];
      };
      fetch_account_balance: {
        Args: {
          p_currency_code?: string | null;
          p_merchant_id: string;
          p_organization_id: string;
        };
        Returns: {
          balance: number;
          currency_code: string;
          last_updated: string;
        }[];
      };
      list_accounts: {
        Args: {
          p_limit?: number | null;
          p_offset?: number | null;
          p_organization_id: string;
        };
        Returns: {
          account_id: string;
          balance: number;
          created_at: string;
          currency_code: APIEnums['currency_code'];
          is_spi_account: boolean;
          organization_id: string;
          spi_account_balance: number;
          spi_account_balance_sync_error: string;
          spi_account_balance_synced_at: string;
          spi_account_number: string;
          spi_account_status: APIEnums['spi_account_status'];
          spi_account_type: APIEnums['spi_account_type'];
          updated_at: string;
        }[];
      };
      get_account: {
        Args: { p_account_id: string; p_organization_id: string };
        Returns: {
          account_id: string;
          balance: number;
          created_at: string;
          currency_code: APIEnums['currency_code'];
          is_spi_account: boolean;
          organization_id: string;
          spi_account_balance: number;
          spi_account_balance_sync_error: string;
          spi_account_balance_synced_at: string;
          spi_account_number: string;
          spi_account_status: APIEnums['spi_account_status'];
          spi_account_type: APIEnums['spi_account_type'];
          updated_at: string;
        }[];
      };
      check_merchant_available_balance: {
        Args: {
          p_currency_code: APIEnums['currency_code'];
          p_merchant_id: string;
        };
        Returns: number;
      };
      verify_api_key: {
        Args: {
          p_api_key: string;
          p_endpoint: string;
          p_ip_address?: string | null;
          p_request_method?: string | null;
        };
        Returns: {
          environment: string;
          is_valid: boolean;
          merchant_id: string;
          message: string;
          organization_id: string;
          rate_limited: boolean;
        }[];
      };
      log_api_interaction: {
        Args: {
          p_api_key: string;
          p_endpoint: string;
          p_organization_id: string;
          p_request_method: string;
          p_request_payload?: Json | null;
          p_response_payload?: Json | null;
          p_response_status?: number | null;
          p_response_time?: number | null;
        };
        Returns: string;
      };
      list_organizations: {
        Args: { p_organization_id: string };
        Returns: {
          arr: number;
          created_at: string;
          default_currency: APIEnums['currency_code'];
          email: string;
          employee_number: string;
          has_payout_pin: boolean;
          industry: string;
          is_starter_business: boolean;
          logo_url: string;
          mrr: number;
          name: string;
          organization_id: string;
          phone_number: string;
          slug: string;
          status: string;
          storefront_enabled: boolean;
          total_customers: number;
          total_merchants: number;
          total_revenue: number;
          total_transactions: number;
          updated_at: string;
          verification_status: string;
          website_url: string;
        }[];
      };
      fetch_organization_details: {
        Args: { p_merchant_id: string; p_organization_id?: string };
        Returns: {
          arr: number;
          city: string;
          country: string;
          default_currency: APIEnums['currency_code'];
          district: string;
          email: string;
          has_payout_pin: boolean;
          logo_url: string;
          mrr: number;
          name: string;
          organization_id: string;
          postal_code: string;
          region: string;
          slug: string;
          storefront_enabled: boolean;
          street: string;
          total_customers: number;
          total_merchants: number;
          total_revenue: number;
          total_transactions: number;
          updated_at: string;
          verification_status: APIEnums['organization_verification_status'];
          website_url: string;
        }[];
      };
      fetch_customers_with_status: {
        Args: {
          p_activity_status?: string | null;
          p_customer_type?: string | null;
          p_environment?: string | null;
          p_limit?: number | null;
          p_merchant_id: string;
          p_offset?: number | null;
          p_organization_id?: string | null;
          p_search_term?: string | null;
        };
        Returns: {
          address: string;
          city: string;
          country: string;
          created_at: string;
          customer_id: string;
          email: string;
          has_transactions: boolean;
          is_business: boolean;
          name: string;
          phone_number: string;
          postal_code: string;
          total_count: number;
          updated_at: string;
          whatsapp_number: string;
        }[];
      };
      create_customer: {
        Args: {
          p_address?: string | null;
          p_city?: string | null;
          p_country?: string | null;
          p_email: string;
          p_environment?: string | null;
          p_is_business?: boolean | null;
          p_merchant_id: string;
          p_name: string;
          p_organization_id: string;
          p_phone_number?: string | null;
          p_postal_code?: string | null;
          p_whatsapp_number?: string | null;
        };
        Returns: string;
      };
      update_customer: {
        Args: {
          p_address?: string | null;
          p_city?: string | null;
          p_country?: string | null;
          p_customer_id: string;
          p_email: string;
          p_is_business?: boolean | null;
          p_name: string;
          p_phone_number?: string | null;
          p_postal_code?: string | null;
          p_whatsapp_number?: string | null;
        };
        Returns: undefined;
      };
      delete_customer: { Args: { p_customer_id: string }; Returns: undefined };
      fetch_customer_transactions: {
        Args: { p_customer_id: string; p_environment?: string };
        Returns: {
          created_at: string;
          currency_code: APIEnums['currency_code'];
          description: string;
          gross_amount: number;
          metadata: Json;
          payment_method_code: APIEnums['payment_method_code'];
          provider_code: APIEnums['provider_code'];
          status: string;
          transaction_id: string;
        }[];
      };
      create_or_update_customer: {
        Args: {
          p_address: string;
          p_city: string;
          p_country: string;
          p_custom_fields_metadata?: Json | null;
          p_email: string;
          p_merchant_id: string;
          p_name: string;
          p_organization_id: string;
          p_phone_number: string;
          p_postal_code: string;
          p_whatsapp_number: string;
        };
        Returns: string;
      };
      create_customer_portal_launch_session: {
        Args: {
          p_customer_id: string;
          p_environment?: string | null;
          p_flow_after_completion_url?: string | null;
          p_flow_subscription_id?: string | null;
          p_flow_type?: string | null;
          p_merchant_id: string;
          p_organization_id: string;
          p_return_url?: string | null;
        };
        Returns: {
          launch_token: string;
        }[];
      };
      merchant_list_customer_portal_audit_events: {
        Args: {
          p_customer_id?: string | null;
          p_event_type?: string | null;
          p_limit?: number | null;
          p_merchant_id: string;
          p_offset?: number | null;
          p_organization_id: string;
        };
        Returns: {
          created_at: string;
          customer_id: string;
          event_id: string;
          event_type: string;
          metadata: Json;
          organization_id: string;
          total_count: number;
        }[];
      };
      create_checkout_session: {
        Args: {
          p_allow_coupon_code?: boolean | null;
          p_allow_quantity?: boolean | null;
          p_amount: number;
          p_cancel_url?: string | null;
          p_created_by?: string | null;
          p_currency_code: APIEnums['currency_code'];
          p_customer_address?: string | null;
          p_customer_city?: string | null;
          p_customer_country?: string | null;
          p_customer_email?: string | null;
          p_customer_id?: string | null;
          p_customer_name?: string | null;
          p_customer_phone?: string | null;
          p_customer_postal_code?: string | null;
          p_description?: string | null;
          p_environment?: string | null;
          p_expiration_minutes?: number | null;
          p_idempotency_body_hash?: string | null;
          p_idempotency_key?: string | null;
          p_metadata?: Json | null;
          p_organization_id: string;
          p_payment_link_id?: string | null;
          p_price_id?: string | null;
          p_product_id?: string | null;
          p_quantity?: number | null;
          p_require_billing_address?: boolean | null;
          p_subscription_id?: string | null;
          p_success_url?: string | null;
          p_title?: string | null;
        };
        Returns: Json;
      };
      create_checkout_session_with_line_items: {
        Args: {
          p_allow_coupon_code?: boolean | null;
          p_cancel_url?: string | null;
          p_created_by: string;
          p_currency_code: APIEnums['currency_code'];
          p_customer_address?: string | null;
          p_customer_city?: string | null;
          p_customer_country?: string | null;
          p_customer_email?: string | null;
          p_customer_id?: string | null;
          p_customer_name?: string | null;
          p_customer_phone?: string | null;
          p_customer_postal_code?: string | null;
          p_description?: string | null;
          p_environment?: string | null;
          p_expiration_minutes?: number | null;
          p_idempotency_body_hash?: string | null;
          p_idempotency_key?: string | null;
          p_line_items: Json;
          p_metadata?: Json | null;
          p_organization_id: string;
          p_payment_link_id?: string | null;
          p_require_billing_address?: boolean | null;
          p_shipping_amount?: number | null;
          p_success_url?: string | null;
          p_tax_amount?: number | null;
          p_title?: string | null;
        };
        Returns: Json;
      };
      list_checkout_sessions: {
        Args: {
          p_limit?: number | null;
          p_merchant_id: string;
          p_offset?: number | null;
          p_status?: APIEnums['checkout_session_status'] | null;
        };
        Returns: {
          amount: number;
          cancel_url: string;
          checkout_session_id: string;
          created_at: string;
          currency_code: APIEnums['currency_code'];
          customer_email: string;
          customer_id: string;
          customer_name: string;
          customer_phone: string;
          description: string;
          expires_at: string;
          merchant_id: string;
          metadata: Json;
          organization_id: string;
          payment_link_id: string;
          product_id: string;
          status: APIEnums['checkout_session_status'];
          subscription_id: string;
          success_url: string;
          title: string;
          updated_at: string;
        }[];
      };
      get_checkout_session_api: {
        Args: { p_checkout_session_id: string; p_organization_id: string };
        Returns: {
          amount: number;
          cancel_url: string;
          checkout_session_id: string;
          created_at: string;
          currency_code: APIEnums['currency_code'];
          customer_email: string;
          customer_id: string;
          customer_name: string;
          customer_phone: string;
          description: string;
          expires_at: string;
          merchant_id: string;
          metadata: Json;
          organization_id: string;
          payment_link_id: string;
          product_id: string;
          status: APIEnums['checkout_session_status'];
          subscription_id: string;
          success_url: string;
          title: string;
          updated_at: string;
        }[];
      };
      create_payment_link: {
        Args: {
          p_allow_coupon_code?: boolean | null;
          p_allow_quantity?: boolean | null;
          p_cancel_url?: string | null;
          p_created_by?: string | null;
          p_currency_code: APIEnums['currency_code'];
          p_description?: string | null;
          p_environment?: string | null;
          p_expires_at?: string | null;
          p_line_items?: Json | null;
          p_link_type: APIEnums['link_type'];
          p_organization_id: string;
          p_price?: number | null;
          p_price_id?: string | null;
          p_product_id?: string | null;
          p_require_billing_address?: boolean | null;
          p_success_url?: string | null;
          p_title: string;
        };
        Returns: string;
      };
      list_payment_links: {
        Args: {
          p_is_active?: boolean | null;
          p_limit?: number | null;
          p_link_type?: string | null;
          p_offset?: number | null;
          p_organization_id: string;
        };
        Returns: {
          allow_coupon_code: boolean;
          allow_quantity: boolean;
          amount: number;
          cancel_url: string;
          created_at: string;
          created_by: string;
          currency_code: APIEnums['currency_code'];
          description: string;
          environment: string;
          expires_at: string;
          is_active: boolean;
          link_id: string;
          link_type: APIEnums['link_type'];
          metadata: Json;
          organization_id: string;
          price_id: string;
          product_id: string;
          quantity: number;
          require_billing_address: boolean;
          success_url: string;
          title: string;
          updated_at: string;
          url: string;
        }[];
      };
      get_payment_link_api: {
        Args: { p_link_id: string; p_organization_id: string };
        Returns: {
          allow_coupon_code: boolean;
          allow_quantity: boolean;
          amount: number;
          cancel_url: string;
          created_at: string;
          created_by: string;
          currency_code: APIEnums['currency_code'];
          description: string;
          environment: string;
          expires_at: string;
          is_active: boolean;
          line_items: Json;
          link_id: string;
          link_type: APIEnums['link_type'];
          metadata: Json;
          organization_id: string;
          price_id: string;
          product_id: string;
          quantity: number;
          require_billing_address: boolean;
          success_url: string;
          title: string;
          updated_at: string;
          url: string;
        }[];
      };
      create_payment_request_api: {
        Args: {
          p_amount: number;
          p_created_by: string;
          p_currency_code: APIEnums['currency_code'];
          p_customer_id: string;
          p_description: string;
          p_environment?: string | null;
          p_expiry_date: string;
          p_idempotency_body_hash?: string | null;
          p_idempotency_key?: string | null;
          p_organization_id: string;
          p_payment_reference: string;
        };
        Returns: {
          amount: number;
          created_at: string;
          created_by: string;
          currency_code: APIEnums['currency_code'];
          customer_id: string;
          description: string;
          environment: string;
          expiry_date: string;
          organization_id: string;
          payment_link: string;
          payment_reference: string;
          request_id: string;
          status: APIEnums['transaction_status'];
          updated_at: string;
        }[];
      };
      list_payment_requests: {
        Args: {
          p_customer_id?: string | null;
          p_limit?: number | null;
          p_offset?: number | null;
          p_organization_id: string;
          p_status?: string | null;
        };
        Returns: {
          amount: number;
          created_at: string;
          created_by: string;
          currency_code: APIEnums['currency_code'];
          customer_id: string;
          description: string;
          environment: string;
          expiry_date: string;
          metadata: Json;
          organization_id: string;
          payment_link: string;
          payment_reference: string;
          request_id: string;
          status: string;
          updated_at: string;
        }[];
      };
      get_payment_request_api: {
        Args: { p_organization_id: string; p_request_id: string };
        Returns: {
          amount: number;
          created_at: string;
          created_by: string;
          currency_code: APIEnums['currency_code'];
          customer_id: string;
          description: string;
          environment: string;
          expiry_date: string;
          metadata: Json;
          organization_id: string;
          payment_link: string;
          payment_reference: string;
          request_id: string;
          status: string;
          updated_at: string;
        }[];
      };
      prepare_stripe_payment_amount: {
        Args: { p_amount: number; p_currency: string };
        Returns: {
          original_amount_xof: number;
          rate_xof_to_eur: number;
          stripe_amount_cents: number;
          stripe_currency: string;
        }[];
      };
      create_stripe_transaction: {
        Args: {
          p_amount: number;
          p_checkout_session_id?: string | null;
          p_currency_code: APIEnums['currency_code'];
          p_customer_id: string;
          p_description?: string | null;
          p_environment?: string | null;
          p_merchant_id: string;
          p_metadata?: Json | null;
          p_organization_id: string;
          p_price_id?: string | null;
          p_product_id?: string | null;
          p_provider_transaction_id: string;
          p_quantity?: number | null;
          p_subscription_id?: string | null;
        };
        Returns: string;
      };
      fetch_products: {
        Args: {
          p_environment?: string | null;
          p_is_active?: boolean | null;
          p_limit?: number | null;
          p_merchant_id: string;
          p_offset?: number | null;
          p_organization_id?: string | null;
          p_search?: string | null;
        };
        Returns: {
          continue_selling_when_out_of_stock: boolean;
          created_at: string;
          created_by: string;
          description: string;
          display_on_storefront: boolean;
          fees: Json;
          images: string[];
          inventory_quantity: number;
          is_active: boolean;
          metadata: Json;
          name: string;
          organization_id: string;
          prices: Json;
          product_id: string;
          product_type: APIEnums['product_type'];
          sku: string;
          total_count: number;
          track_inventory: boolean;
          updated_at: string;
        }[];
      };
      create_product: {
        Args: {
          p_charge_day?: number | null;
          p_continue_selling_when_out_of_stock?: boolean | null;
          p_description: string;
          p_display_on_storefront?: boolean | null;
          p_environment?: string | null;
          p_failed_payment_action?: APIEnums['failed_payment_action'] | null;
          p_fee_type_ids?: string[] | null;
          p_first_payment_type?: APIEnums['first_payment_type'] | null;
          p_images?: string[] | null;
          p_inventory_quantity?: number | null;
          p_is_active?: boolean | null;
          p_merchant_id: string;
          p_metadata?: Json | null;
          p_name: string;
          p_organization_id: string;
          p_prices?: Json | null;
          p_product_type?: APIEnums['product_type'] | null;
          p_sku?: string | null;
          p_track_inventory?: boolean | null;
          p_trial_enabled?: boolean | null;
          p_trial_period_days?: number | null;
        };
        Returns: string;
      };
      create_price: {
        Args: {
          p_amount: number;
          p_billing_interval?: APIEnums['billing_interval'] | null;
          p_currency_code: APIEnums['currency_code'];
          p_is_default?: boolean | null;
          p_maximum_amount?: number | null;
          p_metadata?: Json | null;
          p_minimum_amount?: number | null;
          p_organization_id: string;
          p_pricing_model?: APIEnums['pricing_model'] | null;
          p_product_id: string;
        };
        Returns: string;
      };
      set_default_price: {
        Args: { p_price_id: string; p_product_id: string };
        Returns: undefined;
      };
      get_product_api: {
        Args: { p_organization_id: string; p_product_id: string };
        Returns: {
          continue_selling_when_out_of_stock: boolean;
          created_at: string;
          created_by: string;
          description: string;
          display_on_storefront: boolean;
          images: string[];
          inventory_quantity: number;
          is_active: boolean;
          metadata: Json;
          name: string;
          organization_id: string;
          product_id: string;
          product_type: APIEnums['product_type'];
          sku: string;
          track_inventory: boolean;
          updated_at: string;
        }[];
      };
      get_product_prices_api: {
        Args: { p_organization_id: string; p_product_id: string };
        Returns: {
          amount: number;
          billing_interval: APIEnums['billing_interval'];
          created_at: string;
          currency_code: APIEnums['currency_code'];
          is_default: boolean;
          organization_id: string;
          price_id: string;
          product_id: string;
          updated_at: string;
        }[];
      };
      get_product_fees_api: {
        Args: { p_organization_id: string; p_product_id: string };
        Returns: {
          fee_fixed_amount: number;
          fee_is_enabled: boolean;
          fee_name: string;
          fee_percentage: number;
          fee_type_id: string;
        }[];
      };
      create_discount_coupon: {
        Args: {
          p_code: string;
          p_customer_type?: APIEnums['customer_type'] | null;
          p_description?: string | null;
          p_discount_fixed_amount?: number | null;
          p_discount_percentage?: number | null;
          p_discount_type?: APIEnums['discount_type'] | null;
          p_expires_at?: string | null;
          p_is_active?: boolean | null;
          p_max_quantity_per_use?: number | null;
          p_max_uses?: number | null;
          p_merchant_id?: string | null;
          p_organization_id: string;
          p_product_ids?: string[] | null;
          p_scope_type?: string | null;
          p_usage_frequency_limit?: APIEnums['usage_frequency'] | null;
          p_usage_limit_value?: number | null;
          p_valid_from?: string | null;
        };
        Returns: string;
      };
      get_coupon_details_for_management: {
        Args: {
          p_coupon_id?: string | null;
          p_merchant_id?: string | null;
          p_organization_id: string;
        };
        Returns: {
          code: string;
          coupon_id: string;
          created_at: string;
          current_uses: number;
          customer_type: APIEnums['customer_type'];
          description: string;
          discount_fixed_amount: number;
          discount_percentage: number;
          discount_type: APIEnums['discount_type'];
          expires_at: string;
          is_active: boolean;
          max_quantity_per_use: number;
          max_uses: number;
          organization_id: string;
          plan_links: Json;
          product_links: Json;
          scope_type: string;
          updated_at: string;
          usage_frequency_limit: APIEnums['usage_frequency'];
          usage_limit_value: number;
          valid_from: string;
        }[];
      };
      get_organization_coupons: {
        Args: { p_environment?: string; p_organization_id: string };
        Returns: {
          applies_to_product_types: APIEnums['product_type'][];
          code: string;
          completed_redemptions: number;
          coupon_id: string;
          created_at: string;
          current_uses: number;
          customer_type: APIEnums['customer_type'];
          description: string;
          discount_fixed_amount: number;
          discount_percentage: number;
          discount_type: APIEnums['discount_type'];
          distinct_customers_completed: number;
          expires_at: string;
          is_active: boolean;
          max_quantity_per_use: number;
          max_uses: number;
          product_links: Json;
          scope_type: string;
          updated_at: string;
          usage_frequency_limit: APIEnums['usage_frequency'];
          usage_limit_value: number;
          valid_from: string;
        }[];
      };
      get_coupon_performance: {
        Args: { p_coupon_id: string };
        Returns: {
          average_discount: number;
          total_discounts: number;
          total_revenue: number;
          total_uses: number;
          unique_customers: number;
        }[];
      };
      fetch_subscriptions: {
        Args: {
          p_environment?: string | null;
          p_merchant_id?: string | null;
          p_organization_id: string;
          p_page?: number | null;
          p_page_size?: number | null;
        };
        Returns: {
          amount: number;
          created_at: string;
          currency_code: APIEnums['currency_code'];
          customer_id: string;
          customer_name: string;
          end_date: string;
          metadata: Json;
          next_billing_date: string;
          product_id: string;
          product_name: string;
          start_date: string;
          status: APIEnums['subscription_status'];
          subscription_id: string;
          updated_at: string;
        }[];
      };
      fetch_subscriptions_for_customer: {
        Args: { p_customer_id: string; p_environment?: string };
        Returns: {
          product_description: string;
          product_id: string;
          product_name: string;
          product_type: APIEnums['product_type'];
          subscription_end_date: string;
          subscription_id: string;
          subscription_next_billing_date: string;
          subscription_status: APIEnums['subscription_status'];
        }[];
      };
      get_customer_subscription: {
        Args: { p_merchant_id: string; p_subscription_id: string };
        Returns: {
          created_at: string;
          customer_email: string;
          customer_id: string;
          customer_name: string;
          end_date: string;
          merchant_id: string;
          metadata: Json;
          next_billing_date: string;
          organization_id: string;
          plan_amount: number;
          plan_billing_frequency: APIEnums['billing_interval'];
          plan_currency_code: APIEnums['currency_code'];
          plan_description: string;
          plan_name: string;
          product_id: string;
          start_date: string;
          status: APIEnums['subscription_status'];
          subscription_id: string;
          updated_at: string;
        }[];
      };
      cancel_customer_subscription: {
        Args: { p_merchant_id: string; p_subscription_id: string };
        Returns: boolean;
      };
      fetch_transactions: {
        Args: {
          p_currency?: APIEnums['currency_code'][] | null;
          p_display_in_xof?: boolean | null;
          p_end_date?: string | null;
          p_environment?: string | null;
          p_is_pos?: boolean | null;
          p_organization_id: string;
          p_page?: number | null;
          p_page_size?: number | null;
          p_payment_method?: APIEnums['payment_method_code'][] | null;
          p_provider_code?: APIEnums['provider_code'] | null;
          p_search_term?: string | null;
          p_start_date?: string | null;
          p_status?: APIEnums['transaction_status'][] | null;
          p_type?: APIEnums['transaction_type'][] | null;
        };
        Returns: {
          coupon_code: string;
          coupon_usage_details: Json;
          created_at: string;
          currency_code: APIEnums['currency_code'];
          customer_address: string;
          customer_city: string;
          customer_country: string;
          customer_email: string;
          customer_id: string;
          customer_name: string;
          customer_phone: string;
          customer_postal_code: string;
          fee_amount: number;
          fee_amount_xof: number;
          fee_category: APIEnums['fee_category'];
          fee_name: string;
          fee_structure_id: string;
          fee_subcategory: APIEnums['fee_subcategory'];
          gross_amount: number;
          gross_amount_xof: number;
          metadata: Json;
          net_amount: number;
          net_amount_xof: number;
          organization_id: string;
          payment_method_code: APIEnums['payment_method_code'];
          product_description: string;
          product_id: string;
          product_name: string;
          product_price: number;
          provider_checkout_id: string;
          provider_code: APIEnums['provider_code'];
          provider_transaction_id: string;
          qr_code_id: string;
          qr_code_name: string;
          qr_code_product_id: string;
          qr_code_type: APIEnums['qr_code_type'];
          quantity: number;
          spi_payment_category: APIEnums['spi_payment_category'];
          spi_rejection_reason: APIEnums['spi_rejection_reason'];
          status: APIEnums['transaction_status'];
          subscription_id: string;
          subscription_next_billing_date: string;
          subscription_price_billing_interval: string;
          subscription_product_description: string;
          subscription_product_name: string;
          subscription_status: string;
          transaction_id: string;
          transaction_type: APIEnums['transaction_type'];
        }[];
      };
      get_transaction: {
        Args: { p_organization_id?: string; p_transaction_id: string };
        Returns: {
          created_at: string;
          currency_code: APIEnums['currency_code'];
          customer_id: string;
          description: string;
          fee_amount: number;
          fee_category: APIEnums['fee_category'];
          fee_name: string;
          fee_structure_id: string;
          fee_subcategory: APIEnums['fee_subcategory'];
          gross_amount: number;
          metadata: Json;
          net_amount: number;
          organization_id: string;
          payment_method_code: APIEnums['payment_method_code'];
          product_id: string;
          provider_code: APIEnums['provider_code'];
          status: APIEnums['transaction_status'];
          subscription_id: string;
          transaction_id: string;
          transaction_type: APIEnums['transaction_type'];
          updated_at: string;
        }[];
      };
      create_beneficiary_payout: {
        Args: {
          p_amount: number;
          p_bypass_payout_pin?: boolean | null;
          p_currency_code: APIEnums['currency_code'];
          p_merchant_id: string;
          p_metadata?: Json | null;
          p_payment_method_code?: APIEnums['payment_method_code'] | null;
          p_payout_method_id?: string | null;
          p_payout_pin?: string | null;
          p_payout_pin_session?: string | null;
          p_provider_code?: APIEnums['provider_code'] | null;
          p_status?: APIEnums['payout_status'] | null;
        };
        Returns: {
          fee_amount: number;
          message: string;
          payout_id: string;
          status: APIEnums['payout_status'];
          total_deduction: number;
        }[];
      };
      fetch_beneficiary_payouts: {
        Args: {
          p_currency_code?: APIEnums['currency_code'] | null;
          p_end_date?: string | null;
          p_merchant_id: string;
          p_organization_id?: string | null;
          p_page_number?: number | null;
          p_page_size?: number | null;
          p_start_date?: string | null;
          p_statuses?: string[] | null;
        };
        Returns: {
          account_id: string;
          amount: number;
          created_at: string;
          created_by: string;
          currency_code: APIEnums['currency_code'];
          metadata: Json;
          organization_id: string;
          payment_method_code: APIEnums['payment_method_code'];
          payout_id: string;
          payout_method_id: string;
          provider_code: APIEnums['provider_code'];
          status: APIEnums['payout_status'];
          updated_at: string;
        }[];
      };
      get_beneficiary_payout_api: {
        Args: { p_organization_id: string; p_payout_id: string };
        Returns: {
          account_id: string;
          amount: number;
          created_at: string;
          created_by: string;
          currency_code: APIEnums['currency_code'];
          metadata: Json;
          organization_id: string;
          payment_method_code: APIEnums['payment_method_code'];
          payout_id: string;
          payout_method_id: string;
          provider_code: APIEnums['provider_code'];
          status: APIEnums['payout_status'];
          updated_at: string;
        }[];
      };
      fetch_wave_provider_settings: {
        Args: { p_organization_id: string };
        Returns: {
          is_connected: boolean;
          is_phone_verified: boolean;
          metadata: Json;
          organization_id: string;
          phone_number: string;
          provider_code: APIEnums['provider_code'];
          provider_merchant_id: string;
        }[];
      };
      get_webhook: {
        Args: { p_merchant_id: string; p_webhook_id: string };
        Returns: {
          authorized_events: APIEnums['webhook_event'][];
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          environment: string;
          is_active: boolean;
          last_payload: Json | null;
          last_response_body: string | null;
          last_response_status: number | null;
          last_triggered_at: string | null;
          metadata: Json | null;
          organization_id: string;
          retry_count: number | null;
          spi_event_types: string[] | null;
          supports_spi: boolean;
          updated_at: string;
          url: string;
          verification_token: string;
          webhook_id: string;
        }[];
        SetofOptions: {
          from: '*';
          to: 'webhooks';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_webhook_by_id: {
        Args: { p_webhook_id: string };
        Returns: {
          authorized_events: APIEnums['webhook_event'][];
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          environment: string;
          is_active: boolean;
          last_payload: Json | null;
          last_response_body: string | null;
          last_response_status: number | null;
          last_triggered_at: string | null;
          metadata: Json | null;
          organization_id: string;
          retry_count: number | null;
          spi_event_types: string[] | null;
          supports_spi: boolean;
          updated_at: string;
          url: string;
          verification_token: string;
          webhook_id: string;
        }[];
        SetofOptions: {
          from: '*';
          to: 'webhooks';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      update_webhook: {
        Args: {
          p_authorized_events?: APIEnums['webhook_event'][] | null;
          p_is_active?: boolean | null;
          p_merchant_id: string;
          p_metadata?: Json | null;
          p_url?: string | null;
          p_webhook_id: string;
        };
        Returns: boolean;
      };
      fetch_organization_webhooks: {
        Args: {
          p_environment?: string | null;
          p_event?: APIEnums['webhook_event'] | null;
          p_is_active?: boolean | null;
          p_merchant_id: string;
          p_organization_id?: string | null;
          p_search_term?: string | null;
        };
        Returns: {
          authorized_events: APIEnums['webhook_event'][];
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          environment: string;
          is_active: boolean;
          last_payload: Json | null;
          last_response_body: string | null;
          last_response_status: number | null;
          last_triggered_at: string | null;
          metadata: Json | null;
          organization_id: string;
          retry_count: number | null;
          spi_event_types: string[] | null;
          supports_spi: boolean;
          updated_at: string;
          url: string;
          verification_token: string;
          webhook_id: string;
        }[];
        SetofOptions: {
          from: '*';
          to: 'webhooks';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_merchant_from_organization: {
        Args: { p_organization_id: string };
        Returns: string;
      };
      get_webhook_delivery_logs: {
        Args: {
          p_failed_only?: boolean | null;
          p_limit?: number | null;
          p_merchant_id: string;
          p_offset?: number | null;
          p_success_only?: boolean | null;
          p_webhook_id: string;
        };
        Returns: {
          attempt_number: number;
          created_at: string;
          event_type: string;
          headers: Json;
          ip_address: string;
          log_id: string;
          organization_id: string;
          payload: Json;
          request_duration_ms: number;
          response_body: string;
          response_status: number;
          success: boolean;
          user_agent: string;
          webhook_id: string;
        }[];
      };
      get_webhook_delivery_log: {
        Args: { p_log_id: string; p_merchant_id: string };
        Returns: {
          attempt_number: number;
          created_at: string;
          event_type: string;
          headers: Json;
          ip_address: string;
          log_id: string;
          organization_id: string;
          payload: Json;
          request_duration_ms: number;
          response_body: string;
          response_status: number;
          success: boolean;
          user_agent: string;
          webhook_id: string;
        }[];
      };
      fetch_payouts: {
        Args: {
          p_end_date?: string | null;
          p_environment?: string | null;
          p_merchant_id: string;
          p_organization_id?: string | null;
          p_page_number?: number | null;
          p_page_size?: number | null;
          p_start_date?: string | null;
          p_statuses?: APIEnums['payout_status'][] | null;
        };
        Returns: {
          account_id: string;
          amount: number;
          created_at: string;
          currency_code: APIEnums['currency_code'];
          merchant_id: string;
          metadata: Json;
          organization_id: string;
          payout_id: string;
          payout_method_id: string;
          provider_code: APIEnums['provider_code'];
          status: APIEnums['payout_status'];
          updated_at: string;
        }[];
      };
      create_mtn_transaction: {
        Args: {
          p_amount: number;
          p_checkout_session_id?: string | null;
          p_currency_code: APIEnums['currency_code'];
          p_customer_id: string;
          p_description?: string | null;
          p_environment?: string | null;
          p_merchant_id: string;
          p_metadata?: Json | null;
          p_organization_id: string;
          p_product_id?: string | null;
          p_quantity?: number | null;
          p_subscription_id?: string | null;
        };
        Returns: {
          external_id: string;
          transaction_id: string;
        }[];
      };
      update_mtn_provider_reference: {
        Args: { p_provider_reference_id: string; p_transaction_id: string };
        Returns: boolean;
      };
      initiate_spi_payout: {
        Args: {
          p_amount: number;
          p_bypass_payout_pin?: boolean | null;
          p_currency_code: APIEnums['currency_code'];
          p_merchant_id: string;
          p_organization_id: string;
          p_payout_method_id: string;
          p_payout_pin?: string | null;
          p_payout_pin_session?: string | null;
        };
        Returns: {
          message: string;
          payout_id: string;
          spi_tx_id: string;
          status: APIEnums['payout_status'];
        }[];
      };
      update_spi_payout_status: {
        Args: {
          p_payout_id: string;
          p_spi_tx_id: string;
          p_status: APIEnums['payout_status'];
        };
        Returns: undefined;
      };
      initiate_withdrawal_api: {
        Args: {
          p_amount: number;
          p_bypass_payout_pin?: boolean | null;
          p_currency_code?: APIEnums['currency_code'] | null;
          p_merchant_id: string;
          p_organization_id: string;
          p_payout_method_id: string;
          p_payout_pin?: string | null;
          p_payout_pin_session?: string | null;
          p_provider_code?: APIEnums['provider_code'] | null;
        };
        Returns: {
          message: string;
          success: boolean;
        }[];
      };
      get_payout_api: {
        Args: { p_organization_id: string; p_payout_id: string };
        Returns: {
          account_id: string;
          amount: number;
          created_at: string;
          currency_code: APIEnums['currency_code'];
          metadata: Json;
          organization_id: string;
          payment_method_code: APIEnums['payment_method_code'];
          payout_id: string;
          payout_method_id: string;
          provider_code: APIEnums['provider_code'];
          status: APIEnums['payout_status'];
          updated_at: string;
        }[];
      };
      fetch_payout_method_details: {
        Args: { p_organization_id?: string; p_payout_method_id: string };
        Returns: {
          account_name: string;
          account_number: string;
          auto_withdrawal_enabled: boolean;
          auto_withdrawal_method: string;
          auto_withdrawal_mobile_provider: APIEnums['provider_code'];
          bank_code: string;
          bank_name: string;
          branch_code: string;
          country: string;
          eligible_for_platform_withdrawal_at: string;
          is_default: boolean;
          is_spi_enabled: boolean;
          is_uemoa: boolean;
          is_valid: boolean;
          organization_id: string;
          payout_method_id: string;
          payout_method_type: string;
          spi_account_number: string;
          spi_alias_mbno: string;
          spi_alias_shid: string;
          spi_alias_type: string;
        }[];
      };
      get_transaction_by_stripe_intent: {
        Args: { p_payment_intent_id: string };
        Returns: Json;
      };
      fetch_organization_providers_settings_api: {
        Args: {
          p_merchant_id: string;
          p_organization_id: string;
          p_provider_code?: APIEnums['provider_code'] | null;
        };
        Returns: {
          is_connected: boolean;
          is_phone_verified: boolean;
          metadata: Json;
          onboarding_status: APIEnums['onboarding_status'];
          organization_id: string;
          phone_number: string;
          provider_code: APIEnums['provider_code'];
          provider_merchant_id: string;
        }[];
      };
      create_manual_refund_request_api: {
        Args: {
          p_merchant_id: string;
          p_organization_id: string;
          p_processing_fee_percentage?: number | null;
          p_reason?: string | null;
          p_refund_amount: number;
          p_subscription_action?: string | null;
          p_transaction_id: string;
        };
        Returns: Json;
      };
      create_stripe_card_refund_api: {
        Args: {
          p_merchant_id: string;
          p_organization_id: string;
          p_processing_fee_percentage?: number | null;
          p_reason?: string | null;
          p_refund_amount: number;
          p_stripe_charge_id?: string | null;
          p_stripe_refund_id?: string | null;
          p_subscription_action?: string | null;
          p_transaction_id: string;
        };
        Returns: Json;
      };
      create_wave_refund_request_api: {
        Args: {
          p_merchant_id: string;
          p_organization_id: string;
          p_processing_fee_percentage?: number | null;
          p_reason?: string | null;
          p_refund_amount: number;
          p_subscription_action?: string | null;
          p_transaction_id: string;
        };
        Returns: Json;
      };
      rollback_wave_refund: {
        Args: { p_reason?: string; p_refund_id: string };
        Returns: Json;
      };
      apply_subscription_refund_action: {
        Args: {
          p_initiated_by?: string | null;
          p_is_full_refund: boolean;
          p_refund_id: string;
          p_subscription_action?: string | null;
          p_transaction_id: string;
        };
        Returns: Json;
      };
      apply_wave_partial_refund_charges: {
        Args: {
          p_processing_fee_percentage?: number | null;
          p_refund_amount: number;
          p_refund_id: string;
          p_subscription_action?: string | null;
          p_transaction_id: string;
        };
        Returns: {
          error_message: string;
          subscription_action: Json;
          success: boolean;
        }[];
      };
      classify_subscription_transaction: {
        Args: { p_transaction_id: string };
        Returns: string;
      };
      create_refund: {
        Args: {
          p_amount: number;
          p_created_by?: string | null;
          p_metadata?: Json | null;
          p_provider_code?: APIEnums['provider_code'] | null;
          p_provider_merchant_id?: string | null;
          p_provider_transaction_id?: string | null;
          p_reason?: string | null;
          p_subscription_action?: string | null;
          p_transaction_id: string;
        };
        Returns: string;
      };
      maybe_apply_subscription_refund_action_after_refund: {
        Args: {
          p_initiated_by?: string | null;
          p_refund_id: string;
          p_subscription_action?: string | null;
          p_transaction_id: string;
        };
        Returns: Json;
      };
      resolve_subscription_refund_action: {
        Args: {
          p_explicit_action?: string | null;
          p_is_full_refund: boolean;
          p_transaction_id: string;
        };
        Returns: string;
      };
      update_organization_balance_for_refund: {
        Args: {
          p_processing_fee_percentage?: number | null;
          p_refund_amount: number;
          p_transaction_id: string;
        };
        Returns: {
          error_message: string;
          success: boolean;
        }[];
      };
      list_refunds: {
        Args: {
          p_end_date?: string | null;
          p_limit?: number | null;
          p_offset?: number | null;
          p_organization_id: string;
          p_start_date?: string | null;
          p_status?: APIEnums['refund_status'] | null;
        };
        Returns: {
          amount: number;
          created_at: string;
          fee_amount: number;
          metadata: Json;
          reason: string;
          refund_id: string;
          refunded_amount: number;
          status: APIEnums['refund_status'];
          transaction_id: string;
          updated_at: string;
        }[];
      };
      get_refund: {
        Args: { p_organization_id: string; p_refund_id: string };
        Returns: {
          amount: number;
          created_at: string;
          fee_amount: number;
          metadata: Json;
          reason: string;
          refund_id: string;
          refunded_amount: number;
          status: APIEnums['refund_status'];
          transaction_id: string;
          updated_at: string;
        }[];
      };
      get_effective_other_fee_config: {
        Args: {
          p_currency_code: APIEnums['currency_code'];
          p_organization_id: string;
          p_payment_method_code?: APIEnums['payment_method_code'] | null;
          p_provider_code?: APIEnums['provider_code'] | null;
          p_subcategory: APIEnums['fee_subcategory'];
        };
        Returns: {
          fee_name: string;
          fixed_amount: number;
          percentage: number;
          tier_name: string;
        }[];
      };
      get_customer: {
        Args: { p_customer_id: string; p_merchant_id: string };
        Returns: {
          address: string;
          city: string;
          country: string;
          created_at: string;
          customer_id: string;
          email: string;
          is_business: boolean;
          metadata: Json;
          name: string;
          phone_number: string;
          postal_code: string;
          updated_at: string;
          whatsapp_number: string;
        }[];
      };
      log_webhook_delivery: {
        Args: {
          p_attempt_number?: number | null;
          p_event_type: string;
          p_headers?: Json | null;
          p_ip_address?: string | null;
          p_merchant_id: string;
          p_organization_id: string;
          p_payload: Json;
          p_request_duration_ms?: number | null;
          p_response_body: string;
          p_response_status: number;
          p_user_agent?: string | null;
          p_webhook_id: string;
        };
        Returns: string;
      };
      webhook_outbox_upsert_event: {
        Args: {
          p_event_type: APIEnums['webhook_event'];
          p_idempotency_key: string;
          p_organization_id: string;
          p_payload: Json;
        };
        Returns: string;
      };
      webhook_dispatch_ensure: {
        Args: { p_outbox_id: string; p_webhook_id: string };
        Returns: string;
      };
      webhook_dispatch_should_process: {
        Args: { p_dispatch_id: string };
        Returns: boolean;
      };
      record_webhook_delivery_attempt: {
        Args: {
          p_attempt_number: number;
          p_dispatch_id: string;
          p_error_message: string;
          p_request_duration_ms: number;
          p_response_body: string;
          p_response_status: number;
        };
        Returns: string;
      };
      mark_webhook_dispatch_delivered: {
        Args: { p_dispatch_id: string };
        Returns: undefined;
      };
      mark_webhook_dispatch_dead_letter: {
        Args: { p_dispatch_id: string; p_reason: string };
        Returns: undefined;
      };
      claim_inbound_provider_webhook_event: {
        Args: {
          p_metadata?: Json | null;
          p_provider: APIEnums['provider_code'];
          p_provider_event_id: string;
        };
        Returns: boolean;
      };
      get_wave_transaction_by_checkout_id: {
        Args: { p_provider_checkout_id: string };
        Returns: {
          created_at: string;
          merchant_id: string;
          organization_id: string;
          transaction_id: string;
        }[];
      };
      get_checkout_session_by_wave_id: {
        Args: { p_wave_session_id: string };
        Returns: {
          checkout_session_id: string;
          created_at: string;
          customer_id: string;
          merchant_id: string;
          metadata: Json;
          organization_id: string;
          transaction_id: string;
        }[];
      };
      recover_missing_wave_transaction: {
        Args: {
          p_amount?: number | null;
          p_client_reference: string;
          p_currency?: string | null;
          p_wave_session_id: string;
          p_wave_transaction_id?: string | null;
        };
        Returns: {
          r_organization_id: string;
          r_status: APIEnums['transaction_status'];
          r_transaction_id: string;
          r_was_recovered: boolean;
        }[];
      };
      find_wave_transaction_by_provider_txn_id: {
        Args: { p_wave_transaction_id: string };
        Returns: {
          status: APIEnums['transaction_status'];
          transaction_id: string;
        }[];
      };
      update_transaction_status: {
        Args: {
          p_metadata?: Json | null;
          p_status: APIEnums['transaction_status'];
          p_transaction_id: string;
        };
        Returns: boolean;
      };
      update_balances_for_transaction: {
        Args: { p_transaction_id: string };
        Returns: boolean;
      };
      update_stripe_checkout_status: {
        Args: {
          p_error_code?: string | null;
          p_error_message?: string | null;
          p_metadata?: Json | null;
          p_payment_status?: APIEnums['provider_payment_status'] | null;
          p_stripe_charge_id?: string | null;
          p_stripe_payment_intent_id: string;
          p_stripe_payment_method_id?: string | null;
        };
        Returns: Json;
      };
      update_transaction_fee_metadata: {
        Args: {
          p_card_details: Json;
          p_is_international: boolean;
          p_payment_method_id: string;
          p_stripe_payment_intent_id: string;
        };
        Returns: Json;
      };
      handle_stripe_dispute_created: {
        Args: {
          p_amount: number;
          p_currency: string;
          p_dispute_data?: Json | null;
          p_payment_intent_id: string;
          p_reason: string;
          p_stripe_charge_id: string;
          p_stripe_dispute_id: string;
        };
        Returns: Json;
      };
      handle_stripe_dispute_updated: {
        Args: {
          p_dispute_data?: Json | null;
          p_status: string;
          p_stripe_dispute_id: string;
        };
        Returns: Json;
      };
      handle_stripe_refund: {
        Args: {
          p_payment_intent_id: string;
          p_reason?: string | null;
          p_refund_amount: number;
          p_refund_id: string;
          p_stripe_charge_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      billing_interval:
        | 'day'
        | 'week'
        | 'bi-weekly'
        | 'month'
        | 'bi-monthly'
        | 'quarterly'
        | 'semi-annual'
        | 'year'
        | 'lifetime'
        | 'unit';
      bnpl_status: 'pending' | 'collected' | 'waived' | 'refunded';
      checkout_session_status: 'open' | 'completed' | 'expired';
      currency_code: 'XOF' | 'USD' | 'EUR';
      customer_type: 'all' | 'new' | 'returning';
      discount_type: 'percentage' | 'fixed';
      failed_payment_action: 'cancel' | 'pause' | 'continue';
      fee_category: 'payment_processing' | 'payout' | 'other';
      fee_subcategory:
        | 'pos'
        | 'bnpl'
        | 'cards'
        | 'mobile_money'
        | 'bank_transfer_local'
        | 'bank_transfer_international'
        | 'bank_transfer_beneficiary'
        | 'mobile_money_payout'
        | 'mobile_money_beneficiary'
        | 'refund'
        | 'partial_refund'
        | 'chargeback'
        | 'currency_conversion'
        | 'international_cards'
        | 'subscription_payments';
      first_payment_type: 'initial' | 'non_initial' | 'prorated';
      integration_source:
        | 'system'
        | 'shopify'
        | 'woocommerce'
        | 'prestashop'
        | 'magento'
        | 'odoo'
        | 'bubble';
      invoice_status: 'sent' | 'paid' | 'overdue' | 'cancelled' | 'draft';
      link_type: 'instant' | 'product';
      onboarding_status:
        | 'pending'
        | 'completed'
        | 'failed'
        | 'skipped'
        | 'in_progress';
      organization_status: 'active' | 'inactive' | 'suspended';
      organization_verification_status: 'unverified' | 'starter' | 'verified';
      payment_method_code:
        | 'CARDS'
        | 'MOBILE_MONEY'
        | 'BANK_TRANSFER'
        | 'BNPL'
        | 'FREE';
      payout_status: 'pending' | 'processing' | 'completed' | 'failed';
      pricing_model: 'standard' | 'pay_what_you_want' | 'tiered' | 'volume';
      pricing_plan_type: 'fixed' | 'volume_tiered' | 'custom';
      product_type: 'one_time' | 'recurring' | 'usage_based';
      provider_code:
        | 'WAVE'
        | 'JUMBO'
        | 'MTN'
        | 'STRIPE'
        | 'SPI'
        | 'CYBERSOURCE'
        | 'FREE';
      provider_payment_status:
        | 'processing'
        | 'cancelled'
        | 'succeeded'
        | 'expired'
        | 'refunded';
      qr_code_type: 'static' | 'dynamic';
      refund_status: 'pending' | 'completed' | 'failed';
      spi_account_status: 'OUVERT' | 'BLOQUE' | 'CLOTURE';
      spi_account_type:
        | 'CACC'
        | 'CARD'
        | 'CASH'
        | 'CHAR'
        | 'CISH'
        | 'CURR'
        | 'DPST'
        | 'SVGS'
        | 'ULAA';
      spi_document_type:
        | 'CINV'
        | 'CMCN'
        | 'DISP'
        | 'PUOR'
        | 'CONT'
        | 'INVC'
        | 'PMNT'
        | 'TPMT';
      spi_payment_category:
        | '631'
        | '000'
        | '400'
        | '733'
        | '300'
        | '999'
        | '500'
        | '521'
        | '401';
      spi_payment_flow_type:
        | 'BANK_TO_BANK'
        | 'BANK_TO_WALLET'
        | 'WALLET_TO_BANK'
        | 'WALLET_TO_WALLET'
        | 'INTRA_ACCOUNT';
      spi_payment_request_category: '500' | '521' | '401';
      spi_payment_status: 'INITIE' | 'ENVOYE' | 'IRREVOCABLE' | 'REJETE';
      spi_rejection_reason:
        | 'BE23'
        | 'DU03'
        | 'AC04'
        | 'AC06'
        | 'AEXR'
        | 'AG03'
        | 'AG10'
        | 'AG11'
        | 'ALAC'
        | 'AM02'
        | 'AM09'
        | 'AM14'
        | 'APAR'
        | 'RR07'
        | 'FR01'
        | 'AB03'
        | 'AB04'
        | 'AB08'
        | 'AB09'
        | 'AC03'
        | 'AG01'
        | 'AM04'
        | 'RR04'
        | 'CUST'
        | 'ARDT';
      spi_webhook_event_code:
        | 'PAIEMENT_RECU'
        | 'PAIEMENT_ENVOYE'
        | 'PAIEMENT_REJETE'
        | 'RTP_RECU'
        | 'RTP_REJETE'
        | 'RETOUR_ENVOYE'
        | 'RETOUR_REJETE'
        | 'RETOUR_RECU'
        | 'ANNULATION_DEMANDE'
        | 'ANNULATION_REJETE';
      subscription_status:
        | 'pending'
        | 'active'
        | 'paused'
        | 'cancelled'
        | 'expired'
        | 'past_due'
        | 'trial';
      transaction_status:
        | 'pending'
        | 'completed'
        | 'failed'
        | 'refunded'
        | 'expired';
      transaction_type: 'payment' | 'instalment';
      usage_aggregation: 'sum' | 'max' | 'last_during_period' | 'last_ever';
      usage_frequency:
        | 'total'
        | 'per_customer'
        | 'per_day'
        | 'per_week'
        | 'per_month';
      webhook_event:
        | 'PAYMENT_CREATED'
        | 'PAYMENT_SUCCEEDED'
        | 'PAYMENT_FAILED'
        | 'REFUND_CREATED'
        | 'REFUND_COMPLETED'
        | 'REFUND_FAILED'
        | 'SUBSCRIPTION_CREATED'
        | 'SUBSCRIPTION_UPDATED'
        | 'SUBSCRIPTION_RENEWED'
        | 'SUBSCRIPTION_CANCELLED'
        | 'USAGE_RECORDED'
        | 'USAGE_INVOICE_CREATED'
        | 'USAGE_INVOICE_PAID'
        | 'USAGE_INVOICE_OVERDUE'
        | 'SUBSCRIPTION_USAGE_PERIOD_CLOSED';
    };
  };
};

/**
 * API Enums - Exposed enum types for API usage
 */
export type APIEnums = Database['public']['Enums'];

export type BillingInterval = APIEnums['billing_interval'];
export type BnplStatus = APIEnums['bnpl_status'];
export type CheckoutSessionStatus = APIEnums['checkout_session_status'];
export type CurrencyCode = APIEnums['currency_code'];
export type CustomerType = APIEnums['customer_type'];
export type DiscountType = APIEnums['discount_type'];
export type FailedPaymentAction = APIEnums['failed_payment_action'];
export type FeeCategory = APIEnums['fee_category'];
export type FeeSubcategory = APIEnums['fee_subcategory'];
export type FirstPaymentType = APIEnums['first_payment_type'];
export type IntegrationSource = APIEnums['integration_source'];
export type InvoiceStatus = APIEnums['invoice_status'];
export type LinkType = APIEnums['link_type'];
export type OrganizationStatus = APIEnums['organization_status'];
export type OrganizationVerificationStatus =
  APIEnums['organization_verification_status'];
export type PaymentMethodCode = APIEnums['payment_method_code'];
export type PayoutStatus = APIEnums['payout_status'];
export type PricingModel = APIEnums['pricing_model'];
export type PricingPlanType = APIEnums['pricing_plan_type'];
export type ProductType = APIEnums['product_type'];
export type ProviderCode = APIEnums['provider_code'];
export type ProviderPaymentStatus = APIEnums['provider_payment_status'];
export type QrCodeType = APIEnums['qr_code_type'];
export type RefundStatus = APIEnums['refund_status'];
export type SpiAccountStatus = APIEnums['spi_account_status'];
export type SpiAccountType = APIEnums['spi_account_type'];
export type SpiDocumentType = APIEnums['spi_document_type'];
export type SpiPaymentCategory = APIEnums['spi_payment_category'];
export type SpiPaymentFlowType = APIEnums['spi_payment_flow_type'];
export type SpiPaymentRequestCategory =
  APIEnums['spi_payment_request_category'];
export type SpiPaymentStatus = APIEnums['spi_payment_status'];
export type SpiRejectionReason = APIEnums['spi_rejection_reason'];
export type SpiWebhookEventCode = APIEnums['spi_webhook_event_code'];
export type SubscriptionStatus = APIEnums['subscription_status'];
export type TransactionStatus = APIEnums['transaction_status'];
export type TransactionType = APIEnums['transaction_type'];
export type UsageAggregation = APIEnums['usage_aggregation'];
export type UsageFrequency = APIEnums['usage_frequency'];
export type WebhookEvent = APIEnums['webhook_event'];

