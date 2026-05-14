import {
  ChevronDown,
  ChevronRight,
  Edit,
  GripVertical,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { getLevelBadge } from "@/helpers";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategoryAction,
  createSubcategoryAction,
  createSubsubcategoryAction,
  deleteCategoryAction,
  deleteSubcategoryAction,
  deleteSubsubcategoryAction,
  getCategoriesOverloadAction,
  getMembershipsAction,
  reorderCategoriesAction,
  updateCategoryAction,
  updateSubcategoryAction,
  updateSubsubcategoryAction,
} from "@/categories/actions/categories.actions";
import { getErrorMessage } from "@/helpers";
import { toast } from "sonner";

import { DeleteCategoryAlert } from "../components/alerts/DeleteCategoryAlert";
import { useLocation, useNavigate, useParams } from "react-router";
import type { CategoriesResponse, Category } from "@/types";

type Level = "category" | "subcategory" | "subsubcategory";
type Scope = "COMPANY" | "ACCOUNT";
type RowLevel = "category" | "subcategory" | "subsubcategory";
type DeletePayload = { id: string; level: RowLevel };

interface CategoryFormValues {
  name: string;
  level: Level;
  parentId?: string;
  categoryId?: string;
  scope: Scope;
  id?: string;
  type?: string;
  bucket?: string;
  assignedUser?: string;
}

export type Row = {
  id: string;
  level: RowLevel;
  name: string;
  type?: string;
  bucket?: string;
  assignedUser?: string;
  assignedUserDoc?: {
    _id: string;
    name: string;
    email: string;
  };
  path: string;
  scope: "COMPANY" | "ACCOUNT" | string;
  sortIndex?: number;
  catId: string;
  subId?: string;
};

type TreeNode = {
  row: Row;
  children: TreeNode[];
};

type DragState = {
  id: string;
  parentId: string;
  level: RowLevel;
};

const getTypeLabel = (type?: string) => {
  if (type === "INCOME") return "Ingreso";
  if (type === "EXPENSE") return "Egreso";
  return null;
};

const normalizeBucket = (bucket?: string | null) => {
  if (!bucket) return undefined;

  const normalized = String(bucket).trim().toUpperCase().replace(/[\s-]+/g, "_");

  if (normalized === "INCOME" || normalized === "INGRESO" || normalized === "INGRESOS") {
    return "INCOME";
  }

  if (
    normalized === "FIXED_EXPENSE" ||
    normalized === "FIXED_EXPENSES" ||
    normalized === "EGRESO_FIJO" ||
    normalized === "EGRESOS_FIJOS"
  ) {
    return "FIXED_EXPENSE";
  }

  if (
    normalized === "VARIABLE_EXPENSE" ||
    normalized === "VARIABLE_EXPENSES" ||
    normalized === "EGRESO_VARIABLE" ||
    normalized === "EGRESOS_VARIABLES"
  ) {
    return "VARIABLE_EXPENSE";
  }

  if (
    normalized === "UTILITY" ||
    normalized === "UTILITIES" ||
    normalized === "UTILIDAD" ||
    normalized === "UTILIDADES"
  ) {
    return "UTILITY";
  }

  if (normalized === "FAMILY" || normalized === "FAMILIA") {
    return "FAMILY";
  }

  return undefined;
};

const getBucketLabel = (bucket?: string) => {
  const normalizedBucket = normalizeBucket(bucket);

  if (normalizedBucket === "INCOME") return "Ingreso";
  if (normalizedBucket === "FIXED_EXPENSE") return "Egreso Fijo";
  if (normalizedBucket === "VARIABLE_EXPENSE") return "Egreso Variable";
  if (normalizedBucket === "UTILITY") return "Utilidades";
  if (normalizedBucket === "FAMILY") return "Family";
  return null;
};

const getTypeBadgeClass = (type?: string) => {
  if (type === "INCOME") return "bg-green-100 text-green-700 border border-green-200";
  if (type === "EXPENSE") return "bg-red-100 text-red-700 border border-red-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
};

