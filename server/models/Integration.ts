import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { applyUpdatedAt, timestamps } from "./common.js";

/** Pro：API 存取金鑰（Phase 3，PRODUCT_DECISIONS §6） */
const apiKeySchema = new Schema(
  {
    organizerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, maxlength: 128 },
    keyPrefix: { type: String, required: true, maxlength: 16 },
    keyHash: { type: String, required: true },
    scopes: [{ type: String }],
    lastUsedAt: Date,
    expiresAt: Date,
    revokedAt: Date,
    ...timestamps,
  },
  { collection: "api_keys" }
);

applyUpdatedAt(apiKeySchema);

const webhookEndpointSchema = new Schema(
  {
    organizerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    url: { type: String, required: true },
    events: [{ type: String }],
    secret: { type: String, required: true },
    active: { type: Boolean, default: true },
    ...timestamps,
  },
  { collection: "webhook_endpoints" }
);

applyUpdatedAt(webhookEndpointSchema);

const webhookDeliverySchema = new Schema(
  {
    endpointId: { type: Schema.Types.ObjectId, ref: "WebhookEndpoint", required: true },
    eventType: { type: String, required: true },
    payload: Schema.Types.Mixed,
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    attempts: { type: Number, default: 0 },
    lastError: String,
    deliveredAt: Date,
    ...timestamps,
  },
  { collection: "webhook_deliveries" }
);

webhookDeliverySchema.index({ endpointId: 1, createdAt: -1 });

export type IApiKey = InferSchemaType<typeof apiKeySchema> & { _id: mongoose.Types.ObjectId };
export type IWebhookEndpoint = InferSchemaType<typeof webhookEndpointSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type IWebhookDelivery = InferSchemaType<typeof webhookDeliverySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ApiKey: Model<IApiKey> =
  mongoose.models.ApiKey ?? mongoose.model<IApiKey>("ApiKey", apiKeySchema);
export const WebhookEndpoint: Model<IWebhookEndpoint> =
  mongoose.models.WebhookEndpoint ??
  mongoose.model<IWebhookEndpoint>("WebhookEndpoint", webhookEndpointSchema);
export const WebhookDelivery: Model<IWebhookDelivery> =
  mongoose.models.WebhookDelivery ??
  mongoose.model<IWebhookDelivery>("WebhookDelivery", webhookDeliverySchema);
