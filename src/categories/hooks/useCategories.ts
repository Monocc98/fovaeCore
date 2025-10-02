import { getCategoriesOverloadAction } from "@/home/actions/categories.actions";
import { useHomeStore } from "@/home/hooks/useHomeStore";
import type { Category } from "@/home/types/categories.interfaces";
import type { CategoriesResponse } from "@/home/types/companiesResponse.interface";
import { useQuery } from "@tanstack/react-query";

export const useCategories = () => {

  const { activeCompanyId } = useHomeStore();

  const categoriesQuery = useQuery<CategoriesResponse>({
    queryKey: ["categories", activeCompanyId],
    queryFn: () => getCategoriesOverloadAction(activeCompanyId!),
    enabled: !!activeCompanyId,
  });

  const companyName = categoriesQuery.data?.company?.name;

  const parentCategories: Category[] =
      categoriesQuery.data?.company?.categories ?? [];

  const level1 = parentCategories;
  const level2 = parentCategories.flatMap(c => c.subcategories ?? []);
  const level3 = level2.flatMap(s => s.subsubcategories ?? []);


  return {
    //Props 
    companyName,
    parentCategories: level1,
    subcategories: level2,
    subsubcategories: level3,
    //Metods
  }
}