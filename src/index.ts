import * as dotenv from 'dotenv';
import actuator from 'express-actuator';
dotenv.config();

import express, { Request, Response } from 'express';
import sequelize from './config/database';
import routes from './routes/mainRouter';
import path from 'path';

import {initDependencies} from './initApp';
import {scheduleWeatherUpdates} from './schedulers/scheduleWeatherUpdates';

const app = express();
const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || 'http://localhost';

const { weatherController, subscriptionController, subscriptionService } = initDependencies();

app.use(actuator())
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', routes(weatherController, subscriptionController));

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/subscribe.html'));
});

async function startServer() {
  try {
    await sequelize.sync({ force: false });
    await scheduleWeatherUpdates(subscriptionService);
    if (process.env.NODE_ENV !== 'test') {
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', (error as Error).message);
  }
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

export default app;