import { Router } from 'express';
import { ScheduleController } from '../controllers/ScheduleController';

export function createScheduleRoutes(scheduleController: ScheduleController): Router {
  const router = Router();

  // Create a new schedule
  router.post('/schedules', (req, res) => scheduleController.createSchedule(req, res));

  // Get all schedules
  router.get('/schedules', (req, res) => scheduleController.getAllSchedules(req, res));

  // Get schedule by ID
  router.get('/schedules/:id', (req, res) => scheduleController.getScheduleById(req, res));

  // Activate schedule
  router.post('/schedules/:id/activate', (req, res) => scheduleController.activateSchedule(req, res));

  // Deactivate schedule
  router.post('/schedules/:id/deactivate', (req, res) => scheduleController.deactivateSchedule(req, res));

  // Delete schedule
  router.delete('/schedules/:id', (req, res) => scheduleController.deleteSchedule(req, res));

  // Execute specific schedule manually
  router.post('/schedules/:id/execute', (req, res) => scheduleController.executeSchedule(req, res));

  // Execute all due schedules manually (for testing/debugging)
  router.post('/schedules/execute-all', (req, res) => scheduleController.executeAllDueSchedules(req, res));

  return router;
}
