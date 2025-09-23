import { useHomeStore } from "@/home/hooks/useHomeStore";

export const CustomLogo = () => {
  const { resetHome } = useHomeStore();

  return (
    <div
      className="cursor-pointer felx items-center whitespace-nowrap"
      onClick={resetHome}
    >
      <span className="text-red-800 font-montserrat font-bold text-xl m-0 whitespace-nowrap">
        FOVAE |
      </span>
      <span className="text-muted-foreground m-0 px-2 whitespace-nowrap">
        CORE
      </span>
    </div>
  );
};
