import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const safeToDate = (val: unknown): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "string") {
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof val === "object") {
    const obj = val as { toDate?: () => Date; seconds?: number };
    if (typeof obj.toDate === "function") return obj.toDate();
    if (typeof obj.seconds === "number") return new Date(obj.seconds * 1000);
  }
  if (typeof val === "number") {
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
};

/** Format a number as NPR currency */
export const formatPrice = (price: number): string => {
  return `NPR ${price.toLocaleString("en-NP")}`;
};
