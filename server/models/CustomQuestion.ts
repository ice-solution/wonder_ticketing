import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./common.js";

const customQuestionSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    question: { type: String, required: true, maxlength: 500 },
    questionEn: { type: String, maxlength: 500 },
    type: {
      type: String,
      enum: ["text", "select", "checkbox", "radio"],
      default: "text",
    },
    options: [String],
    isRequired: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    ...timestamps,
  },
  { collection: "custom_questions" }
);

export type ICustomQuestion = InferSchemaType<typeof customQuestionSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const CustomQuestion: Model<ICustomQuestion> =
  mongoose.models.CustomQuestion ??
  mongoose.model<ICustomQuestion>("CustomQuestion", customQuestionSchema);
