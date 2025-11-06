import { useOutletContext } from "react-router"
import type { OutletContext } from "../../home/layouts/HomeLayoutV2";

export const useOverlay = () => {
    const ctx = useOutletContext<OutletContext>();
    return ctx?.overlay;
}