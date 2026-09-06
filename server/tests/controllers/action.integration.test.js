import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import db from '../../models/index.js';
import actionController from '../../controllers/action.js';

const { Action, User, sequelize } = db;
const userIds = [];

const createUser = async username => {
  const user = await User.create({
    username,
    password: 'test-password',
    feverCredentialHash: `action-test-${username}`
  });
  userIds.push(user.id);
  return user;
};

describe('action replacement persistence', () => {
  beforeAll(async () => {
    if (sequelize.getDialect() === 'sqlite') await sequelize.sync();
  });

  afterEach(async () => {
    Action.removeHook('afterBulkCreate', 'fail-action-replacement');
    await User.destroy({ where: { id: userIds.splice(0) } });
  });

  it('restores the previous rules when replacement fails after insertion', async () => {
    const owner = await createUser('action-rollback-owner');
    const otherUser = await createUser('action-rollback-other');
    await Action.bulkCreate([owner, otherUser].map(user => ({
      userId: user.id,
      name: 'Original rule',
      actionType: 'read',
      regularExpression: 'original'
    })));
    const original = await Action.findAll({
      where: { userId: userIds }, order: [['id', 'ASC']], raw: true
    });
    const error = new Error('replacement failed after insertion');
    Action.addHook('afterBulkCreate', 'fail-action-replacement', () => { throw error; });
    const next = vi.fn();
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await actionController.createAction({
      userData: { userId: owner.id },
      body: { actions: [{ name: 'Replacement', actionType: 'favorite', regularExpression: 'new' }] }
    }, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(await Action.findAll({
      where: { userId: userIds }, order: [['id', 'ASC']], raw: true
    })).toEqual(original);
  });
});
