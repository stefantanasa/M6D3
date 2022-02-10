import { Router } from "express";
import Product from "../products/model.js";
import { Op } from "sequelize";
import Review from "./model.js";

const reviewsRouter = Router();

reviewsRouter.get("/", async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      include: [Product],
    });
    res.send(reviews);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

reviewsRouter.get("/search", async (req, res, next) => {
  try {
    console.log({ query: req.query });
    const reviews = await Review.findAll({
      where: {
        [Op.or]: [
          {
            title: {
              [Op.iLike]: `%${req.query.q}%`,
            },
          },
          {
            content: {
              [Op.iLike]: `%${req.query.q}%`,
            },
          },
        ],
      },
      include: [Product],
    });
    res.send(reviews);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

reviewsRouter.get("/:id", async (req, res, next) => {
  try {
    const singleReview = await Review.findByPk(req.params.id);
    if (singleReview) {
      res.send(singleReview);
    } else {
      res.status(404).send({ message: "No such review" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

reviewsRouter.post("/", async (req, res, next) => {
  try {
    const newReview = await Review.create(req.body);
    res.send(newReview);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

reviewsRouter.put("/:id", async (req, res, next) => {
  try {
    const [success, updatedReview] = await Review.update(req.body, {
      where: { id: req.params.id },
      returning: true,
    });
    if (success) {
      res.send(updatedReview);
    } else {
      res.status(404).send({ message: "no such review" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

reviewsRouter.delete("/:id", async (req, res, next) => {
  try {
    await Review.destroy({ id: req.params.id });
    res.status(204).send();
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

export default reviewsRouter;
