
import React from 'react';

export const MagicWandIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className || "w-6 h-6"}
  >
    <path
      fillRule="evenodd"
      d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69a.75.75 0 01.981.981A10.501 10.501 0 0118 16.5a10.5 10.5 0 01-10.5 10.5h-1.5a10.5 10.5 0 01-10.5-10.5v-1.5A10.5 10.5 0 015.25 4.5 10.499 10.499 0 019.528 1.718zm.002 4.5a.75.75 0 01.53-.22h.004a.75.75 0 01.53.22a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 11-1.06-1.06l2.5-2.5zm1.06 1.06a.75.75 0 010-1.06l2.5-2.5a.75.75 0 111.06 1.06l-2.5 2.5a.75.75 0 01-1.06 0z"
      clipRule="evenodd"
    />
  </svg>
);

export const UploadIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className || "w-6 h-6"}
  >
    <path
      fillRule="evenodd"
      d="M10.5 3.75a.75.75 0 00-1.5 0v8.25L5.72 8.72a.75.75 0 00-1.06 1.06l4.5 4.5a.75.75 0 001.06 0l4.5-4.5a.75.75 0 00-1.06-1.06L12 12V3.75zM3 16.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V17.25a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V17.25a.75.75 0 01.75-.75z"
      clipRule="evenodd"
    />
  </svg>
);

export const SpinnerIcon = () => (
    <svg className="animate-spin h-10 w-10 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
