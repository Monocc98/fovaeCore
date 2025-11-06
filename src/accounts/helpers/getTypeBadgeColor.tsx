 export  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "CASH":
        return "bg-green-100 text-green-800";
      case "MOVEMENTS":
        return "bg-blue-100 text-blue-800";
      case "INVESTMENT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
