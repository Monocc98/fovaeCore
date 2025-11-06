import { Outlet, useOutletContext } from "react-router";
import type { OutletContext as V2OutletContext } from "@/home/layouts/HomeLayoutV2";

export const ContainerLayout = () => {
  // toma el contexto del padre (HomeLayoutV2)
  const parentCtx = useOutletContext<V2OutletContext>(); // { overlay?: HomeResponse }

  // lo reinyectas en tu Outlet para que llegue a los hijos (BrowsePage, etc.)
  return <Outlet context={parentCtx} />;
};
