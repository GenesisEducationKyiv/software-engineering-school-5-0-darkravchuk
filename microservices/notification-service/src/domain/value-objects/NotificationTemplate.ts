export type NotificationType = 'email' | 'sms' | 'push' | 'webhook';

export class NotificationTemplate {
  private constructor(
    private readonly _type: NotificationType,
    private readonly _subject: string,
    private readonly _body: string,
    private readonly _variables: string[]
  ) {}

  public static create(params: {
    type: NotificationType;
    subject: string;
    body: string;
    variables?: string[];
  }): NotificationTemplate {
    NotificationTemplate.validateSubject(params.subject);
    NotificationTemplate.validateBody(params.body);
    
    const variables = NotificationTemplate.extractVariables(params.body);
    
    return new NotificationTemplate(
      params.type,
      params.subject.trim(),
      params.body.trim(),
      variables
    );
  }

  private static validateSubject(subject: string): void {
    if (!subject || subject.trim().length === 0) {
      throw new Error('Notification subject cannot be empty');
    }

    if (subject.length > 200) {
      throw new Error('Notification subject too long (max 200 characters)');
    }
  }

  private static validateBody(body: string): void {
    if (!body || body.trim().length === 0) {
      throw new Error('Notification body cannot be empty');
    }

    if (body.length > 10000) {
      throw new Error('Notification body too long (max 10000 characters)');
    }
  }

  private static extractVariables(body: string): string[] {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(body)) !== null) {
      const variable = match[1];
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }

    return variables;
  }

  public renderBody(context: Record<string, any>): string {
    let renderedBody = this._body;

    this._variables.forEach(variable => {
      const value = context[variable];
      if (value !== undefined) {
        const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
        renderedBody = renderedBody.replace(regex, String(value));
      }
    });

    return renderedBody;
  }

  public renderSubject(context: Record<string, any>): string {
    let renderedSubject = this._subject;

    this._variables.forEach(variable => {
      const value = context[variable];
      if (value !== undefined) {
        const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
        renderedSubject = renderedSubject.replace(regex, String(value));
      }
    });

    return renderedSubject;
  }

  public hasVariable(variable: string): boolean {
    return this._variables.includes(variable);
  }

  public getMissingVariables(context: Record<string, any>): string[] {
    return this._variables.filter(variable => !(variable in context));
  }

  public get type(): NotificationType {
    return this._type;
  }

  public get subject(): string {
    return this._subject;
  }

  public get body(): string {
    return this._body;
  }

  public get variables(): ReadonlyArray<string> {
    return [...this._variables];
  }

  // Pre-defined templates
  public static readonly WELCOME_EMAIL = NotificationTemplate.create({
    type: 'email',
    subject: 'Welcome to Weather Subscription Service!',
    body: `
Hello {{name}},

Welcome to our Weather Subscription Service! You have successfully subscribed to receive weather updates for {{city}}.

You will receive daily weather notifications at {{email}}.

To confirm your subscription, please click the link below:
{{confirmationLink}}

Thank you for joining us!

Best regards,
Weather Service Team
    `.trim()
  });

  public static readonly SUBSCRIPTION_CONFIRMED = NotificationTemplate.create({
    type: 'email',
    subject: 'Subscription Confirmed - Weather Updates for {{city}}',
    body: `
Hello {{name}},

Your subscription to weather updates for {{city}} has been confirmed!

You will now receive daily weather forecasts at {{email}}.

Current weather in {{city}}: {{currentWeather}}

Best regards,
Weather Service Team
    `.trim()
  });

  public static readonly DAILY_WEATHER = NotificationTemplate.create({
    type: 'email',
    subject: 'Daily Weather Update for {{city}} - {{date}}',
    body: `
Hello {{name}},

Here's your daily weather update for {{city}}:

🌡️ Temperature: {{temperature}}°C
🌤️ Condition: {{condition}}
💧 Humidity: {{humidity}}%
💨 Wind: {{windSpeed}} km/h

{{forecastSummary}}

Have a great day!

Weather Service Team

To unsubscribe, click here: {{unsubscribeLink}}
    `.trim()
  });
}
