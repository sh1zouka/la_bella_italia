const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    items: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    total: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    bonusDiscount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    finalTotal: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    earnedBonuses: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    deliveryData: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'confirmed'
    }
  }, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false,
    tableName: 'orders'
  });

  return Order;
};
