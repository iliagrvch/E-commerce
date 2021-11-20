const mongoose = require("mongoose");
const Order = require("./order");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        _id: false,
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
  orders: [
    {
      _id: false,
      orderId: {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    },
  ],
});

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };

  return this.save();
};
userSchema.methods.addOrder = function () {
  const products = this.cart.items;
  const order = new Order({ userId: this._id, items: this.cart.items });
  return order
    .save()
    .then((result) => {
      console.log("sda");
      const updatedOrders = [...this.orders];
      updatedOrders.push({ orderId: result._id });
      this.orders = updatedOrders;
      this.cart = { items: [] };
      return this.save();
    })
    .catch((err) => {
      console.log(err);
      return this.save();
    });
};
userSchema.methods.deleteFromCart = function (productId) {
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.postOrder = function () {};
userSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
  });
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity,
    });
  }
  const updatedCart = {
    items: updatedCartItems,
  };

  this.cart = updatedCart;
  return this.save();
};
module.exports = mongoose.model("User", userSchema);
