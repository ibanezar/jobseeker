export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  type: "remote" | "hybrid" | "onsite";
  salary?: string;
  tags: string[];
  postedAt: string;
  url: string;
  source: string;
  description?: string;
}

export type JobFilter = {
  search: string;
  types: ("remote" | "hybrid")[];
  tags: string[];
};
