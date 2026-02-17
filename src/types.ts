
export interface Service {
  id: string;
  name: string;
  description: string;
  price?: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  avatar?: string;
}
