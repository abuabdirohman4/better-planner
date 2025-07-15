import { Metadata } from "next";
import React from "react";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import { PlusIcon } from "@/icons";

export const metadata: Metadata = {
  title: "Next.js Badge | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Badge page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
  // other metadata
};

const badgeColors = [
  "primary",
  "success",
  "error",
  "warning",
  "info",
  "light",
  "dark",
] as const;

// type BadgeColor = typeof badgeColors[number];

type BadgeSectionProps = {
  title: string;
  variant: "light" | "solid";
  startIcon?: boolean;
  endIcon?: boolean;
};

function BadgeSection({ title, variant, startIcon, endIcon }: BadgeSectionProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-6 py-5">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
          {title}
        </h3>
      </div>
      <div className="p-6 border-t border-gray-100 dark:border-gray-800 xl:p-10">
        <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
          {badgeColors.map((color) => (
            <Badge
              key={color}
              variant={variant}
              color={color}
              startIcon={startIcon ? <PlusIcon /> : undefined}
              endIcon={endIcon ? <PlusIcon /> : undefined}
            >
              {color.charAt(0).toUpperCase() + color.slice(1)}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BadgePage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Badges" />
      <div className="space-y-5 sm:space-y-6">
        <BadgeSection title="With Light Background" variant="light" />
        <BadgeSection title="With Solid Background" variant="solid" />
        <BadgeSection title="Light Background with Left Icon" variant="light" startIcon />
        <BadgeSection title="Solid Background with Left Icon" variant="solid" startIcon />
        <BadgeSection title="Light Background with Right Icon" variant="light" endIcon />
        <BadgeSection title="Solid Background with Right Icon" variant="solid" endIcon />
      </div>
    </div>
  );
}
