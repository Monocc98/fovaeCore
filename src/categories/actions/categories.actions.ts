import { fovaeCoreApi } from "@/api/fovaeCore.api"
import type { CategoriesResponse, Category, Subcategory, Subsubcategory } from "../../types";

export const getCategoriesOverloadAction = async(idCompany: string):Promise<CategoriesResponse> => {
    const { data } = await fovaeCoreApi.get<CategoriesResponse>(`/categories/${idCompany}`);

    return data;
}

export const createCategoryAction = async(payload: Category): Promise<Category> => {
    const body: Category = {
        ...payload,
    };

    const { data } = await fovaeCoreApi.post("/categories", body);

    return data.category;
}

export const createSubcategoryAction = async(payload: Subcategory): Promise<Subcategory> => {
    const body: Subcategory = {
        ...payload,
    };

    const { data } = await fovaeCoreApi.post("/categories/subcategories", body);

    return data.subcategory;
}

export const createSubsubcategoryAction = async(payload: Subsubcategory): Promise<Subsubcategory> => {
    const body: Subsubcategory = {
        ...payload,
    };

    const { data } = await fovaeCoreApi.post("/categories/subsubcategories", body);

    return data.subsubcategory;
}

export const updateCategoryAction = async(idCategory: string, payload: Category): Promise<Category> => {
    const body: Category = {
        ...payload,
    }

    const { data } = await fovaeCoreApi.put<Category>(`/categories/${idCategory}`, body);
    return data;
}

export const updateSubcategoryAction = async(idSubcategory: string, payload: Subcategory): Promise<Subcategory> => {
    const body: Subcategory = {
        ...payload,
    }

    const { data } = await fovaeCoreApi.put<Subcategory>(`categories/subcategories/${idSubcategory}`, body);
    return data;
}

export const updateSubsubcategoryAction = async(idSubsubategory: string, payload: Subsubcategory): Promise<Subsubcategory> => {
    const body: Subsubcategory = {
        ...payload,
    }

    const { data } = await fovaeCoreApi.put<Subsubcategory>(`categories/subsubcategories/${idSubsubategory}`, body);
    return data;
}

export const deleteCategoryAction = async(idCategory: string) => {
    const { data } = await fovaeCoreApi.delete<Category>(`categories/${idCategory}`);
    
    return data;
}

export const deleteSubcategoryAction = async(idSubcategory: string) => {
    const { data } = await fovaeCoreApi.delete<Subcategory>(`categories/subcategories/${idSubcategory}`);
    
    return data;
}

export const deleteSubsubcategoryAction = async(idSubsubcategory: string) => {
    const { data } = await fovaeCoreApi.delete<Subsubcategory>(`categories/subsubcategories/${idSubsubcategory}`);
    
    return data;
}