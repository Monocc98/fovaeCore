import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
  title: string;
  icon: React.ReactNode;
  description?: string;
}

export const InfoCard = ({ title, icon, description, children }: Props) => {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          <div className="flex items-center justify-between">
            {title}
            {icon}
          </div>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
};
