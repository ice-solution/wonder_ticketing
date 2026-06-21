import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./common.js";

const surveyQuestionSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    question: { type: String, required: true, maxlength: 500 },
    questionEn: { type: String, maxlength: 500 },
    type: { type: String, enum: ["text", "rating", "select"], default: "text" },
    options: [String],
    sortOrder: { type: Number, default: 0 },
    ...timestamps,
  },
  { collection: "survey_questions" }
);

const surveyResponseSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: "SurveyQuestion", required: true },
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket" },
    respondentEmail: { type: String, maxlength: 320 },
    answer: { type: String, required: true },
    ...timestamps,
  },
  { collection: "survey_responses" }
);

export type ISurveyQuestion = InferSchemaType<typeof surveyQuestionSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type ISurveyResponse = InferSchemaType<typeof surveyResponseSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SurveyQuestion: Model<ISurveyQuestion> =
  mongoose.models.SurveyQuestion ??
  mongoose.model<ISurveyQuestion>("SurveyQuestion", surveyQuestionSchema);
export const SurveyResponse: Model<ISurveyResponse> =
  mongoose.models.SurveyResponse ??
  mongoose.model<ISurveyResponse>("SurveyResponse", surveyResponseSchema);
