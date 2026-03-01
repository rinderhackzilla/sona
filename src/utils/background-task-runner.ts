export interface RetryPolicy {
  retries: number
  baseDelayMs: number
  maxDelayMs: number
  factor: number
  jitter: number
}

export interface RetryContext {
  attempt: number
  delayMs: number
  error: unknown
}

export interface RunWithRetryOptions {
  taskName: string
  policy?: Partial<RetryPolicy>
  onRetry?: (ctx: RetryContext) => void
}

const DEFAULT_POLICY: RetryPolicy = {
  retries: 3,
  baseDelayMs: 400,
  maxDelayMs: 5_000,
  factor: 2,
  jitter: 0.2,
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getDelay(policy: RetryPolicy, attempt: number) {
  const exp = policy.baseDelayMs * policy.factor ** (attempt - 1)
  const clamped = Math.min(exp, policy.maxDelayMs)
  const jitterRange = clamped * policy.jitter
  const withJitter = clamped + (Math.random() * 2 - 1) * jitterRange
  return Math.max(0, Math.round(withJitter))
}

export async function runWithRetry<T>(
  task: () => Promise<T>,
  options: RunWithRetryOptions,
): Promise<T> {
  const policy: RetryPolicy = {
    ...DEFAULT_POLICY,
    ...(options.policy ?? {}),
  }

  let attempt = 0
  let lastError: unknown

  while (attempt <= policy.retries) {
    attempt += 1
    try {
      return await task()
    } catch (error) {
      lastError = error
      if (attempt > policy.retries) break
      const delayMs = getDelay(policy, attempt)
      options.onRetry?.({ attempt, delayMs, error })
      await sleep(delayMs)
    }
  }

  throw new Error(
    `[BackgroundTask:${options.taskName}] failed after ${policy.retries + 1} attempts: ${String(lastError)}`,
  )
}
