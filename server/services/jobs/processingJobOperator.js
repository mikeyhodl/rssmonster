import db from '../../models/index.js';
import { Op } from 'sequelize';
import { countStrandedArticleAnalyses, recoverStrandedArticleAnalyses } from './strandedArticleRecovery.js';
import { resetArticleEnrichmentForRetry } from './handlers/articleEnrichmentJobHandler.js';

const { ProcessingJob, sequelize } = db;
export const MAX_DEAD_JOB_LIST_LIMIT = 100;
export const MAX_DEAD_JOB_REQUEUE_TARGETS = 100;

const positiveId = (value, field) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new TypeError(`${field} must be a positive integer`);
  }
  return parsed;
};

const boundedListLimit = value => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > MAX_DEAD_JOB_LIST_LIMIT) {
    throw new TypeError(`limit must be between 1 and ${MAX_DEAD_JOB_LIST_LIMIT}`);
  }
  return parsed;
};

const exactJobIds = values => {
  const ids = [...new Set((values || []).map(value => String(value).trim()).filter(Boolean))];
  if (!ids.length || ids.length > MAX_DEAD_JOB_REQUEUE_TARGETS) {
    throw new TypeError(
      `one to ${MAX_DEAD_JOB_REQUEUE_TARGETS} explicit processing job IDs are required`
    );
  }
  return ids;
};

const safeTarget = job => {
  const payload = job.payload || {};
  return job.type === 'semantic_label'
    ? { targetType: payload.targetType || null, targetId: payload.targetId || null }
    : { articleId: job.articleId || payload.articleId || null };
};

const operatorResult = job => ({
  id: job.id,
  type: job.type,
  userId: Number(job.userId),
  status: job.status,
  attempts: Number(job.attempts),
  maxAttempts: Number(job.maxAttempts),
  lastErrorCode: job.lastErrorCode,
  lastErrorMessage: job.lastErrorMessage,
  completedAt: job.completedAt,
  target: safeTarget(job)
});

// Lists a bounded dead-job set for one explicitly selected owner without returning payloads.
export const listDeadProcessingJobs = async ({
  userId,
  jobIds = null,
  type = null,
  limit = 20
}) => {
  const normalizedUserId = positiveId(userId, 'userId');
  const normalizedJobIds = jobIds?.length ? exactJobIds(jobIds) : null;
  const jobs = await ProcessingJob.findAll({
    where: {
      userId: normalizedUserId,
      status: 'dead',
      ...(normalizedJobIds ? { id: { [Op.in]: normalizedJobIds } } : {}),
      ...(type ? { type: String(type) } : {})
    },
    order: [['completedAt', 'DESC'], ['id', 'ASC']],
    limit: boundedListLimit(limit)
  });
  return jobs.map(operatorResult);
};

// Requeues only exact dead-job IDs owned by one explicit user.
export const requeueDeadProcessingJobs = async ({
  userId,
  jobIds,
  availableAt = new Date()
}) => sequelize.transaction(async transaction => {
  const normalizedUserId = positiveId(userId, 'userId');
  const normalizedJobIds = exactJobIds(jobIds);
  const jobs = await ProcessingJob.findAll({
    where: {
      id: { [Op.in]: normalizedJobIds },
      userId: normalizedUserId,
      status: 'dead'
    },
    order: [['id', 'ASC']],
    transaction,
    lock: transaction.LOCK.UPDATE
  });

  for (const job of jobs) {
    if (job.type === 'article_enrichment') {
      await resetArticleEnrichmentForRetry(job, transaction);
    }
    await job.update({
      status: 'pending',
      attempts: 0,
      availableAt,
      leaseOwner: null,
      leaseUntil: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      startedAt: null,
      completedAt: null
    }, { transaction, hooks: false });
  }

  return {
    requestedCount: normalizedJobIds.length,
    requeuedCount: jobs.length,
    jobs: jobs.map(operatorResult)
  };
});

// Retries a bounded batch of the signed-in user's failed inference work.
export const requeueFailedProcessingJobs = async ({ userId }) => {
  const jobs = await listDeadProcessingJobs({ userId, limit: MAX_DEAD_JOB_REQUEUE_TARGETS });
  const result = jobs.length
    ? await requeueDeadProcessingJobs({ userId, jobIds: jobs.map(job => job.id) })
    : { requeuedCount: 0 };
  const recoveredCount = await recoverStrandedArticleAnalyses({
    userId: positiveId(userId, 'userId'),
    limit: MAX_DEAD_JOB_REQUEUE_TARGETS - result.requeuedCount
  });
  const remainingDeadCount = await ProcessingJob.count({
    where: { userId: positiveId(userId, 'userId'), status: 'dead' }
  });
  const remainingStrandedCount = await countStrandedArticleAnalyses({ userId: positiveId(userId, 'userId') });
  return {
    requeuedCount: result.requeuedCount + recoveredCount,
    recoveredCount,
    remainingCount: remainingDeadCount + remainingStrandedCount
  };
};

export default { listDeadProcessingJobs, requeueDeadProcessingJobs };
