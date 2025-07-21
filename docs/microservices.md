
1.Microservices Breakdown
   The application is split into the following independent microservices, each with a clearly defined responsibility:
   2.1. API Gateway

Responsibility: Acts as the single entry point for external clients, routing HTTP requests to the appropriate microservices.
Purpose: Centralizes request handling, authentication, and load balancing, providing a unified interface for clients.
Interface: REST HTTP (accepts client requests and forwards them to internal services).
Example Endpoints:
POST /subscriptions: Create a new subscription.
GET /weather: Fetch weather data for a city.


Location: Deployed as a standalone service, potentially using a framework like Express.js.

2.2. Subscription Service

Responsibility: Manages user subscriptions, including creation, confirmation, and deletion.
Stores: User email, subscription frequency (hourly, daily), and subscription status.
Interface: REST HTTP (exposes endpoints for subscription management).
Example Endpoints:
POST /subscriptions: Create a new subscription.
DELETE /subscriptions/:id: Unsubscribe a user.
GET /subscriptions/confirmed: Retrieve confirmed subscribers.


Location: src/services/subscription-service/.

2.3. Weather Service

Responsibility:
Fetches current weather data from external APIs.
Caches weather data to optimize performance.


Dependencies:
External weather API (via REST HTTP).
Redis (for caching, accessed via REST HTTP or a compatible client).


Interface: REST HTTP (for internal calls and external API interactions).
Example Endpoints:
GET /weather/:city: Retrieve weather data for a specific city.
POST /weather/cache: Store weather data in cache.


Location: src/services/weather-service/.

2.4. Email Service

Responsibility:
Sends emails for subscription confirmation, weather forecasts, and unsubscribe actions.
Manages email templates and schedules forecast emails (e.g., via cron jobs).


Dependencies: External email providers (accessed via REST HTTP APIs or SMTP wrapped in HTTP).
Interface: REST HTTP (for internal calls from other services).
Example Endpoints:
POST /emails/confirmation: Send a subscription confirmation email.
POST /emails/forecast: Send weather forecast emails to subscribers.


Location: src/services/email-service/.

2. Communication Strategy
   All inter-service communication is implemented using REST HTTP to ensure simplicity, compatibility, and ease of debugging. The communication flow between services is outlined below:



Source
Destination
Purpose
Protocol / Method



Client
API Gateway
Entry point for all client requests
REST HTTP (e.g., POST /subscriptions)


API Gateway
Subscription Service
Forward requests to manage user subscriptions
REST HTTP (e.g., POST /subscriptions)


API Gateway
Weather Service
Forward requests to fetch weather data
REST HTTP (e.g., GET /weather/:city)


Subscription Service
Email Service
Trigger confirmation or unsubscribe emails
REST HTTP (e.g., POST /emails/confirmation)


Subscription Service
Weather Service
Validate user-provided city by fetching weather data
REST HTTP (e.g., GET /weather/:city)


Weather Service
External API
Retrieve weather forecast data
REST HTTP (e.g., GET /api/weather)


Weather Service
Redis
Cache weather data for reuse
REST HTTP (via Redis HTTP client or adapter)


Email Service
Subscription Service
Fetch confirmed subscribers for forecast emails
REST HTTP (e.g., GET /subscriptions/confirmed)


Email Service
Weather Service
Retrieve weather data for each subscriber's city
REST HTTP (e.g., GET /weather/:city)



REST HTTP Details:
All services expose RESTful APIs with standard HTTP methods (GET, POST, PUT, DELETE).
JSON is used as the data format for requests and responses.
Authentication between services (if needed) can be implemented using API keys or JWT tokens passed in HTTP headers.
Error handling follows standard HTTP status codes (e.g., 200 OK, 400 Bad Request, 500 Internal Server Error).



3. Integration with Existing Structure
   The microservices architecture aligns with the existing monolithic structure, which uses Layered Architecture with DDD and SOLID/GRASP influences:

Controllers from the monolith are moved to the API Gateway and individual services’ HTTP endpoints.
Services are split into Subscription Service, Weather Service, and Email Service.
Repositories remain within their respective services (e.g., ISubscriptionRepository in Subscription Service).
Models (e.g., Subscription.ts) are reused in the Subscription Service’s Domain layer.
Middleware for validation or error handling is integrated into the API Gateway or individual services.
Utils (e.g., email providers) are incorporated into the Email Service or Weather Service as needed.
Types/Interfaces (e.g., WeatherDataDTO.ts) are shared across services to maintain consistent contracts.

4. Benefits of the Microservices Architecture

Independent Deployment: Each service can be developed, deployed, and scaled independently.
Scalability: Services like the Weather Service, which may experience high load due to API calls, can be scaled separately.
Maintainability: Smaller, focused services are easier to understand and update.
Technology Flexibility: Each service can use different technologies if needed, though all currently use Node.js/TypeScript with REST HTTP.
Fault Isolation: A failure in one service (e.g., Email Service) does not affect others (e.g., Subscription Service).

5. Potential Considerations

Increased Complexity: Managing multiple services requires additional effort for deployment, monitoring, and orchestration (e.g., using Kubernetes or Docker).
Network Latency: REST HTTP communication introduces latency compared to in-memory calls in a monolith. Optimize API calls and caching strategies.
Data Consistency: Each service manages its own data store, requiring careful design to ensure consistency (e.g., eventual consistency for subscriptions).
API Design: Ensure REST endpoints are well-documented and follow best practices (e.g., using OpenAPI/Swagger).
