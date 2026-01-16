import { CheckCircle, AlertCircle, Clock } from "lucide-react";

export const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "border-yellow-300 bg-yellow-50 text-yellow-800";
    case "FAILED":
      return "border-red-300 bg-red-50 text-red-800";
    case "PROCESSING":
      return "border-blue-300 bg-blue-50 text-blue-800";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "PENDING":
      return Clock;
    case "FAILED":
      return AlertCircle;
    case "PROCESSING":
      return Clock;
    default:
      return CheckCircle;
  }
};
