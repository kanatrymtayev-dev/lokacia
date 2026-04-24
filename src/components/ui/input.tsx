"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, icon, id, className = "", ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors ${
              error
                ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                : "border-gray-200 focus:ring-primary/20 focus:border-primary"
            } ${icon ? "pl-10" : ""} ${
              props.disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "text-gray-900"
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
        {!error && helper && <p className="text-xs text-gray-400 mt-1.5">{helper}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
