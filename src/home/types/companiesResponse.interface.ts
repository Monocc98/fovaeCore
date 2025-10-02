import type { Category } from "./categories.interfaces";

export type CategoriesResponse = {
  company?: {
    _id: string;
    name: string;
    group: string;
    categories?: Category[];
  };
};