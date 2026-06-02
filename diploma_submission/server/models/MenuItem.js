const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MenuItem = sequelize.define('MenuItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    desc: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    weight: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    img: {
      type: DataTypes.STRING,
      defaultValue: '🍽️'
    },
    photo: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    macros: {
      type: DataTypes.JSONB,
      defaultValue: { kcal: 0, protein: 0, fat: 0, carbs: 0 }
    },
    popular: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: false,
    tableName: 'menu_items'
  });

  return MenuItem;
};
