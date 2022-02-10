import { Router } from "express";
// import Author from "../authors/model.js";
import User from "./users.model.js";
import { Op } from "sequelize";
import Product from "./model.js";
import Review from "../reviews/model.js";
import sequelize from "sequelize";
import Category from "./categories.model.js";

import Blog from "../blogs/model.js";

const productsRouter = Router();

productsRouter.get("/", async (req, res, next) => {
  try {
    /* 
    default values offset and limit
     */
    const { offset = 0, limit = 9 } = req.query;
    const totalProduct = await Product.count({});
    /**
     * Joins Author object
     */
    const products = await Product.findAll({
      include: [Review, Category],
      offset,
      limit,
    });
    res.send({ data: products, count: totalProduct });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

productsRouter.get("/:id/review", async (req, res, next) => {
  try {
    /* 
    default values offset and limit
     */
    const totalReview = await Review.findAll({
      where: { productId: req.params.id },
    });
    /**
     * Joins Author object
     */

    const review = await Review.findAll({
      where: { productId: req.params.id },
    });
    res.send({ data: review, count: totalReview });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

productsRouter.get("/search", async (req, res, next) => {
  try {
    console.log({ query: req.query });
    const products = await Product.findAll({
      where: {
        [Op.or]: [
          // --> you can ad as many operation you want here
          {
            title: {
              [Op.iLike]: `%${req.query.q}%`, // for like and iLike always add pattern
            },
          },
          {
            content: {
              [Op.iLike]: `%${req.query.q}%`,
            },
          },
        ],
      },
      include: [User],
    });
    res.send(products);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

productsRouter.get("/stats", async (req, res, next) => {
  try {
    const stats = await Review.findAll({
      // select list : what you want to get ?
      attributes: [
        [
          sequelize.cast(
            // cast function converts datatype
            sequelize.fn("count", sequelize.col("review.product_id")), // SELECT COUNT(blog_id) AS total_comments
            "integer"
          ),
          "numberOfReviews",
        ],
      ],
      group: ["review.product_id", "product.id", "product.user.id"],
      include: [{ model: Product, include: [User] }], // <-- nested include
    });
    res.send(stats);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

productsRouter.get("/:id", async (req, res, next) => {
  try {
    const singleProduct = await Product.findOne({
      where: {
        id: req.params.id,
      },
      include: [
        Review,
        User,
        {
          model: Category,
          attributes: ["name"],
        },
      ],
    });
    if (singleProduct) {
      res.send(singleProduct);
    } else {
      res.status(404).send({ message: "No such product" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

productsRouter.post("/", async (req, res, next) => {
  try {
    const newProduct = await Product.create(req.body);
    if (req.body.categories) {
      for await (const categoryName of req.body.categories) {
        const category = await Category.create({ name: categoryName });
        await newProduct.addCategory(category, {
          through: { selfGranted: false },
        });
      }
    }

    // and add to blog

    /**
     * this will go and insert relationship to blog_categories table
     */

    /**
     *  find blog by id and join Category,Author,Comment tables
     */
    const productWithReview = await Product.findOne({
      where: { id: newProduct.id },
      include: [Category, User, Review],
    });
    res.send(productWithReview);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

productsRouter.post("/:id/review", async (req, res, next) => {
  try {
    const newReview = await Review.create({
      ...req.body,

      product_id: req.params.id,
    });
    res.send(newReview);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

productsRouter.post("/:id/category", async (req, res, next) => {
  try {
    // find the blog that you want to add category
    const product = await Product.findByPk(req.params.id);
    if (product) {
      // create the category
      const category = await Category.create(req.body);
      // and add to blog

      /**
       * this will go and insert relationship to blog_categories table
       */
      await product.addCategory(category, { through: { selfGranted: false } });
      /**
       *  find blog by id and join Category,Author,Comment tables
       */

      res.send(category);
    } else {
      res.status(404).send({ error: "product not found" });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

productsRouter.delete("/:id/category/:categoryId", async (req, res, next) => {
  try {
    // find the blog that you want to add category
    const product = await Product.findByPk(req.params.id);
    if (product) {
      // create the category
      const category = await Category.findByPk(req.params.categoryId);
      // and add to blog

      /**
       * this will go and insert relationship to blog_categories table
       */
      await product.removeCategory(category);
      /**
       *  find blog by id and join Category,Author,Comment tables
       */
      const productWithReview = await Product.findOne({
        where: { id: req.params.id },
        include: [Category, User, Review],
      });
      res.send(productWithReview);
    } else {
      res.status(404).send({ error: "Product not found" });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

productsRouter.put("/:id", async (req, res, next) => {
  try {
    const [success, updatedProduct] = await Product.update(req.body, {
      where: { id: req.params.id },
      returning: true,
    });
    if (success) {
      res.send(updatedProduct);
    } else {
      res.status(404).send({ message: "no such " });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

productsRouter.delete("/:id", async (req, res, next) => {
  try {
    await Product.destroy({ id: req.params.id });
    res.status(204).send();
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

export default productsRouter;
