// src/lib/payment/types.ts
export interface UserSubscription {
    id: string;
    user_id: string;
    stripe_subscription_id: string;
    plan_id: string;
    status: 'active' | 'canceled' | 'expired';
    documents_remaining: number;
    current_period_start: string;
    current_period_end: string;
    created_at: string;
  }
  
  export interface UserCredit {
    user_id: string;
    credits: number;
    last_updated: string;
  }
  
  export interface Document {
    id: string;
    user_id: string;
    title: string;
    document_type: string;
    content: string;
    created_at: string;
  }
  
  export interface Transaction {
    id: string;
    user_id: string;
    type: 'subscription' | 'credit_purchase' | 'document_purchase';
    stripe_session_id: string;
    amount: number;
    description: string;
    status: 'completed' | 'refunded' | 'failed';
    created_at: string;
  }
  
  /**
   * Detalji plaćanja koji se dobijaju iz verify-payment funkcije
   */
  export interface PaymentDetails {
    type: 'subscription' | 'credits' | 'document';
    planName?: string;
    documentsLimit?: number;
    interval?: string;
    currentPeriodEnd?: string;
    credits?: number;
    documentName?: string;
    documentType?: string;
  }
  
  /**
   * Odgovor Stripe Checkout sesije
   */
  export type StripeCheckoutResponse = {
    sessionId: string;
    url?: string;
  };
  
  /**
   * Podržani načini plaćanja u aplikaciji
   */
  export type PaymentMode = 'subscription' | 'credits' | 'document';
  
  export interface ResourceCheckResult {
    canGenerate: boolean;
    reason?: 'no-credits' | 'error';
    subscription?: UserSubscription;
    credits?: number;
    resourceType?: 'subscription' | 'credits';
    message?: string;
  }