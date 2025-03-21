// supabase/functions/_shared/plans.ts

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  documents_limit: number | 'unlimited';
};

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    interval: 'month',
    documents_limit: 5
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 29.99,
    interval: 'month',
    documents_limit: 50
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    interval: 'month',
    documents_limit: 15
  },
  {
    id: "basic-monthly",
    name: "Basic Monthly",
    price: 9.99,
    interval: "month",
    documents_limit: 10
  }
];

export type DocumentPrice = {
  type: string;
  name: string;
  price: number;
  description: string;
};

export const documentPrices: DocumentPrice[] = [
  {
    type: 'contract',
    name: 'Ugovor',
    price: 9.99,
    description: 'Standardni ugovor'
  },
  {
    type: 'agreement',
    name: 'Sporazum',
    price: 7.99,
    description: 'Sporazum između strana'
  }
];

export type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  price: number;
  savings?: string;
  features?: string[];
};

export const creditPackages: CreditPackage[] = [
  {
    id: 'small-pack',
    name: 'Mali paket',
    credits: 5,
    price: 4.99,
    savings: '0%'
  },
  {
    id: 'medium-pack',
    name: 'Srednji paket',
    credits: 20,
    price: 16.99,
    savings: '15%'
  },
  {
    id: 'large-pack',
    name: 'Veliki paket',
    credits: 50,
    price: 34.99,
    savings: '30%'
  }
];