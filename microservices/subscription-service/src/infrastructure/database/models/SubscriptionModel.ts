import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../connection';

interface SubscriptionModelAttributes {
  id?: number;
  email: string;
  city: string;
  frequency: 'hourly' | 'daily';
  confirmed: boolean;
  confirmationToken: string;
  unsubscribeToken: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SubscriptionModel extends Model<SubscriptionModelAttributes> implements SubscriptionModelAttributes {
  public id!: number;
  public email!: string;
  public city!: string;
  public frequency!: 'hourly' | 'daily';
  public confirmed!: boolean;
  public confirmationToken!: string;
  public unsubscribeToken!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SubscriptionModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    frequency: {
      type: DataTypes.ENUM('hourly', 'daily'),
      allowNull: false,
    },
    confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    confirmationToken: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    unsubscribeToken: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: 'Subscription',
    tableName: 'subscriptions',
    timestamps: true,
  }
);
