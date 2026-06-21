export type CartLine = {
  ticketTypeId: string;
  quantity: number;
  seatNumbers?: string[];
};

export function parseCart(search: string): CartLine[] {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const cart = params.get("cart");
  if (cart) {
    try {
      return JSON.parse(decodeURIComponent(cart)) as CartLine[];
    } catch {
      return [];
    }
  }
  const t = params.get("t");
  if (t) return [{ ticketTypeId: t, quantity: Number(params.get("q") ?? 1) }];
  return [];
}

export function cartTicketCount(cart: CartLine[]) {
  return cart.reduce((s, i) => s + i.quantity, 0);
}

/** 將座位依序分配到各 cart 行 */
export function assignSeatsToCart(cart: CartLine[], seatNumbers: string[]): CartLine[] {
  let idx = 0;
  return cart.map((line) => {
    const seats = seatNumbers.slice(idx, idx + line.quantity);
    idx += line.quantity;
    return { ...line, seatNumbers: seats.length ? seats : undefined };
  });
}