const getBucketBadgeClass = (bucket?: string) => {
  const normalizedBucket = normalizeBucket(bucket);

  if (normalizedBucket === "INCOME") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (normalizedBucket === "FIXED_EXPENSE") return "bg-rose-100 text-rose-700 border border-rose-200";
  if (normalizedBucket === "VARIABLE_EXPENSE") return "bg-orange-100 text-orange-700 border border-orange-200";
  if (normalizedBucket === "UTILITY") return "bg-cyan-100 text-cyan-700 border border-cyan-200";
  if (normalizedBucket === "FAMILY") return "bg-slate-100 text-slate-700 border border-slate-200";

  return "bg-yellow-100 text-yellow-700 border border-yellow-200";
};

const sortBySortIndex = <T extends { sortIndex?: number; name: string }>(items: T[]) =>
  [...items].sort((a, b) => {
    const aIndex = a.sortIndex ?? Number.MAX_SAFE_INTEGER;
    const bIndex = b.sortIndex ?? Number.MAX_SAFE_INTEGER;

    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    return a.name.localeCompare(b.name);
  });

const reorderSiblings = (
  nodes: TreeNode[],
  sourceId: string,
  targetId: string
) => {
  const sourceIndex = nodes.findIndex((node) => node.row.id === sourceId);
  const targetIndex = nodes.findIndex((node) => node.row.id === targetId);

  if (
    sourceIndex === -1 ||
    targetIndex === -1 ||
    sourceIndex === targetIndex
  ) {
    return nodes;
  }

  const nextNodes = [...nodes];
  const [sourceNode] = nextNodes.splice(sourceIndex, 1);
  nextNodes.splice(targetIndex, 0, sourceNode);

  return nextNodes;
};

const reorderTreeByParent = (
  nodes: TreeNode[],
  parentId: string,
  sourceId: string,
  targetId: string
): TreeNode[] => {
  if (parentId === "root") {
    return reorderSiblings(nodes, sourceId, targetId);
  }

  return nodes.map((node) => {
    if (node.row.id === parentId) {
      return {
        ...node,
        children: reorderSiblings(node.children, sourceId, targetId),
      };
    }

    if (node.children.length === 0) {
      return node;
    }

    return {
      ...node,
      children: reorderTreeByParent(node.children, parentId, sourceId, targetId),
    };
  });
};

const findSiblingIdsByParent = (nodes: TreeNode[], parentId: string): string[] => {
  if (parentId === "root") {
    return nodes.map((node) => node.row.id);
  }

  for (const node of nodes) {
    if (node.row.id === parentId) {
      return node.children.map((child) => child.row.id);
    }

    if (node.children.length > 0) {
      const nestedIds = findSiblingIdsByParent(node.children, parentId);

      if (nestedIds.length > 0) {
        return nestedIds;
      }
    }
  }

  return [];
};

