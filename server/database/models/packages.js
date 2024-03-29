/* eslint-disable func-names */

module.exports = (sequelize, DataTypes) => {
  const Packages = sequelize.define('Packages', {
    customer_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    dispatcher_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: null,
    },
    pending_dispatchers: {
      type: DataTypes.ARRAY(DataTypes.BIGINT),
      allowNull: true,
      defaultValue: [],
    },
    is_currently_tracking: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    weight: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pending_weight: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image_urls: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    distance: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type_of_dispatch: {
      type: DataTypes.ENUM('inter-state', 'intra-state', 'international'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    from_state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    to_state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    from_town: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    to_town: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    from_country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    to_country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pickup_address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    dropoff_address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    nearest_busstop: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    landmark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pickup_landmark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'not-picked',
    },
    pickup_time: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dropoff_time: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    delivery_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    pending_delivery_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    package_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    pickup_decline_cause: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_paid_for: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    payment_mode: {
      type: DataTypes.STRING,
      defaultValue: 'virtual_balance',
    },
    delivery_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contact_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contact_phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    receiver_contact_fullname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    receiver_contact_phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_express_delivery: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    transport_mode_category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'sm',
    },
  },
  {
    underscored: true,
    tableName: 'Packages',
    timestamps: true,
  });

  Packages.associate = function (models) {
    // associations can be defined here
    Packages.belongsTo(models.Customers, {
      foreignKey: 'customer_id',
      as: 'customer',
    });

    Packages.belongsTo(models.Couriers, {
      foreignKey: 'dispatcher_id',
      as: 'dispatcher',
    });
  };
  return Packages;
};
