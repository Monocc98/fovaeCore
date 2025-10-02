 export const getTransactionColor = (amount: number, transferId: string = "") => {
    if (transferId === "") {
      if (amount > 0) return "text-green-600";
      if (amount < 0) return "text-red-600";
    } else {
      return "text-blue-600";
    }
  }