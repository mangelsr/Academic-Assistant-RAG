export interface CareerInfo {
  code: string;
  name: string;
  total_courses?: number;
  total_chunks?: number;
}

export interface CareerListResponse {
  careers: CareerInfo[];
}

export interface Citation {
  course_name: string;
  course_code?: string;
  career: string;
  document_type: string;
  snippet: string;
  score: number;
  s3_uri?: string;
}

export interface QueryRequest {
  query: string;
  career: string;
  top_k?: number;
  use_complex_model?: boolean;
}

export interface QueryResponse {
  answer: string;
  career: string;
  citations: Citation[];
  execution_time_ms: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  career?: string;
  citations?: Citation[];
  execution_time_ms?: number;
  timestamp: Date;
  isError?: boolean;
}
