import { useNavigate } from "react-router";

export const CustomLogo = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/v2");
  };

  return (
    <div
      className="cursor-pointer flex items-center whitespace-nowrap"
      onClick={handleClick}
    >
      <span className="text-red-800 font-montserrat font-bold text-xl m-0 whitespace-nowrap">
        FOVAE&nbsp;|
      </span>
      <p className="text-muted-foreground m-0 px-2 whitespace-nowrap">CORE</p>
    </div>
  );
};
