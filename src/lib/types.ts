export interface Document {
  id: string;
  user_id: string;
  title: string;
  content: string;
  language: string;
  service_type: string;
  company_name: string;
  price: number;
  created_at: string;
  status: 'draft' | 'generated' | 'paid';
}

export interface DocumentInput {
  title: string;
  content: string;
  language: string;
  service_type: string;
  company_name: string;
  price: number;
}