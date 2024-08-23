import { Router } from "express";
import { Types } from "mongoose";

import Cart from "../models/cart.js"; 
import Products from "../models/products.js"; 
import auth from "../middleware/auth.js";

const router = Router();

// Getting current user cart
router.get("/", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: "products.product",
        select: "title _id stock price",
      })
      .select("-_id products");

    return res.json(cart ? cart.products : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create cart or add to cart (product page)
router.post("/:productId", auth, async (req, res) => {
  try {
    const user = req.user._id;
    const { quantity } = req.body;
    const productId = req.params.productId;

    // Check if the product exists and is in stock
    const product = await Products.findById(productId); // Use Products model to find the product
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ message: "Not enough stock" });
    }

    // Add item to user's cart
    let cart = await Cart.findOne({ user });
    if (!cart) {
      // Create a new cart for the user if one doesn't exist
      cart = new Cart({ user, products: [], total: 0 });
    }

    // Check if the item already exists in the cart
    const existingItemIndex = cart.products.findIndex((item) =>
      item.product.equals(productId)
    );
    if (existingItemIndex !== -1) {
      // Update the quantity if the item already exists in the cart
      cart.products[existingItemIndex].quantity += quantity;
      cart.total += quantity * product.price;
    } else {
      // Add the new item to the cart
      cart.products.push({ product: productId, quantity });
      cart.total += product.price * quantity;
    }

    // Save the cart to the database
    await cart.save();

    res.status(200).json({ message: "Item added to cart" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove one item from cart
router.patch("/remove/:productId", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "products.product",
      select: "price",
    });
    if (!cart) {
      return res.status(400).json({ message: "Cart not found" });
    }

    const productId = new Types.ObjectId(req.params.productId);

    // Get index of item to remove
    const removeIndex = cart.products.findIndex((item) =>
      item.product.equals(productId)
    );
    if (removeIndex === -1) {
      return res.status(400).json({ message: "Product not found" });
    }

    // Remove cart if it is the last item
    if (cart.products.length === 1) {
      await Cart.findByIdAndDelete(cart._id); // Use Cart model to delete the cart
      return res.json({ message: "Cart removed successfully!" });
    }

    // Remove item and save cart
    cart.total -=
      cart.products[removeIndex].product.price *
      cart.products[removeIndex].quantity;
    cart.products.splice(removeIndex, 1);
    await cart.save();

    return res.json({ message: "Product removed successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Increase product quantity (cart page)
router.patch("/increase/:productId", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "products.product",
      select: "price",
    });
    if (!cart) {
      return res.status(400).json({ message: "Cart not found" });
    }

    const productId = new Types.ObjectId(req.params.productId);

    const index = cart.products.findIndex((item) =>
      item.product.equals(productId)
    );

    // Check if the product is already in the cart
    if (index !== -1) {
      // Retrieve the product from the database
      const product = await Products.findById(productId);
      if (!product) {
        return res.status(400).json({ message: "Product not found" });
      }

      // Check if the product is in stock
      if (product.stock <= cart.products[index].quantity) {
        return res.status(400).json({ message: "Product out of stock" });
      }

      // Increase the quantity of the product in the cart
      cart.products[index].quantity += 1;
      cart.total += cart.products[index].product.price;
      await cart.save();
      return res
        .status(200)
        .json({ message: "Product quantity increased successfully" });
    } else {
      return res.status(400).json({ message: "Product not found in cart" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Decrease product quantity
router.patch("/decrease/:productId", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "products.product",
      select: "price",
    });
    if (!cart) {
      return res.status(400).json({ message: "Cart not found" });
    }

    const productId = new Types.ObjectId(req.params.productId);

    const index = cart.products.findIndex((item) =>
      item.product.equals(productId)
    );

    // Check if the product is already in the cart
    if (index !== -1) {
      cart.total -= cart.products[index].product.price;
      // Decrease the quantity of the product in the cart
      if (cart.products[index].quantity > 1) {
        cart.products[index].quantity -= 1;
      } else {
        // Remove the product from the cart if its quantity becomes zero
        cart.products.splice(index, 1);
      }
      await cart.save();
      return res
        .status(200)
        .json({ message: "Product quantity decreased successfully" });
    } else {
      return res.status(400).json({ message: "Product not found in cart" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
