'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('feeds', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          // This is a reference to another model
          model: "users",

          // This is the column name of the referenced model
          key: "id"
        }
      },
      // It is possible to create foreign keys:
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          // This is a reference to another model
          model: "categories",

          // This is the column name of the referenced model
          key: "id"
        }
      },
      feedName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      feedDesc: Sequelize.TEXT,
      url: {
        type: Sequelize.STRING
      },
      rssUrl: {
        type: Sequelize.STRING
      },
      favicon: Sequelize.STRING,
      errorCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      active: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: true 
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    },
    {
        indexes: [
            {
                unique: true,
                fields: ['userId', 'rssUrl']
            }
        ]
    },
    {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci"
    });
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('feeds');
  }
};