export const CategoriesPage = () => {
  const [categoryToDelete, setCategoryToDelete] = useState<Row | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [orderedTree, setOrderedTree] = useState<TreeNode[]>([]);
  const [draggingNode, setDraggingNode] = useState<DragState | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [catFilter, setCatFilter] = useState<string>("");
  const [subFilter, setSubFilter] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId, companyId } = useParams<{
    companyId: string;
    groupId: string;
  }>();

  const backTo = (location.state as any)?.backTo as string | undefined;

  const categoriesQuery = useQuery<CategoriesResponse>({
    queryKey: ["categories", companyId],
    queryFn: () => getCategoriesOverloadAction(companyId!),
    enabled: !!companyId,
  });

  const companyName = categoriesQuery.data?.company?.name;
  const parentCategories: Category[] =
    categoriesQuery.data?.company?.categories ?? [];

  const { register, handleSubmit, watch, reset, setValue } = useForm<CategoryFormValues>({
    defaultValues: {
      name: "",
      level: "category",
      scope: "COMPANY",
      parentId: "",
      categoryId: "",
      type: "",
      bucket: "",
      assignedUser: "",
    },
  });

  const level = watch("level");
  const type = watch("type");
  const bucket = watch("bucket");
  const categoryId = watch("categoryId");
  const parentId = watch("parentId");
  const assignedUser = watch("assignedUser");

  const membershipsQuery = useQuery({
    queryKey: ["memberships"],
    queryFn: getMembershipsAction,
  });

  const partnerOptions = useMemo(() => {
    const byUser = new Map<string, { id: string; name: string; email: string }>();

    for (const membership of membershipsQuery.data?.memberships ?? []) {
      const membershipCompanyId =
        typeof membership.company === "string"
          ? membership.company
          : (membership.company.id ?? membership.company._id ?? "");

      if (membershipCompanyId !== companyId || Number(membership.dividendShare ?? 0) <= 0) {
        continue;
      }

      const id = membership.user.id ?? membership.user._id ?? "";
      if (!id) continue;

      byUser.set(id, {
        id,
        name: membership.user.name,
        email: membership.user.email,
      });
    }

    return Array.from(byUser.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [companyId, membershipsQuery.data?.memberships]);

  const treeRows = useMemo<TreeNode[]>(() => {
    return sortBySortIndex(parentCategories).map((cat) => ({
      row: {
        id: cat._id,
        level: "category",
        name: cat.name,
        path: cat.name,
        scope: cat.scope,
        sortIndex: cat.sortIndex,
        catId: cat._id,
        type: cat.type,
        bucket: normalizeBucket(cat.bucket),
      },
      children: sortBySortIndex(cat.subcategories ?? []).map((sub) => ({
        row: {
          id: sub._id,
          level: "subcategory",
          name: sub.name,
          path: `${cat.name} -> ${sub.name}`,
          scope: sub.scope,
          sortIndex: sub.sortIndex,
          catId: cat._id,
          bucket: normalizeBucket(sub.bucket),
          assignedUser: sub.assignedUser,
          assignedUserDoc: sub.assignedUserDoc,
          subId: sub._id,
        },
        children: sortBySortIndex(sub.subsubcategories ?? []).map((leaf) => ({
          row: {
            id: leaf._id,
            level: "subsubcategory",
            name: leaf.name,
            path: `${cat.name} -> ${sub.name} -> ${leaf.name}`,
            scope: leaf.scope,
            sortIndex: leaf.sortIndex,
            catId: cat._id,
            bucket: normalizeBucket(leaf.bucket),
            subId: sub._id,
          },
          children: [],
        })),
      })),
    }));
  }, [parentCategories]);

  useEffect(() => {
    setOrderedTree(treeRows);
  }, [treeRows]);

  useEffect(() => {
    const nextExpanded = new Set<string>();

    for (const node of treeRows) {
      if (node.children.length > 0) {
        nextExpanded.add(node.row.id);
      }

      for (const child of node.children) {
        if (child.children.length > 0) {
          nextExpanded.add(child.row.id);
        }
      }
    }

    setExpandedNodes(nextExpanded);
  }, [treeRows]);

  useEffect(() => {
    if (level !== "category") {
      if (type) {
        setValue("type", "");
      }
      if (bucket) {
        setValue("bucket", "");
      }
      return;
    }

    if (type === "INCOME") {
      if (bucket !== "INCOME" && bucket !== "UTILITY") {
        setValue("bucket", "INCOME");
      }
      return;
    }

    if (type === "EXPENSE") {
      if (bucket === "INCOME" || bucket === "UTILITY") {
        setValue("bucket", "");
      }
      return;
    }

    setValue("bucket", "");
  }, [bucket, level, type, setValue]);

  useEffect(() => {
    if (level !== "subcategory" && assignedUser) {
      setValue("assignedUser", "");
    }
  }, [assignedUser, level, setValue]);

  useEffect(() => {
    if (level !== "subsubcategory" && categoryId) {
      setValue("categoryId", "");
    }
  }, [categoryId, level, setValue]);

  useEffect(() => {
    if (!showForm) return;

    const frame = requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => cancelAnimationFrame(frame);
  }, [showForm, editingId]);

  const parentOptions = useMemo(() => {
    if (level === "subcategory") {
      return parentCategories.map((c) => ({ id: c._id, name: c.name }));
    }

    if (level === "subsubcategory") {
      if (!categoryId) {
        return [];
      }

      const selectedCategory = parentCategories.find((c) => c._id === categoryId);
      return (selectedCategory?.subcategories ?? []).map((s) => ({ id: s._id, name: s.name }));
    }

    return [];
  }, [categoryId, level, parentCategories]);

  useEffect(() => {
    if (level !== "subsubcategory") return;

    if (!categoryId) {
      if (parentId) {
        setValue("parentId", "");
      }
      return;
    }

    const selectedCategory = parentCategories.find((c) => c._id === categoryId);
    const availableParentIds = new Set((selectedCategory?.subcategories ?? []).map((sub) => sub._id));

    if (parentId && !availableParentIds.has(parentId)) {
      setValue("parentId", "");
    }
  }, [categoryId, level, parentCategories, parentId, setValue]);

  const catOptions = useMemo(
    () => parentCategories.map((c) => ({ id: c._id, name: c.name })),
    [parentCategories]
  );

  const subOptions = useMemo(() => {
    if (!catFilter) return [];
    const cat = parentCategories.find((c) => c._id === catFilter);
    return (cat?.subcategories ?? []).map((s) => ({ id: s._id, name: s.name }));
  }, [catFilter, parentCategories]);

  const onChangeCatFilter = (value: string) => {
    setCatFilter(value);
    setSubFilter("");
  };

  const isFiltering = Boolean(searchTerm.trim() || catFilter || subFilter);

  const filteredTree = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filterNode = (node: TreeNode): TreeNode | null => {
      const matchesText =
        !query ||
        node.row.name.toLowerCase().includes(query) ||
        node.row.path.toLowerCase().includes(query) ||
        (node.row.type?.toLowerCase().includes(query) ?? false) ||
        (normalizeBucket(node.row.bucket)?.toLowerCase().includes(query) ?? false);

      const matchesCat = !catFilter || node.row.catId === catFilter;
      const matchesSub = !subFilter || node.row.subId === subFilter;
      const children = node.children
        .map((child) => filterNode(child))
        .filter((child): child is TreeNode => child !== null);
      const matchesSelf = matchesText && matchesCat && matchesSub;

      if (matchesSelf || children.length > 0) {
        return {
          ...node,
          children,
        };
      }

      return null;
    };

    return orderedTree
      .map((node) => filterNode(node))
      .filter((node): node is TreeNode => node !== null);
  }, [orderedTree, searchTerm, catFilter, subFilter]);

  const visibleCount = useMemo(() => {
    const countNodes = (nodes: TreeNode[]): number =>
      nodes.reduce((total, node) => total + 1 + countNodes(node.children), 0);

    return countNodes(filteredTree);
  }, [filteredTree]);

  const createMut = useMutation({
    mutationFn: async (payload: CategoryFormValues) => {
      if (payload.level === "category") {
        return createCategoryAction({
          name: payload.name,
          scope: payload.scope,
          type: payload.type,
          bucket: normalizeBucket(payload.bucket),
          company: companyId!,
        } as any);
      }

      if (payload.level === "subcategory") {
        return createSubcategoryAction({
          name: payload.name,
          scope: payload.scope,
          parent: payload.parentId,
          assignedUser: payload.assignedUser || undefined,
          company: companyId!,
        } as any);
      }

      return createSubsubcategoryAction({
        name: payload.name,
        scope: payload.scope,
        parent: payload.parentId,
        company: companyId!,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["categories", companyId],
      });
      reset({
        name: "",
        level: "category",
        scope: "COMPANY",
        parentId: "",
        categoryId: "",
        type: "",
        bucket: "",
        assignedUser: "",
      });
      setEditingId(null);
      setShowForm(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo crear la categoria."));
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: CategoryFormValues;
    }) => {
      if (data.level === "category") {
        return updateCategoryAction(id, {
          name: data.name,
          scope: data.scope,
          type: data.type,
          bucket: normalizeBucket(data.bucket),
          company: companyId!,
        } as any);
      }

      if (data.level === "subcategory") {
        return updateSubcategoryAction(id, {
          name: data.name,
          scope: data.scope,
          parent: data.parentId,
          assignedUser: data.assignedUser || undefined,
          company: companyId!,
        } as any);
      }

      return updateSubsubcategoryAction(id, {
        name: data.name,
        scope: data.scope,
        parent: data.parentId,
        company: companyId!,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["categories", companyId],
      });
      reset({
        name: "",
        level: "category",
        scope: "COMPANY",
        parentId: "",
        categoryId: "",
        type: "",
        bucket: "",
        assignedUser: "",
      });
      setEditingId(null);
      setShowForm(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo actualizar la categoria."));
    },
  });

  const deleteMut = useMutation<void, unknown, DeletePayload>({
    mutationFn: async ({ id, level }) => {
      if (level === "category") {
        await deleteCategoryAction(id);
        return;
      }

      if (level === "subcategory") {
        await deleteSubcategoryAction(id);
        return;
      }

      await deleteSubsubcategoryAction(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["categories", companyId],
      });
      reset();
      setCategoryToDelete(null);
      setEditingId(null);
      setShowForm(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo eliminar la categoria."));
    },
  });

  const reorderMut = useMutation({
    mutationFn: reorderCategoriesAction,
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["categories", companyId],
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo reordenar la categoria."));
    },
  });

  const openCreate = () => {
    setEditingId(null);
    reset({
      name: "",
      level: "category",
      scope: "COMPANY",
      parentId: "",
      categoryId: "",
      type: "",
      bucket: "",
      assignedUser: "",
    });
    setShowForm(true);
  };

  const openEdit = (row: Row) => {
    if (row.level === "category") {
      reset({
        name: row.name,
        level: "category",
        scope: (row.scope as Scope) ?? "COMPANY",
        parentId: "",
        categoryId: "",
        type: row.type,
        bucket: normalizeBucket(row.bucket) ?? "",
        assignedUser: "",
      });
    } else if (row.level === "subcategory") {
      reset({
        name: row.name,
        level: "subcategory",
        scope: (row.scope as Scope) ?? "COMPANY",
        parentId: row.catId,
        categoryId: "",
        assignedUser: row.assignedUser ?? "",
      });
    } else {
      reset({
        name: row.name,
        level: "subsubcategory",
        scope: (row.scope as Scope) ?? "COMPANY",
        categoryId: row.catId,
        parentId: row.subId,
        assignedUser: "",
      });
    }

    setEditingId(row.id);
    setShowForm(true);
  };

  const handleDeleteClick = (category: Row) => {
    setCategoryToDelete(category);
  };

  const cancelDelete = () => setCategoryToDelete(null);

  const confirmDelete = () => {
    if (!categoryToDelete) return;

    deleteMut.mutate({
      id: categoryToDelete.id,
      level: categoryToDelete.level,
    });
  };

  const onSubmit = (form: CategoryFormValues) => {
    if (form.level !== "category" && !form.parentId) {
      return;
    }

    if (form.level === "category") {
      if (!form.type) {
        return;
      }

      if (!form.bucket) {
        return;
      }
    }

    const normalizedForm: CategoryFormValues = {
      ...form,
      bucket: normalizeBucket(form.bucket),
    };

    if (editingId) {
      updateMut.mutate({ id: editingId, data: normalizedForm });
    } else {
      createMut.mutate(normalizedForm);
    }
  };

  const handleEdit = (row: Row) => {
    openEdit(row);
  };

  const handleBack = () => {
    if (backTo) {
      navigate(backTo, { replace: true });
    } else if (companyId) {
      navigate(`/group/${groupId}/company/${companyId}`, { replace: true });
    } else {
      navigate(-1);
    }
  };

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, dragState: DragState) => {
    if (reorderMut.isPending) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dragState.id);
    setDraggingNode(dragState);
  };

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>,
    target: DragState
  ) => {
    if (
      reorderMut.isPending ||
      !draggingNode ||
      draggingNode.id === target.id ||
      draggingNode.parentId !== target.parentId ||
      draggingNode.level !== target.level
    ) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (dragOverId !== target.id) {
      setDragOverId(target.id);
    }
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
    target: DragState
  ) => {
    event.preventDefault();

    if (
      reorderMut.isPending ||
      !draggingNode ||
      draggingNode.id === target.id ||
      draggingNode.parentId !== target.parentId ||
      draggingNode.level !== target.level
    ) {
      setDragOverId(null);
      return;
    }

    const previousTree = orderedTree;
    const nextTree = reorderTreeByParent(
      orderedTree,
      target.parentId,
      draggingNode.id,
      target.id
    );
    const orderedIds = findSiblingIdsByParent(nextTree, target.parentId);

    setOrderedTree(nextTree);

    reorderMut.mutate(
      {
        level: target.level,
        parentId: target.parentId,
        orderedIds,
      },
      {
        onError: () => {
          setOrderedTree(previousTree);
        },
      }
    );

    setDragOverId(null);
    setDraggingNode(null);
  };

  const handleDragEnd = () => {
    setDraggingNode(null);
    setDragOverId(null);
  };

  const renderTree = (nodes: TreeNode[], depth = 0, parentId = "root") =>
    nodes.map((node) => {
      const { row, children } = node;
      const hasChildren = children.length > 0;
      const isExpanded = hasChildren && (isFiltering || expandedNodes.has(row.id));
      const typeLabel = getTypeLabel(row.type);
      const normalizedRowBucket = normalizeBucket(row.bucket);
      const bucketLabel = getBucketLabel(normalizedRowBucket);
      const dragState: DragState = {
        id: row.id,
        parentId,
        level: row.level,
      };
      const isDropTarget = dragOverId === row.id;
      const isDragging = draggingNode?.id === row.id;

      return (
        <div key={row.id}>
          <div
            draggable={!isFiltering && !reorderMut.isPending}
            onDragStart={(event) => handleDragStart(event, dragState)}
            onDragOver={(event) => handleDragOver(event, dragState)}
            onDrop={(event) => handleDrop(event, dragState)}
            onDragEnd={handleDragEnd}
            className={`flex items-center justify-between gap-4 px-4 py-3 transition-colors ${
              isDropTarget
                ? "bg-rose-50 ring-1 ring-inset ring-rose-200"
                : "hover:bg-gray-50"
            } ${isDragging ? "opacity-60" : ""} ${
              isFiltering || reorderMut.isPending ? "cursor-default" : "cursor-move"
            }`}
          >
            <div
              className="flex min-w-0 flex-1 items-center gap-3"
              style={{ paddingLeft: `${depth * 1.25}rem` }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400">
                <GripVertical className="h-4 w-4" />
              </div>

              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleNode(row.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  aria-label={
                    isExpanded ? "Colapsar categoria" : "Expandir categoria"
                  }
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <span className="h-8 w-8 shrink-0" />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">{row.name}</span>
                  {getLevelBadge(row.level)}
                  {typeLabel && (
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getTypeBadgeClass(row.type)}`}>
                      {typeLabel}
                    </span>
                  )}
                  {bucketLabel && (
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getBucketBadgeClass(normalizedRowBucket)}`}>
                      {bucketLabel}
                    </span>
                  )}
                  {row.assignedUserDoc && (
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700">
                      {row.assignedUserDoc.name}
                    </span>
                  )}
                  {!normalizedRowBucket && row.level === "category" && (
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getBucketBadgeClass()}`}>
                      Sin clasificar
                    </span>
                  )}
                </div>

                {depth > 0 && (
                  <p className="truncate text-xs text-gray-500">{row.path}</p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => handleEdit(row)}
                className="p-1 text-green-600 hover:text-green-800 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteClick(row)}
                className="p-1 text-red-600 hover:text-red-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div className="border-l border-gray-100 ml-8">
              {renderTree(children, depth + 1, row.id)}
            </div>
          )}
        </div>
      );
    });

  return (
    <>
      <div className="max-w-6xl py-6 mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Administrar Categorias
              </h2>
              <p className="text-gray-600 mt-1">
                Gestiona las categorias de movimientos financieros para{" "}
                {companyName}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Volver al Dashboard
              </button>
              <button
                onClick={openCreate}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Categoria</span>
              </button>
            </div>
          </div>

          {showForm && (
            <form
              ref={formRef}
              onSubmit={handleSubmit(onSubmit)}
              className="bg-gray-50 rounded-lg p-6 mb-8"
            >
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    {...register("name")}
                    placeholder="Nombre de la categoria..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel
                  </label>
                  <select
                    {...register("level")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="category">Categoria</option>
                    <option value="subcategory">Subcategoria</option>
                    <option value="subsubcategory">Detalle</option>
                  </select>
                </div>

                {level !== "category" ? (
                  <>
                    {level === "subsubcategory" && (
                      <div className="col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Filtrar por categoria
                        </label>
                        <select
                          {...register("categoryId")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="">Seleccionar categoria...</option>
                          {catOptions.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {level === "subcategory" ? "Categoria Padre" : "Subcategoria Padre"}
                      </label>
                      <select
                        {...register("parentId")}
                        disabled={level === "subsubcategory" && !categoryId}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="">
                          {level === "subsubcategory"
                            ? "Seleccionar subcategoria..."
                            : "Seleccionar..."}
                        </option>
                        {parentOptions.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {level === "subcategory" && (
                      <div className="col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Socio Family
                        </label>
                        <select
                          {...register("assignedUser")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="">Sin socio asignado</option>
                          {partnerOptions.map((partner) => (
                            <option key={partner.id} value={partner.id}>
                              {partner.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo
                      </label>
                      <select
                        {...register("type")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="INCOME">Ingreso</option>
                        <option value="EXPENSE">Egreso</option>
                      </select>
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bucket
                      </label>
                      <select
                        {...register("bucket")}
                        disabled={!type}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="">Seleccionar...</option>
                        {type === "INCOME" && (
                          <>
                            <option value="INCOME">Ingreso</option>
                            <option value="UTILITY">Utilidades</option>
                          </>
                        )}
                        {type === "EXPENSE" && (
                          <>
                            <option value="FIXED_EXPENSE">Egreso Fijo</option>
                            <option value="VARIABLE_EXPENSE">Egreso Variable</option>
                            <option value="FAMILY">Family</option>
                          </>
                        )}
                      </select>
                    </div>
                  </>
                )}

                <div className="col-span-2 flex items-end">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {editingId ? "Actualizar" : "Agregar"}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <select
              value={catFilter}
              onChange={(e) => onChangeCatFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Todas las categorias</option>
              {catOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={subFilter}
              onChange={(e) => setSubFilter(e.target.value)}
              disabled={!catFilter}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">Todas las subcategorias</option>
              {subOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="text-sm text-gray-500">
              {visibleCount} categorias encontradas
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Arbol de categorias
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Arrastra para reordenar dentro del mismo nivel. Mientras haya filtros activos, el reordenamiento se desactiva.
              </p>
            </div>

            {filteredTree.length > 0 ? (
              <div className="divide-y divide-gray-200 bg-white">
                {renderTree(filteredTree)}
              </div>
            ) : (
              <div className="bg-white px-4 py-8 text-center text-sm text-gray-500">
                No hay categorias que coincidan con los filtros actuales.
              </div>
            )}
          </div>
        </div>
      </div>

      {categoryToDelete && (
        <DeleteCategoryAlert
          category={categoryToDelete}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          isLoading={deleteMut.isPending}
        />
      )}
    </>
  );
};
