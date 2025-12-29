
export interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  link: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar: string;
}

export interface AIResponse {
  structure: string[];
  techStack: string[];
  estimatedDuration: string;
  summary: string;
}
