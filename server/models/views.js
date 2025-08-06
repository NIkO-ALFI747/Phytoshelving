const sequelize = require("../db");
const { DataTypes } = require("sequelize");

const RoomView = sequelize.define(
  "room_view",
  {
    name: { type: DataTypes.STRING },
  },
  {
    timestamps: false,
    treatAsView: true,
    viewDefinition: "SELECT name FROM rooms",
  }
);

const ShelvingView = sequelize.define(
  "shelving_view",
  {
    name: { type: DataTypes.STRING, primaryKey: true },
    roomId: { type: DataTypes.INTEGER },
  },
  {
    timestamps: false,
    treatAsView: true,
    viewDefinition: 'SELECT name, "roomId" FROM shelvings',
  }
);

const ShelfView = sequelize.define(
  "shelf_view",
  {
    serial_num: { type: DataTypes.STRING },
    shelvingId: { type: DataTypes.INTEGER },
    plantId: { type: DataTypes.INTEGER },
  },
  {
    timestamps: false,
    treatAsView: true,
    viewDefinition: 'SELECT serial_num, "shelvingId", "plantId" FROM shelves',
  }
);

const PlantView = sequelize.define(
  "plant_view",
  {
    name: { type: DataTypes.STRING },
  },
  {
    timestamps: false,
    treatAsView: true,
    viewDefinition: "SELECT name FROM plants",
  }
);

const ParameterSettingView = sequelize.define(
  "parameter_polling_setting_view",
  {
    description: { type: DataTypes.STRING },
    activity: { type: DataTypes.BOOLEAN },
  },
  {
    timestamps: false,
    treatAsView: true,
    viewDefinition:
      "SELECT description, activity FROM parameter_polling_settings",
  }
);

const ParameterView = sequelize.define(
  "parameter_view",
  {
    name: { type: DataTypes.STRING },
  },
  {
    timestamps: false,
    treatAsView: true,
    viewDefinition: "SELECT name FROM parameters",
  }
);

const ParameterTypeView = sequelize.define(
  "parameter_type_view",
  {
    description: { type: DataTypes.STRING },
  },
  {
    timestamps: false,
    treatAsView: true,
    viewDefinition: "SELECT description FROM parameter_types",
  }
);

const ParameterValueView = sequelize.define(
  "value_configured_parameter_view",
  {
    value: { type: DataTypes.FLOAT },
    fixate_serial_num: { type: DataTypes.INTEGER },
    fixate_time: { type: DataTypes.DATE },
  },
  {
    timestamps: false,
    treatAsView: true,
    viewDefinition:
      "SELECT value, fixate_serial_num, fixate_time FROM value_configured_parameters",
  }
);

const ParameterSettingRatingView = sequelize.define(
  "parameter_settings_rating_view",
  {
    visit_num: { type: DataTypes.INTEGER },
    parameterPollingSettingId: { type: DataTypes.INTEGER },
  },
  {
    timestamps: false,
    treatAsView: true,
    viewDefinition:
      'SELECT visit_num, "parameterPollingSettingId" FROM parameter_settings_ratings',
  }
);

const RangeView = sequelize.define(
  "range_view",
  {
    description: { type: DataTypes.STRING },
    type: { type: DataTypes.STRING },
  },
  {
    timestamps: false,
    treatAsView: true,
    viewDefinition: "SELECT description, type FROM ranges",
  }
);

const RangeValueView = sequelize.define(
  "range_value_view",
  {
    value: { type: DataTypes.INTEGER },
    rangeId: { type: DataTypes.INTEGER },
  },
  {
    timestamps: false,
    treatAsView: true,
    viewDefinition: 'SELECT value, "rangeId" FROM range_values',
  }
);

const StationarySequenceView = sequelize.define(
  "stationary_sequence_view",
  {
    num_values: { type: DataTypes.INTEGER },
    rangeValueId: { type: DataTypes.INTEGER },
  },
  {
    timestamps: false,
    treatAsView: true,
    viewDefinition:
      'SELECT num_values, "rangeValueId" FROM stationary_sequences',
  }
);

const DynamicRangeElemView = sequelize.define(
  "dynamic_range_view",
  {
    serial_num: { type: DataTypes.INTEGER },
    rangeValueId: { type: DataTypes.INTEGER },
  },
  {
    timestamps: false,
    treatAsView: true,
    viewDefinition:
      'SELECT serial_num, "rangeValueId" FROM dynamic_range_elements',
  }
);

RoomView.removeAttribute("id");
RoomView.removeAttribute("id");
ShelvingView.removeAttribute("id");
ShelfView.removeAttribute("id");
PlantView.removeAttribute("id");
ParameterSettingView.removeAttribute("id");
ParameterView.removeAttribute("id");
ParameterTypeView.removeAttribute("id");
ParameterValueView.removeAttribute("id");
ParameterSettingRatingView.removeAttribute("id");
RangeView.removeAttribute("id");
RangeValueView.removeAttribute("id");
StationarySequenceView.removeAttribute("id");
DynamicRangeElemView.removeAttribute("id");

module.exports = {
  RoomView,
  ShelvingView,
  ShelfView,
  PlantView,
  ParameterSettingView,
  ParameterView,
  ParameterTypeView,
  ParameterValueView,
  ParameterSettingRatingView,
  RangeView,
  RangeValueView,
  StationarySequenceView,
  DynamicRangeElemView,
};
