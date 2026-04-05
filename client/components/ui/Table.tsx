import React from 'react';

export const Table = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`w-full overflow-auto ${className}`}>
    <table className="w-full text-sm text-left text-slate-500">
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <thead className={`text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200 ${className}`}>
    {children}
  </thead>
);

export const TableBody = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <tbody className={`divide-y divide-slate-200 ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <tr className={`bg-white hover:bg-slate-50 transition-colors ${className}`}>
    {children}
  </tr>
);

export const TableHead = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <th className={`px-6 py-4 font-semibold text-slate-900 ${className}`}>
    {children}
  </th>
);

export const TableCell = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <td className={`px-6 py-4 ${className}`}>
    {children}
  </td>
);
