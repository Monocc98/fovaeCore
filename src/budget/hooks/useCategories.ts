import { useQuery } from "@tanstack/react-query";
import { getCategoriesOverloadAction } from "@/categories/actions/categories.actions";


export const useCategories = (companyId?: string) => {
const q = useQuery({
queryKey: ["v2:company-categories", companyId],
queryFn: () => getCategoriesOverloadAction(companyId!),
enabled: !!companyId,
staleTime: 5 * 60 * 1000,
refetchOnWindowFocus: false,
});
const categories = q.data?.company?.categories ?? [];
return { ...q, categories } as const;
};