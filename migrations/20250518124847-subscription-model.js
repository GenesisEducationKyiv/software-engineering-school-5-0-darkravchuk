'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Subscriptions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false
      },
      frequency: {
        type: Sequelize.ENUM('hourly', 'daily'),
        allowNull: false
      },
      confirmed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      confirmationToken: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      unsubscribeToken: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Subscriptions');
  }
};