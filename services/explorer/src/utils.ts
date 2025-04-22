import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, SendMessageCommand } from '@aws-sdk/client-sqs';
import { ExplorationTask } from './types.js';
import { v4 as uuid } from 'uuid';

const REGION = process.env.AWS_REGION || 'eu-west-1';
const QUEUE_URL = process.env.EXPLORER_QUEUE_URL!;

const sqs = new SQSClient({ region: REGION });

export async function enqueueTask(task: ExplorationTask): Promise<void> {
  await sqs.send(new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(task),
    MessageDeduplicationId: uuid(),
    MessageGroupId: 'explorer-group', // required for FIFO queues
  }));
}

export async function consumeQueue<T>(
  queueUrl: string,
  handler: (msg: T) => Promise<void>
): Promise<void> {
  console.log(`Listening to SQS queue: ${queueUrl}`);

  while (true) {
    const data = await sqs.send(new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 5,
      WaitTimeSeconds: 10,
    }));

    if (!data.Messages || data.Messages.length === 0) continue;

    for (const message of data.Messages) {
      if (!message.Body || !message.ReceiptHandle) continue;

      try {
        const parsed = JSON.parse(message.Body) as T;
        await handler(parsed);

        await sqs.send(new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        }));
      } catch (err) {
        console.error('Failed to process message:', err);
        // Let it retry
      }
    }
  }
}
