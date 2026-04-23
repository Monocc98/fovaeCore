import { Building2, Wallet } from "lucide-react";

  export const getTypeIcon = (type: string) => {
    switch (type) {
      case "CASH":
        return <Wallet className="w-5 h-5 text-green-600" />;
      case "MOVEMENTS":
        return <Building2 className="w-5 h-5 text-secondary" />;
      case "INVESTMENT":
        return <Building2 className="w-5 h-5 text-primary" />;
      default:
        return <Wallet className="w-5 h-5 text-gray-600" />;
    }
  };
