"use client";

import * as React from "react";
import { ContactCard, ContactCardProps } from "./contact-card";
import { WorkingHoursTable } from "./working-hours-table";
import { cn } from "@/lib/utils";

export interface StoreInfoCardProps extends ContactCardProps {
  showWorkingHours?: boolean;
}

/**
 * Composite Store Information Component according to docs/COMPONENT_ARCHITECTURE.md
 * Integrates store info, geolocation, working hours, and delivery policies.
 */
export function StoreInfoCard({
  className,
  showWorkingHours = true,
  ...props
}: StoreInfoCardProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <ContactCard {...props} />
      {showWorkingHours && <WorkingHoursTable />}
    </div>
  );
}
