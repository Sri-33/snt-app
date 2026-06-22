const QUEUE_KEY = 'snt_offline_queue';

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueAction(action) {
  const queue = getQueue();
  queue.push({ ...action, id: Date.now(), queuedAt: new Date().toISOString() });
  saveQueue(queue);
  return queue.length;
}

export function getQueueLength() {
  return getQueue().length;
}

export async function flushQueue(processor) {
  const queue = getQueue();
  if (!queue.length || !navigator.onLine) return { flushed: 0, failed: 0 };

  const remaining = [];
  let flushed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await processor(item);
      flushed++;
    } catch {
      remaining.push(item);
      failed++;
    }
  }

  saveQueue(remaining);
  return { flushed, failed, remaining: remaining.length };
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}
