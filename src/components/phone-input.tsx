"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { COUNTRY_DIAL_CODE, nationalPhoneDigits } from "@/lib/phone";
import { cn } from "@/lib/utils";

type PhoneInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> & {
  /** The national part only — bare digits, no country code, no trunk zero. */
  value: string;
  onValueChange: (value: string) => void;
};

/**
 * Phone field with the country code fixed in place. The "+92" is furniture
 * rather than text, so it cannot be backspaced away and a number can never end
 * up with two country codes. Anything pasted in — a full "+92 300 1234567", a
 * local "0300-1234567" — is reduced to the national part as it lands.
 *
 * The value is the national part; pass it through toInternationalPhone before
 * saving or searching.
 */
function PhoneInput({
  value,
  onValueChange,
  className,
  ...props
}: PhoneInputProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <span className="pointer-events-none absolute left-3 text-base text-muted-foreground select-none md:text-[0.95rem]">
        +{COUNTRY_DIAL_CODE}
      </span>
      <Input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={11}
        placeholder="3001234567"
        style={{
          paddingLeft: `calc(${COUNTRY_DIAL_CODE.length + 1}ch + 1.35rem)`,
        }}
        {...props}
        value={value}
        onChange={(e) => onValueChange(nationalPhoneDigits(e.target.value))}
      />
    </div>
  );
}

export { PhoneInput };
