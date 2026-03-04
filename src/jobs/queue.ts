import { Queue, Worker, Job, type ConnectionOptions } from "bullmq";

function getRedisConnection(): ConnectionOptions {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;

  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      const useTls = url.protocol === "https:" || url.protocol === "rediss:";
      return {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || process.env.UPSTASH_REDIS_REST_TOKEN,
        ...(useTls ? { tls: {} } : {}),
      };
    } catch {
      // fall through to defaults
    }
  }

  return {
    host: "localhost",
    port: 6379,
  };
}

const connection = getRedisConnection();

export interface AddJobOptions {
  delay?: number;
  attempts?: number;
  backoff?: {
    type: "exponential" | "fixed";
    delay: number;
  };
  priority?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

export function createQueue(name: string): Queue {
  return new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  });
}

export async function addJob<T extends Record<string, unknown>>(
  queue: Queue,
  data: T,
  options: AddJobOptions = {}
): Promise<Job<T>> {
  const job = await queue.add(queue.name, data, {
    delay: options.delay,
    attempts: options.attempts ?? 3,
    backoff: options.backoff ?? { type: "exponential", delay: 1000 },
    priority: options.priority,
    removeOnComplete: options.removeOnComplete ?? 100,
    removeOnFail: options.removeOnFail ?? 50,
  });

  return job as Job<T>;
}

export function createWorker<T extends Record<string, unknown>>(
  queueName: string,
  processor: (job: Job<T>) => Promise<void>
): Worker<T> {
  return new Worker<T>(queueName, processor, {
    connection,
    concurrency: 5,
  });
}
