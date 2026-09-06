'use strict';
import db from '../models/index.js';
import { compileActionRegex } from '../utils/actionRegex.js';
const { Action } = db;

const getActions = async (req, res, next) => {
  try {
    const userId = req.userData.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: missing userId' });
    }

    const actions = await Action.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
    res.status(200).json({ total: actions.length, actions });
  } catch (err) {
    next(err);
  }
};

const createAction = async (req, res, next) => {
  try {
    const userId = req.userData.userId;
    const actions = req.body?.actions;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: missing userId' });
    }

    if (!Array.isArray(actions) || actions.some(action =>
      !action || typeof action !== 'object' || Array.isArray(action) ||
      !['name', 'actionType', 'regularExpression'].some(field => action[field]) ||
      ['name', 'actionType', 'regularExpression', 'tagValue'].some(field =>
        action[field] != null && typeof action[field] !== 'string'
      ) ||
      ['name', 'actionType', 'tagValue'].some(field => action[field]?.length > 255)
    )) {
      return res.status(400).json({ error: 'actions must be an array of valid action objects' });
    }

    // Prepare new actions payload with userId
    const payload = actions
      .map(a => ({
        userId,
        name: a.name || '',
        actionType: a.actionType || '',
        regularExpression: a.regularExpression || '',
        tagValue: a.tagValue || null
      }));

    for (const [index, action] of payload.entries()) {
      if (!action.regularExpression) continue;
      try {
        compileActionRegex(action.regularExpression);
      } catch {
        return res.status(400).json({
          error: `Action ${index + 1}: invalid regular expression or flags. Use a plain pattern or /pattern/flags.`
        });
      }
    }

    // Keep the previous rules if replacement fails; an explicit empty array clears them.
    const created = await db.sequelize.transaction(async transaction => {
      await Action.destroy({ where: { userId }, transaction });
      return payload.length > 0 ? Action.bulkCreate(payload, { transaction }) : [];
    });

    res.status(201).json({ total: created.length, actions: created });
  } catch (err) {
    next(err);
  }
};

export default {
  getActions,
  createAction
};
