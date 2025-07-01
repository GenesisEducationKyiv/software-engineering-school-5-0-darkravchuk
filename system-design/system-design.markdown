# System Design for Weather Subscription Service

## Context

The Weather Subscription Service is a web application that enables users to subscribe to weather updates for specific cities with hourly or daily frequency, confirm their subscriptions via email, and unsubscribe using unique tokens. The application is built with a modular architecture using Node.js, Express, Sequelize ORM for PostgreSQL interactions, and integrations with WeatherAPI for fetching weather data and SendGrid for sending emails. Key functionalities include:

- Fetching real-time weather data for a specified city.
- Managing subscriptions (creation, confirmation, and cancellation).
- Sending periodic weather updates to subscribers based on their chosen frequency (hourly or daily).

A primary challenge was to design a flexible and scalable system for notifying subscribers about weather updates without tightly coupling the weather data retrieval logic with the notification mechanism. The system needed to efficiently handle a growing number of subscribers, support different update frequencies, and allow for easy extension to new notification methods (e.g., SMS or push notifications) in the future.

## Functional Requirements

- **Subscription Management**: 
  - Allow users to subscribe to weather updates for specific cities with hourly or daily frequency.
  - Provide a confirmation mechanism via email using unique tokens.
  - Allow users to unsubscribe using a unique token.
- **Weather Data Retrieval**: Fetch current weather data for a specified city.
- **Notification Delivery**: Send periodic weather updates to subscribed email addresses based on the chosen frequency.

## Non-Functional Requirements

- **Scalability**: The system should handle a growing number of subscribers efficiently.
- **Availability**: Ensure 99.9% uptime for the service.
- **Performance**: Respond to API requests within 200ms under normal load.
- **Reliability**: Ensure email notifications are delivered successfully with minimal failures.
- **Security**: Protect user data with encryption and secure token handling.

## Constraints

- **Technology Stack**: Built using Node.js/Express for the API service.
- **Database**: Limited to PostgreSQL.
- **Third-Party Services**: Reliant on WeatherAPI for weather data and SendGrid for email delivery.
- **Bandwidth**: Limited to 1 Mbps incoming, 5 Mbps outgoing (emails, webhooks), and 50 Mbps for external API calls.
- **Data Size**: Payload sizes constrained (e.g., ~200 bytes for users, ~300 bytes for payloads, ~2KB per microservice payload, ~100GB/pick for storage).

## Load Estimation

- **User Base**: 50K active users.
- **API Calls**: 1000 requests per second (RPS) peak.
- **Payload Volume**: 500K events/day.
- **Data**: 
  - User data: ~200 bytes per user.
  - Payloads: ~300 bytes per request.
  - Microservice payloads: ~2KB per call.
  - Storage: ~100GB peak.
- **Bandwidth Usage**:
  - Incoming: 1 Mbps.
  - Outgoing: 5 Mbps (emails, webhooks).
  - External API: 50 Mbps.
- **Peak Load**: Assuming 1000 RPS, with each request averaging 300 bytes, the system handles ~300KB/s incoming traffic. Outgoing traffic for emails/webhooks at 5 Mbps supports high notification volumes.

## Detailed Component Design

### 1. API Service (Node.js/Express)
- **Responsibilities**: Handles RESTful API endpoints for user management, subscriptions, and weather data.
- **Features**:
  - CRUD operations for subscriptions.
    The application exposes the following API endpoints:
- **Endpoints**:
  - **GET `/weather/:city`**
    - Description: Fetches current weather data for a specified city.
    - Parameters: `:city` (string) - The name of the city.
    - Success Response: `200` with `{ city: string, weather: { temperature: number, description: string, humidity: number, pressure: number } }`.
    - Error Responses:
      - `400`: If the city parameter is missing.
      - `500`: If the weather API fails (e.g., invalid city).

  - **POST `/subscribe`**
    - Description: Subscribes a user to weather updates.
    - Request Body: `{ email: string, city: string, frequency: "hourly" | "daily" }`.
    - Success Response: `200` with `{ message: string, confirmationToken: string }`.
    - Error Responses:
      - `400`: If required fields are missing or frequency is invalid.
      - `409`: If the email is already subscribed.
      - `500`: If an internal error occurs.

  - **GET `/confirm/:token`**
    - Description: Confirms a subscription using a confirmation token.
    - Parameters: `:token` (string) - The confirmation token.
    - Success Response: `200` with `{ message: string }`.
    - Error Responses:
      - `400`: If the token is missing.
      - `404`: If the token is invalid or already confirmed.

  - **GET `/unsubscribe/:token`**
    - Description: Unsubscribes a user using an unsubscribe token.
    - Parameters: `:token` (string) - The unsubscribe token.
    - Success Response: `200` with `{ message: string }`.
    - Error Responses:
      - `400`: If the token is missing.
      - `404`: If the token is invalid.

  - **GET `/`**
    - Description: Serves the subscription HTML page.
    - Success Response: `200` with the HTML content.
  - **Implementation**: Stateless service with JWT for authentication.

### 2. Subscription Service
- **Responsibilities**: Manages subscription lifecycle (create, confirm, unsubscribe).
- **Components**:
  - **SubscriptionSubject**: Uses Observer Pattern to notify subscribers.
  - **EmailObserver**: Sends updates via SendGrid.
- **Logic**: Triggered by cron jobs for hourly/daily updates.

### 3. Weather Service
- **Responsibilities**: Fetches real-time weather data from WeatherAPI.
- **Implementation**: Uses Axios for HTTP requests, caches data for performance.

### 4. Database (PostgreSQL)
- **Responsibilities**: Stores user data, subscription details, and tokens.
- **Schema**:
  - `subscriptions` (id, email, city, country, frequency, confirmationToken, confirmed, unsubscribeToken, createdAt, updatedAt)
- **Scaling**: Horizontal scaling with read replicas.

### 5. Email Service
- **Responsibilities**: Sends confirmation and weather update emails.
- **Integration**: Uses SendGrid API with environment variables for configuration.

## High-Level Architecture Diagram

![C4 Diagram](c4-diagram.png)

## Sequence Diagram 

![Sequence Diagram ](sequence-diagram.png)

