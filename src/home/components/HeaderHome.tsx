import { CustomLogo } from "@/components/custom/CustomLogo";
import { User } from "lucide-react";

interface Props {
  username: string;
}

export const HeaderHome = ({ username }: Props) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <CustomLogo />

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-red-800 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {username}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
