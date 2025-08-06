const sequelize = require("../db");
const { DataTypes } = require("sequelize");
require("./views");

const Room = sequelize.define(
  "room",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { is: /^[а-яА-ЯёЁa-zA-Z0-9]+$/i },
    },
  },
  {
    timestamps: false,
  }
);

const Shelving = sequelize.define(
  "shelving",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: "room+shelving",
      validate: { is: /^[а-яА-ЯёЁa-zA-Z0-9]+$/i },
    },
    roomId: { type: DataTypes.INTEGER, unique: "room+shelving" },
  },
  {
    timestamps: false,
  }
);

const Shelf = sequelize.define(
  "shelf",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    serial_num: {
      type: DataTypes.INTEGER,
      unique: "shelving+shelf",
      allowNull: false,
    },
    shelvingId: { type: DataTypes.INTEGER, unique: "shelving+shelf" },
  },
  {
    timestamps: false,
  }
);

const Plant = sequelize.define(
  "plant",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { is: /^[а-яА-ЯёЁa-zA-Z0-9]+$/i },
    },
  },
  {
    timestamps: false,
  }
);

const ParameterSetting = sequelize.define(
  "parameter_polling_setting",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { is: /^[а-яА-ЯёЁa-zA-Z0-9]+$/i },
    },
    activity: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    timestamps: false,
  }
);

const Parameter = sequelize.define(
  "parameter",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { is: /^[а-яА-ЯёЁa-zA-Z0-9]+$/i },
    },
  },
  {
    timestamps: false,
  }
);

const ParameterType = sequelize.define(
  "parameter_type",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { is: /^[а-яА-ЯёЁa-zA-Z0-9]+$/i },
    },
  },
  {
    timestamps: false,
  }
);

const ParameterValue = sequelize.define(
  "value_configured_parameter",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    value: { type: DataTypes.FLOAT, allowNull: false },
    fixate_serial_num: { type: DataTypes.INTEGER, allowNull: false },
    fixate_time: { type: DataTypes.DATE, allowNull: false },
  },
  {
    timestamps: false,
  }
);

const ParameterSettingRange = sequelize.define(
  "parameter_settings_range",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  },
  {
    timestamps: false,
  }
);

const ParameterSettingRating = sequelize.define(
  "parameter_settings_rating",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    visit_num: {
      type: DataTypes.INTEGER,
      unique: "visit+setting",
      allowNull: false,
      defaultValue: 0,
    },
    parameterPollingSettingId: {
      type: DataTypes.INTEGER,
      unique: "visit+setting",
    },
  },
  {
    timestamps: false,
  }
);

const Range = sequelize.define(
  "range",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { is: /^[а-яА-ЯёЁa-zA-Z0-9]+$/i },
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { is: /^[а-яА-ЯёЁa-zA-Z0-9]+$/i },
    },
  },
  {
    timestamps: false,
  }
);

const RangeValue = sequelize.define(
  "range_value",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    value: { type: DataTypes.FLOAT, allowNull: false },
  },
  {
    timestamps: false,
  }
);

const StationarySequence = sequelize.define(
  "stationary_sequence",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    num_values: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    timestamps: false,
  }
);

const DynamicRangeElem = sequelize.define(
  "dynamic_range_element",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    serial_num: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    timestamps: false,
  }
);

Room.hasMany(Shelving, { foreignKey: { allowNull: false } });
Shelving.belongsTo(Room);

Shelving.hasMany(Shelf, { foreignKey: { allowNull: false } });
Shelf.belongsTo(Shelving);

Plant.hasMany(Shelf, { foreignKey: { allowNull: true } });
Shelf.belongsTo(Plant);

Shelf.hasMany(ParameterSetting, { foreignKey: { allowNull: false } });
ParameterSetting.belongsTo(Shelf);

ParameterSetting.hasMany(ParameterSettingRating, {
  foreignKey: { allowNull: false },
});
ParameterSettingRating.belongsTo(ParameterSetting);

Parameter.hasMany(ParameterSetting, { foreignKey: { allowNull: false } });
ParameterSetting.belongsTo(Parameter);

ParameterType.hasMany(Parameter, { foreignKey: { allowNull: false } });
Parameter.belongsTo(ParameterType);

ParameterSetting.hasMany(ParameterValue, { foreignKey: { allowNull: false } });
ParameterValue.belongsTo(ParameterSetting);

ParameterSetting.belongsToMany(Range, { through: ParameterSettingRange });
Range.belongsToMany(ParameterSetting, { through: ParameterSettingRange });

Range.hasMany(RangeValue, { foreignKey: { allowNull: false } });
RangeValue.belongsTo(Range);

RangeValue.hasOne(StationarySequence, { foreignKey: { allowNull: false } });
StationarySequence.belongsTo(RangeValue);

RangeValue.hasOne(DynamicRangeElem, { foreignKey: { allowNull: false } });
DynamicRangeElem.belongsTo(RangeValue);

module.exports = {
  Room,
  Shelving,
  Shelf,
  Plant,
  ParameterSetting,
  Parameter,
  ParameterType,
  ParameterValue,
  ParameterSettingRange,
  ParameterSettingRating,
  Range,
  RangeValue,
  StationarySequence,
  DynamicRangeElem,
};
