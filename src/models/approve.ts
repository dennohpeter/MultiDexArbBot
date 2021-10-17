import { Model, Document, model, Schema } from "mongoose";
import { Token } from "../types";

// An interface that describes attributes that a transaction should have
interface ApproveAttrs {
    token: Token;
}

// An interface that describes what attributes a transaction model should have
interface ApproveModel extends Model<ApproveDoc> {
    build(attrs: ApproveAttrs): ApproveDoc;
}

// An interface that descibes single transaction properties
interface ApproveDoc extends Document {
    token: Token;
}

// Creating transaction schema
const approveSchema = new Schema(
    {
        token: {
            type: {
                name: String,
                symbol: String,
                address: String
            }, unique: true
        },
    },
    {
        timestamps: true,
    }
);

// Statics
approveSchema.statics.build = (attrs: ApproveAttrs) => {
    return new Approve(attrs);
};

// Creating transaction model
const Approve = model<ApproveDoc & ApproveModel>("Approve", approveSchema);

export { Approve, ApproveDoc };
