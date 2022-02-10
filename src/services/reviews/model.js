import { DataTypes } from "sequelize";

import sequelize from "../../utils/db/connect.js";

import Sequelize from "sequelize";

import Product from "../products/model.js";

const Review = sequelize.define(
  "review",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },

    review_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    review_rate: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { underscored: true }
);

Review.belongsTo(Product);
Product.hasMany(Review, {
  onDelete: "CASCADE",
});

export default Review;
