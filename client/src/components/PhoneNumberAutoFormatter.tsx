import { useEffect } from "react";
import { formatKoreanPhone } from "@/lib/phoneFormat";

export function PhoneNumberAutoFormatter() {
  useEffect(() => {
    const formatContactInput = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.placeholder !== "031-000-0000") return;
      const formatted = formatKoreanPhone(target.value);
      if (target.value !== formatted) target.value = formatted;
    };
    document.addEventListener("input", formatContactInput, true);
    return () => document.removeEventListener("input", formatContactInput, true);
  }, []);

  return null;
}
