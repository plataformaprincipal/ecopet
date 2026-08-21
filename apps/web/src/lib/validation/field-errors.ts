import type { ZodError } from "zod";

const CHECKOUT_PATH_TO_FIELD: Record<string, string> = {
  phone: "phone",
  "address.street": "street",
  "address.number": "number",
  "address.city": "city",
  "address.state": "state",
  "address.zipCode": "zipCode",
  "address.district": "district",
  "address.complement": "complement",
  deliveryMethod: "deliveryMethod",
  paymentMethod: "paymentMethod",
  notes: "notes",
};

export function zodIssuesToFieldMap(
  error: ZodError,
  pathMap: Record<string, string> = CHECKOUT_PATH_TO_FIELD
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    const field = pathMap[path] ?? issue.path[issue.path.length - 1]?.toString() ?? path;
    if (!field || fields[field]) continue;
    fields[field] = issue.message;
  }
  return fields;
}

export function firstFieldError(fields: Record<string, string>): string | undefined {
  return Object.values(fields)[0];
}
