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

// // Add a pre-save hook to update status based on stock
// productSchema.pre('save', function(next) {
//     // Update status based on total stock (base stock + variants stock)
//     let totalStock = this.stock;
    
//     if (this.variants && this.variants.length > 0) {
//         for (const variant of this.variants) {
//             totalStock += variant.stock;
//         }
//     }
    
//     if (totalStock <= 0) {
//         this.status = "out of stock";
//     } else {
//         this.status = "Available";
//     }
    
//     next();
// });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;