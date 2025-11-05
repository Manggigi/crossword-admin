import * as React from "react";
import { cn } from "~/lib/utils";

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full text-sm", className)} {...props} />;
}
export function THead(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="bg-gray-50 dark:bg-gray-900/30" {...props} />;
}
export function TBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}
export function TR(props: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className="border-b last:border-0 border-gray-200 dark:border-gray-800" {...props} />;
}
export function TH(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className="text-left px-3 py-2 font-semibold" {...props} />;
}
export function TD(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className="px-3 py-2" {...props} />;
}


