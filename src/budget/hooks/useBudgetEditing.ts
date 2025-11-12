import { useState } from "react";


export const useBudgetEditing = () => {
const [editingCell, setEditingCell] = useState<{ nodeKey: string; month: number } | null>(null);
const [editValue, setEditValue] = useState<string>("");
const startEditing = (nodeKey: string, month: number, current: number) => {
setEditingCell({ nodeKey, month });
setEditValue(String(current ?? 0));
};
const cancelEditing = () => { setEditingCell(null); setEditValue(""); };
return { editingCell, editValue, setEditValue, startEditing, cancelEditing } as const;
};