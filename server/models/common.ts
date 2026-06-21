import { Schema, Types } from "mongoose";

export type ObjectId = Types.ObjectId;

/** 金額欄位：對應原 MySQL DECIMAL(10,2) */
export const moneyField = {
  type: Number,
  required: true,
  min: 0,
  get: (v: number) => Math.round(v * 100) / 100,
  set: (v: number) => Math.round(v * 100) / 100,
};

export const timestamps = {
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};

export function applyUpdatedAt(schema: Schema): void {
  schema.pre("save", function (next) {
    this.set("updatedAt", new Date());
    next();
  });
}
