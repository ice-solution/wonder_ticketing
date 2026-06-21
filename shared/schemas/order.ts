import { z } from "zod";

export const CheckoutItemSchema = z.object({
  ticketTypeId: z.string(),
  quantity: z.number().int().min(1),
  attendees: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      })
    )
    .optional(),
  seatNumbers: z.array(z.string()).optional(),
});

export const CheckoutInputSchema = z.object({
  eventId: z.string(),
  buyerName: z.string().min(1),
  buyerEmail: z.string().email(),
  buyerPhone: z.string().min(1),
  items: z.array(CheckoutItemSchema).min(1),
  donationAmount: z.number().min(0).optional(),
  discountCode: z.string().optional(),
  referralCode: z.string().optional(),
  customAnswers: z
    .array(
      z.object({
        questionId: z.string(),
        answer: z.string(),
      })
    )
    .optional(),
  paymentMethod: z.enum(["fps", "payme", "wechat", "alipay", "card"]),
  origin: z.string().url(),
  locale: z.enum(["zh-TW", "en"]).default("zh-TW"),
  /** 座位預留 ID（enableSeating 活動必填） */
  reservationId: z.string().optional(),
  /** Private 活動邀請 token */
  inviteToken: z.string().optional(),
});

export const WalkInCheckoutSchema = z.object({
  eventId: z.string(),
  buyerName: z.string().min(1),
  buyerEmail: z.string().email(),
  buyerPhone: z.string().min(1),
  items: z.array(CheckoutItemSchema).min(1),
  walkInNote: z.string().optional(),
});
