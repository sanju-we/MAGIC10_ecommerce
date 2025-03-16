const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    productName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    fullDescription: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: String,
        required: true,
        trim: true
    },
    regularPrice: {
        type: Number,
        required: true,
        min: 0
    },
    salePrice: {
        type: Number,
        required: true,
        min: 0
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    variants: [
        {
            size: {
                type: String,
                required: true,
                trim: true
            },
            color: {
                type: String,
                required: true,
                trim: true
            },
            price: {
                type: Number,
                required: true,
                min: 0
            },
            stock: {
                type: Number,
                required: true,
                min: 0
            }
        }
    ],
    productOffer: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    image: [{
        type: String,
        trim: true
    }],
    isBlocked: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ["Available", "out of stock", "Discontinued"],
        required: true,
        default: "Available"
    }
}, { timestamps: true });


const Product = mongoose.model("Product", productSchema);

module.exports = Product;