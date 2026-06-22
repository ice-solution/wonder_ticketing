import { z } from "zod";

export const CreateEventInputSchema = z.object({
  title: z.string().min(1).max(255),
  titleEn: z.string().max(255).optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  eventDate: z.coerce.date(),
  eventEndDate: z.coerce.date().optional(),
  venue: z.string().min(1).max(500),
  venueAddress: z.string().optional(),
  category: z.string().max(64).optional(),
  region: z.string().max(32).optional(),
  city: z.string().max(32).optional(),
  eventType: z.enum(["in_person", "online", "hybrid"]).default("in_person"),
  visibility: z.enum(["public", "private", "members_only"]).default("public"),
  maxAttendees: z.number().int().positive().default(300),
  termsAndConditions: z.string().optional(),
  enableDonation: z.boolean().optional(),
  donationGoal: z.number().min(0).optional(),
  metaPixelId: z.string().max(64).optional(),
  googleAnalyticsId: z.string().max(32).optional(),
  enableEmbedWidget: z.boolean().optional(),
  bannerUrl: z.string().max(2048).optional().or(z.literal("")),
});

export const UpdateEventInputSchema = CreateEventInputSchema.partial().extend({
  id: z.string(),
  status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
});
