import mongoose from "mongoose";
import { SEAT_TYPES } from "../utils/constants.js";

const seatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    label: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(SEAT_TYPES),
    },
    assignedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Seat = mongoose.model("Seat", seatSchema);

export default Seat;
