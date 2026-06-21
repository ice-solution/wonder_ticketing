import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./common.js";

const questionResponseSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: "CustomQuestion", required: true },
    answer: { type: String, required: true },
    ...timestamps,
  },
  { collection: "question_responses" }
);

export type IQuestionResponse = InferSchemaType<typeof questionResponseSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const QuestionResponse: Model<IQuestionResponse> =
  mongoose.models.QuestionResponse ??
  mongoose.model<IQuestionResponse>("QuestionResponse", questionResponseSchema);
