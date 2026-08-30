"use client";

import React from "react";
import { Input } from "@lomi./ui/input";
import type { CheckoutCustomFieldDefinition } from "@lomi./shared";
import type { TranslateFn } from "./types";

interface CustomCheckoutFieldsSectionProps {
  t: TranslateFn;
  customFields: CheckoutCustomFieldDefinition[];
  customFieldValues: Record<string, string>;
  setCustomFieldValues: (
    value:
      | Record<string, string>
      | ((prev: Record<string, string>) => Record<string, string>),
  ) => void;
}

export function CustomCheckoutFieldsSection({
  t,
  customFields,
  customFieldValues,
  setCustomFieldValues,
}: CustomCheckoutFieldsSectionProps) {
  if (!customFields || customFields.length === 0) {
    return null;
  }

  const handleFieldChange = (fieldId: string, value: string) => {
    setCustomFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const renderField = (field: CheckoutCustomFieldDefinition) => {
    const value = customFieldValues[field.id] || "";
    const roundingClass = "rounded-none";

    const baseClassName = `${roundingClass} w-full bg-white text-gray-900 border-gray-300 placeholder:text-sm text-sm h-10`;

    if (field.type === "checkbox" || field.type === "terms") {
      return (
        <label
          key={field.id}
          className={`flex items-start gap-3 border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 ${roundingClass}`}
        >
          <input
            type="checkbox"
            name={field.id}
            checked={value === "true"}
            onChange={(e) =>
              handleFieldChange(field.id, e.target.checked ? "true" : "")
            }
            required={field.required}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
          />
          <span className="leading-snug">
            {field.label}
            {field.required ? (
              <span className="ml-1 text-red-500">*</span>
            ) : null}
          </span>
        </label>
      );
    }

    return (
      <div key={field.id} className="relative">
        <Input
          type={field.type}
          name={field.id}
          value={value}
          onChange={(e) => handleFieldChange(field.id, e.target.value)}
          placeholder={field.placeholder || field.label}
          required={field.required}
          className={baseClassName}
          pattern={field.validation?.pattern}
        />
        {field.required && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-500 pointer-events-none">
            *
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2.5 translate-y-0.5">
      <label className="block text-sm font-normal text-gray-700 select-none">
        {t("checkout.custom_fields.title")}
      </label>
      <div className="checkout-field-stack overflow-hidden rounded-sm shadow-sm shadow-black/[.04]">
        {customFields.map((field, index) => (
          <div key={field.id} className={index > 0 ? "flex -mt-px" : "flex"}>
            <div className="w-full">
              {renderField(field)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
