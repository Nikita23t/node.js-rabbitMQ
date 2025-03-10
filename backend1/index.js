const express = require('express');
const amqp = require('amqplib');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

let logs = [];

async function connectRabbitMQ() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  const queue = 'tasks';
  
  await channel.assertQueue(queue, { durable: false });
  
  channel.consume(queue, (msg) => {
    if (msg !== null) {
      const task = JSON.parse(msg.content.toString());
      logs.push({
        event: 'TASK_RECEIVED',
        taskId: task.id,
        source: 'frontend',
        destination: 'server1',
        timestamp: new Date().toISOString()
      });
      
      amqp.connect('amqp://localhost').then(conn => {
        conn.createChannel().then(ch => {
          ch.sendToQueue('tasks', Buffer.from(JSON.stringify(task)));
          logs.push({
            event: 'TASK_FORWARDED',
            taskId: task.id,
            source: 'server1',
            destination: 'server2',
            timestamp: new Date().toISOString()
          });
          ch.close();
        });
      });
      
      channel.ack(msg);
    }
  });
}

connectRabbitMQ().catch(console.error);

app.post('/task', (req, res) => {
  const { text } = req.body;
  const task = { id: Date.now(), text };
  
  logs.push({
    event: 'TASK_CREATED',
    taskId: task.id,
    source: 'frontend',
    destination: 'server1',
    timestamp: new Date().toISOString()
  });

  amqp.connect('amqp://localhost').then(connection => {
    return connection.createChannel();
  }).then(channel => {
    channel.sendToQueue('tasks', Buffer.from(JSON.stringify(task)));
    res.status(201).json(task);
  }).catch(error => {
    res.status(500).json({ error: 'Ошибка при публикации задачи' });
  });
});

app.get('/logs', (_, res) => {
  res.json(logs);
});

app.listen(port, () => {
  console.log(`Сервер 1 запущен на порту ${port}`);
});