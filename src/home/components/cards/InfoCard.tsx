import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
  title: string;
  icon: React.ReactNode;
  description?: string;
}

export const InfoCard = ({ title, icon, description, children }: Props) => {
  return (
    <Card className="h-fit gap-0 overflow-hidden py-0">
      <CardHeader className="border-b border-rose-200 bg-gradient-to-r from-rose-50 to-slate-100 px-6 py-4">
        <CardTitle className="text-lg font-semibold">
          <div className="flex items-center justify-between">
            <span className="text-gray-950">{title}</span>
            <span className="text-gray-500">{icon}</span>
          </div>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-5">{children}</CardContent>
    </Card>
  );
};
