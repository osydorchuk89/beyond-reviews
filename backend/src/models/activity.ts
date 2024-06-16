import { Schema, model, Types } from "mongoose";

export interface IActivity {
    userId: Types.ObjectId;
    movieId: Types.ObjectId;
    ratingId: Types.ObjectId;
    otherUserId: Types.ObjectId;
    action: String;
    rating: Number;
    review: String;
    date: Date;
}

const activitySchema = new Schema<IActivity>({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    movieId: { type: Schema.Types.ObjectId, ref: "Movie" },
    ratingId: { type: Schema.Types.ObjectId, ref: "UserRating" },
    otherUserId: { type: Schema.Types.ObjectId, ref: "User" },
    action: String,
    rating: Number,
    review: String,
    date: Date,
});

export const Activity = model<IActivity>("Activity", activitySchema);
