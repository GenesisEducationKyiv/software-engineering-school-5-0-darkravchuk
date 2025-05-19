"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Subscription extends sequelize_1.Model {
}
Subscription.init({
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    city: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    frequency: {
        type: sequelize_1.DataTypes.ENUM('hourly', 'daily'),
        allowNull: false,
    },
    confirmed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    confirmationToken: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    unsubscribeToken: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'Subscription',
});
exports.default = Subscription;
