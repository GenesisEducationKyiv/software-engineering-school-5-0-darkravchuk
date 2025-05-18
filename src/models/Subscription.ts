import { DataTypes, Model, Sequelize } from 'sequelize';
import sequelize from '../config/database';

interface SubscriptionAttributes {
    id?: number;
    email: string;
    city: string;
    frequency: 'hourly' | 'daily';
    confirmed: boolean;
    confirmationToken: string;
    unsubscribeToken: string;
}

class Subscription extends Model<SubscriptionAttributes> implements SubscriptionAttributes {
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

Subscription.init(
    {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: { isEmail: true },
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
    }
);

export default Subscription;