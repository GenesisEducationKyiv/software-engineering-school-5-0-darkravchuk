import { Request, Response } from 'express';
import { ScheduleService } from '../../application/services/ScheduleService';
import { CreateScheduleDto } from '../../application/dtos/ScheduleDtos';

export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  async createSchedule(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateScheduleDto = req.body;
      
      if (!dto.name || !dto.location || !dto.frequency) {
        res.status(400).json({
          error: 'Missing required fields: name, location, frequency'
        });
        return;
      }

      const schedule = await this.scheduleService.createSchedule(dto);
      
      res.status(201).json({
        success: true,
        data: schedule,
        message: 'Schedule created successfully'
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to create schedule'
      });
    }
  }

  async getAllSchedules(req: Request, res: Response): Promise<void> {
    try {
      const schedules = await this.scheduleService.getAllSchedules();
      
      res.json({
        success: true,
        data: schedules,
        count: schedules.length
      });
    } catch (error) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({
        error: 'Failed to fetch schedules'
      });
    }
  }

  async getScheduleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schedule = await this.scheduleService.getScheduleById(id);
      
      if (!schedule) {
        res.status(404).json({
          error: `Schedule with id ${id} not found`
        });
        return;
      }

      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      console.error('Error fetching schedule:', error);
      res.status(500).json({
        error: 'Failed to fetch schedule'
      });
    }
  }

  async activateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.scheduleService.activateSchedule(id);
      
      res.json({
        success: true,
        message: 'Schedule activated successfully'
      });
    } catch (error) {
      console.error('Error activating schedule:', error);
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        error: error instanceof Error ? error.message : 'Failed to activate schedule'
      });
    }
  }

  async deactivateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.scheduleService.deactivateSchedule(id);
      
      res.json({
        success: true,
        message: 'Schedule deactivated successfully'
      });
    } catch (error) {
      console.error('Error deactivating schedule:', error);
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        error: error instanceof Error ? error.message : 'Failed to deactivate schedule'
      });
    }
  }

  async deleteSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.scheduleService.deleteSchedule(id);
      
      res.json({
        success: true,
        message: 'Schedule deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      res.status(500).json({
        error: 'Failed to delete schedule'
      });
    }
  }

  async executeSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.scheduleService.executeSchedule(id);
      
      res.json({
        success: result.status === 'success',
        data: result,
        message: result.status === 'success' ? 'Schedule executed successfully' : 'Schedule execution failed'
      });
    } catch (error) {
      console.error('Error executing schedule:', error);
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        error: error instanceof Error ? error.message : 'Failed to execute schedule'
      });
    }
  }

  async executeAllDueSchedules(req: Request, res: Response): Promise<void> {
    try {
      const results = await this.scheduleService.executeAllDueSchedules();
      
      const successCount = results.filter(r => r.status === 'success').length;
      const failureCount = results.filter(r => r.status === 'failed').length;
      
      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount
          }
        },
        message: `Executed ${results.length} schedules (${successCount} successful, ${failureCount} failed)`
      });
    } catch (error) {
      console.error('Error executing all due schedules:', error);
      res.status(500).json({
        error: 'Failed to execute due schedules'
      });
    }
  }
}
