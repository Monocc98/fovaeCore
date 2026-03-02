export interface Category {
    name:              string;
    scope:             string;
    company:           string;
    type:              string,
    _id:               string;
    sortIndex?:        number;
    subcategories?: Subcategory[];
}

export interface Subcategory {
    _id:               string;
    name:              string;
    scope:             string;
    parent:            string;
    company:           string;
    sortIndex?:        number;
    subsubcategories?: Subsubcategory[];
}

export interface Subsubcategory {
    _id:               string;
    name:              string;
    scope:             string;
    parent:            string;
    company:           string;
    sortIndex?:        number;
}
