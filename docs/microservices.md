## Microservice Seperation

- Subscription Service: Manages user subscriptions, a core business domain with distinct logic and database (e.g., Sequelize for subscription data).
- Weather Service: Handles external API calls and caching, which can be resource-intensive and benefits from independent scaling.
- Notification Service: Manages email sending, which can be computationally expensive and requires integration with external services (e.g., SMTP servers). It’s a natural fit for a separate service, especially with upcoming task to add a message broker.
- Scheduling Service: Coordinates periodic tasks, which can be isolated to avoid impacting other services’ performance.
## 🔄 Optimal Microservice Communication

#### Synchronous Communication (REST/HTTP):

Use Case: For immediate, request-response interactions, such as fetching weather data or creating subscriptions.

#### Asynchronous Communication (Message Broker):

Use Case: For event-driven interactions, such as notifying the Notification Service about subscription events or triggering weather updates.

## 🔄 User Flow in Microservices Architecture

The detailed flow of the user interaction mapped to my microservices architecture:

1. **User Enters Email, City, and Frequency**:
   - The user accesses a web page served by the **User Interface** (an Express.js app).
   - They input their email (e.g., `user@example.com`), city (e.g., `Kyiv`), and frequency (e.g., `hourly`) into a form.
   - The form submits a `POST /subscriptions` request to the **Subscription Service**.

2. **User Clicks "Subscribe"**:
   - **The Subscription Service**:
      - Validates the input using `subscriptionValidator.ts`.
      - Executes `CreateSubscriptionUseCase`, which:
         - Creates a `Subscription` entity with a pending status and generates confirmation/unsubscribe tokens.
         - Saves the subscription to the database via `SequelizeSubscriptionRepository`.
         - Publishes a `SubscriptionCreatedEvent` to the `subscription.created` queue in RabbitMQ.
      - Returns a success response to the User Interface (e.g., `{ message: "Subscription created, please check your email" }`).
   - **The Notification Service**:
      - Consumes the `SubscriptionCreatedEvent` from RabbitMQ.
      - Executes `sendConfirmationEmail` via `EmailService`, sending a confirmation email with a link (e.g., `GET /subscriptions/confirm/:token`).

3. **User Receives Confirmation Email**:
   - The user receives an email with a confirmation link (e.g., `http://api.example.com/subscriptions/confirm/abc123`).
   - The email is sent by the **Notification Service** using `EmailSender` (e.g., Nodemailer).

4. **User Clicks "Confirm"**:
   - The user clicks the confirmation link, sending a `GET /subscriptions/confirm/:token` request to the **Subscription Service**.
   - **The Subscription Service**:
      - Executes `ConfirmSubscriptionUseCase`, which:
         - Finds the subscription by token using `SequelizeSubscriptionRepository`.
         - Updates the subscription status to `confirmed`.
         - Publishes a `SubscriptionConfirmedEvent` to the `subscription.confirmed` queue.
      - Returns a success response to the User Interface (e.g., `{ message: "Subscription confirmed" }`).
   - **The Notification Service**:
      - Consumes the `SubscriptionConfirmedEvent` and sends a confirmation acknowledgment email (optional).

5. **User Receives Weather Updates (Hourly or Daily)**:
   - **The Scheduling Service**:
      - Runs a cron job (via `WeatherUpdateScheduler`) based on the frequency (hourly or daily).
      - Queries the **Subscription Service** via REST (`GET /subscriptions?frequency=hourly`) to retrieve active subscriptions.
      - For each subscription’s city, calls the **Weather Service** via REST (`GET /weather/:city`) to fetch weather data.
      - Publishes a `WeatherUpdateEvent` to the `weather.update` queue in RabbitMQ, including the subscription details and weather data.
   - **The Notification Service**:
      - Consumes the `WeatherUpdateEvent` from RabbitMQ.
      - Executes `sendWeatherUpdate` via `EmailService`, sending a weather update email to the user’s email address.
      - The email includes an unsubscribe link (e.g., `http://api.example.com/subscriptions/un