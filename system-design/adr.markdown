# Adoption of the Observer Pattern for Weather Subscription Service

## Context

The Weather Subscription Service is a web application that enables users to subscribe to weather updates for specific cities with hourly or daily frequency, confirm their subscriptions via email, and unsubscribe using unique tokens. The application is built with a modular architecture using Node.js, Express, Sequelize ORM for PostgreSQL interactions, and integrations with WeatherAPI for fetching weather data and SendGrid for sending emails. Key functionalities include:

- Fetching real-time weather data for a specified city.
- Managing subscriptions (creation, confirmation, and cancellation).
- Sending periodic weather updates to subscribers based on their chosen frequency (hourly or daily).

A primary challenge was to design a flexible and scalable system for notifying subscribers about weather updates without tightly coupling the weather data retrieval logic with the notification mechanism. The system needed to efficiently handle a growing number of subscribers, support different update frequencies, and allow for easy extension to new notification methods (e.g., SMS or push notifications) in the future.

## Decision

To address this challenge, the **Observer Pattern** was chosen. The Observer Pattern facilitates a one-to-many dependency between objects, where a subject notifies its dependent observers of state changes. In the context of the Weather Subscription Service, the Observer Pattern is implemented as follows:

- **SubscriptionSubject**: Acts as the subject, maintaining a list of observers (subscribers) for a specific city and frequency. It triggers notifications when new weather data is available (e.g., through cron jobs scheduled hourly or daily).
- **EmailObserver**: Represents an observer that sends weather updates to a subscribed email address via SendGrid. Each EmailObserver is associated with a subscriber’s email and their chosen city.

### Why the Observer Pattern?

1. **Dynamic Subscriber Management**: The pattern allows easy addition or removal of subscribers (observers) without modifying the subject’s logic, which is critical as users can subscribe or unsubscribe at any time.
2. **Decoupling**: The weather data retrieval logic (WeatherService) is decoupled from the notification mechanism. The SubscriptionSubject does not depend on how observers process updates (e.g., email, SMS).
3. **Scalability**: The system can handle a growing number of subscribers, as the SubscriptionSubject simply invokes the update method for each observer.
4. **Extensibility**: The pattern facilitates adding new notification types (e.g., SMSObserver or PushNotificationObserver) without modifying the SubscriptionSubject.
5. **Suitability for Periodic Updates**: Weather updates are sent on a schedule (hourly or daily via cron jobs), and the Observer Pattern is well-suited for such periodic notifications.

### Implementation

- **SubscriptionSubject**:
  - Maintains a list of EmailObserver instances for each city-frequency combination.
  - Triggered periodically by cron jobs to fetch new weather data via WeatherAPI.
  - Notifies all registered observers, passing the latest weather data.
- **EmailObserver**:
  - Receives weather data from the SubscriptionSubject.
  - Constructs an email with weather details (temperature, description, humidity, pressure).
  - Sends the email via the SendGrid API.

Cron jobs are configured to trigger updates based on subscription frequencies, providing the SubscriptionSubject with the necessary data to notify observers.

### Alternatives Considered

1. **Direct Calls**:
   - Notification logic could be embedded directly in the SubscriptionService, with each update cycle manually invoking the email-sending function.
   - **Drawbacks**:
     - Tight coupling between update logic and notification mechanism.
     - Difficulty in adding new notification types.
     - Reduced flexibility for scaling.
   - **Why Rejected**: Violates decoupling principles and hinders future extensibility.

2. **Publish/Subscribe (Pub/Sub) Pattern**:
   - Using a message broker (e.g., RabbitMQ or Redis) to publish weather updates and allow clients to subscribe.
   - **Advantages**: High scalability, support for asynchronous processing.
   - **Drawbacks**:
     - Increased complexity due to integration and maintenance of a message broker.
     - Overkill for the current project scale (small number of subscribers).
   - **Why Rejected**: Excessive infrastructure for the application’s current needs.

3. **Event Emitter (Node.js)**:
   - Using Node.js’s built-in EventEmitter for handling weather update events.
   - **Advantages**: Lightweight, built into Node.js.
   - **Drawbacks**: Less structured compared to the Observer Pattern, making it harder to manage complex dependencies between cities, frequencies, and subscribers.
   - **Why Rejected**: The Observer Pattern provides a clearer structure and better code readability for this use case.

## Consequences

### Positive

1. **Flexibility**: The Observer Pattern allows easy addition of new notification methods (e.g., SMS, push) by creating new Observer classes.
2. **Scalability**: The system efficiently handles a growing number of subscribers, as the SubscriptionSubject simply notifies all observers.
3. **Decoupling**: Weather update logic is separated from notification logic, simplifying testing and maintenance.
4. **Maintainability**: The code structure is clear and intuitive, facilitating future modifications.

### Negative

1. **Increased Code Complexity**: Implementing the Observer Pattern requires additional classes (SubscriptionSubject, EmailObserver), adding slight complexity compared to direct calls.
2. **Performance with Large Subscriber Bases**: If the number of subscribers grows significantly (e.g., tens of thousands), performance optimization (e.g., asynchronous processing or message queues) may be needed.


## Status

**Approved**: The Observer Pattern has been successfully implemented in the Weather Subscription Service.