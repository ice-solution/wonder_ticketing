import type { CartLine } from "./cart";

type TicketTypeRow = { _id: unknown; name: string; price: number };

type Discount = { type: "percentage" | "fixed"; value: number };

export function computeCartSummary(
  cart: CartLine[],
  types: TicketTypeRow[],
  discount?: Discount | null
) {
  const lines = cart
    .filter((line) => line.quantity > 0)
    .map((line) => {
      const tt = types.find((t) => String(t._id) === line.ticketTypeId);
      const unitPrice = tt?.price ?? 0;
      const subtotal = unitPrice * line.quantity;
      return {
        ticketTypeId: line.ticketTypeId,
        name: tt?.name ?? line.ticketTypeId,
        quantity: line.quantity,
        unitPrice,
        subtotal,
      };
    });

  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  let discountAmount = 0;
  if (discount) {
    discountAmount =
      discount.type === "percentage"
        ? Math.round((subtotal * discount.value) / 100)
        : Math.min(discount.value, subtotal);
  }
  const total = Math.max(0, subtotal - discountAmount);

  return { lines, subtotal, discountAmount, total };
}
