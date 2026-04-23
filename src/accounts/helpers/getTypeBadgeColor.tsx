 export  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "CASH":
        return "bg-green-100 text-green-800";
      case "MOVEMENTS":
        return "bg-slate-100 text-slate-800";
      case "INVESTMENT":
        return "bg-rose-100 text-primary";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
