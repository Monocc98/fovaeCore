import { Link } from "react-router";

export const CustomLogo = () => {
  return (
    <Link to="/" className="felx items-center whitespace-nowrap">
      <span className="text-red-800 font-montserrat font-bold text-xl m-0 whitespace-nowrap">
        FOVAE |
      </span>
      <span className="text-muted-foreground m-0 px-2 whitespace-nowrap">
        CORE
      </span>
    </Link>
  );
};
