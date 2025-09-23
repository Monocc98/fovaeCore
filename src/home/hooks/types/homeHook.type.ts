import { type AppDispatch, type RootState } from "@/store/store";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";

// Para dispatch tipado
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Para selector tipado
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;