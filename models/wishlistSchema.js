const mongoose = require('mongoose');
const { Schema } = mongoose;

const wishlistSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: [{
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        size: { type: String, required: true }, 
        color: { type: String, required: true } 
    }]
});

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
module.exports = Wishlist;