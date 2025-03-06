const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    productName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    fullDescription: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    regularPrice: {
        type: Number,
        required: true
    },
    salePrice: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    variants: [
        {
            size: {
                type: String, // Changed from Number to String
                required: true
            },
            color: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            stock: {
                type: Number,
                required: true
            }
        }
    ],
    productOffer: {
        type: Number,
        default: 0
    },
    image: [{
        type: String
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