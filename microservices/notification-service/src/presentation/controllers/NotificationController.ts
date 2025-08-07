import { Request, Response } from 'express';
import { SendNotificationUseCase } from '../../application/use-cases';
import { INotificationRepository } from '../../domain/repositories';
import { logger } from '../../infrastructure/logging/logger';
import { metricsCollector } from '../../infrastructure/metrics/metrics';

export class NotificationController {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly notificationRepository: INotificationRepository
  ) {
    this.sendNotification = this.sendNotification.bind(this);
    this.getNotification = this.getNotification.bind(this);
    this.getNotificationStats = this.getNotificationStats.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
  }

  async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const { recipient, templateType, context, priority, expiresInMinutes, customTemplate } = req.body;

      if (!recipient || !templateType || !context) {
        res.status(400).json({
          success: false,
          error: 'recipient, templateType, and context are required'
        });
        return;
      }

      const result = await this.sendNotificationUseCase.execute({
        recipient,
        templateType,
        context,
        priority,
        expiresInMinutes,
        customTemplate
      });

      res.status(201).json({
        success: true,
        data: result
      });
      metricsCollector.recordNotification(templateType, priority || 'normal', true);
      logger.info('Notification accepted', { recipient, templateType, priority: priority || 'normal' });
    } catch (error) {
      metricsCollector.recordNotification(req.body?.templateType || 'unknown', req.body?.priority || 'normal', false);
      logger.error('Failed to send notification', { error: (error as any)?.message });
      this.handleError(res, error, 'Failed to send notification');
    }
  }

  async getNotification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const notification = await this.notificationRepository.findById(id);
      
      if (!notification) {
        res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: notification.toApiResponse()
      });
    } catch (error) {
      logger.error('Failed to get notification', { error: (error as any)?.message });
      this.handleError(res, error, 'Failed to get notification');
    }
  }

  async getNotificationStats(req: Request, res: Response): Promise<void> {
    try {
      const statusCounts = await this.notificationRepository.getStatusCounts();
      const failuresByReason = await this.notificationRepository.getFailuresByReason();

      res.status(200).json({
        success: true,
        data: {
          statusCounts,
          failuresByReason,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to get notification stats', { error: (error as any)?.message });
      this.handleError(res, error, 'Failed to get notification stats');
    }
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        service: 'Notification Service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    } catch (error) {
      logger.error('Health check failed', { error: (error as any)?.message });
      this.handleError(res, error, 'Health check failed');
    }
  }

  private handleError(res: Response, error: unknown, defaultMessage: string): void {
    logger.error('Notification Controller Error', { error: error instanceof Error ? error.message : error });

    if (error instanceof Error) {
      // Handle known error types
      if (error.message.includes('Invalid') || error.message.includes('required')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      if (error.message.includes('expired') || error.message.includes('cancelled')) {
        res.status(409).json({
          success: false,
          error: error.message
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      error: defaultMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
