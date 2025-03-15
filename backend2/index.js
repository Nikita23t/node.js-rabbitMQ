const express = require('express');
const amqp = require('amqplib');
const cors = require('cors');
const app = express();
const port = 3002;

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
        event: 'Задача отправлена',
        taskId: task.id,
        source: 'server1',
        destination: 'server2',
        timestamp: new Date().toISOString()
      });

      logs.push({
        event: 'Задача принята',
        taskId: task.id,
        source: 'server2',
        destination: 'frontend',
        timestamp: new Date().toISOString()
      });
      
      channel.ack(msg);
    }
  });
}

connectRabbitMQ().catch(console.error);

app.get('/logs', (req, res) => {
  res.json(logs);
});

app.listen(port, () => {
  console.log(`Сервер 2 запущен на порту ${port}`);
});