# Weather Subscription Service

This is a web application that allows users to subscribe to weather updates for specific cities with hourly or daily frequency, confirm their subscriptions, and unsubscribe. The application is already deployed and accessible 📍[https://se-school-5-website-kravchuk.onrender.com/](https://se-school-5-website-kravchuk.onrender.com/)📍.

## 📍Deployed Application📍

The application is successfully deployed and running. You can access it at 📍[https://se-school-5-website-kravchuk.onrender.com/](https://se-school-5-website-kravchuk.onrender.com/)📍. The service provides a simple interface for subscribing to weather updates and handles email confirmations and unsubscriptions via unique tokens.

## Environment Variables

To run the application locally or configure it properly, set the following environment variables in a `.env` file:

- `DB_HOST`: Database host (default: `localhost`).
- `DB_PORT`: Database port (default: `5432`).
- `DB_USER`: Database username (default: `postgres`).
- `DB_PASSWORD`: Database password (default: `qwerty`).
- `DB_NAME`: Database name (default: `weather_db`).
- `WEATHER_API_KEY`: API key for WeatherAPI (required for fetching weather data).
- `SENDGRID_API_KEY`: API key for SendGrid (required for sending confirmation emails).
- `EMAIL`: Authorized email in SebdGrid API.
- `DOMAIN`: Applicable domain depending on the enviroment.

Example `.env` file:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=qwerty
DB_NAME=weather_db
WEATHER_API_KEY=your_weather_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL=your_email@your_email
DOMAIN=http://localhost:3000
```

## Endpoints

The application exposes the following API endpoints:

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

## Prerequisites

Before running the application locally or setting up the development environment, ensure the following prerequisites are met:

- **Node.js**: Version 18 or higher (recommended).
- **npm**: Version 6 or higher (included with Node.js).
- **Docker**: Required for running PostgreSQL and the application in containers.
- **PostgreSQL**: Version 15 or higher, with a database created (e.g., `weather_db`).
- **Git**: For cloning the repository.
- **WeatherAPI Key**: Obtain a free API key from [WeatherAPI](https://www.weatherapi.com/).
- **SendGrid API Key**: Obtain an API key from [SendGrid](https://sendgrid.com/) for email functionality.

To set up the environment:
1. Clone the repository: `git clone <repository-url>`.
2. Install dependencies: `npm install`.
3. Configure the `.env` file with the required environment variables.
4. Start Docker services: `docker compose up`.

## Running Tests

The application includes functional tests using Jest. To run the tests:

```bash
npm test
```



## Key Components

The application is built with a modular architecture, leveraging several key components:

- **Express Server**: Handles HTTP requests and serves the API endpoints.
- **Sequelize ORM**: Manages interactions with the PostgreSQL database for storing subscription data.
- **WeatherService**: Fetches real-time weather data from the WeatherAPI using Axios.
- **SubscriptionService**: Manages subscription logic, including creation, confirmation, and unsubscription.
- **Observer Pattern**: The application implements the Observer pattern to handle weather update notifications:
  - **SubscriptionSubject**: Acts as the subject, maintaining a list of observers (subscribed users) and notifying them when weather updates are available.
  - **EmailObserver**: Represents an observer that sends weather updates to subscribed email addresses.
  - **Relevance**: This pattern fits well here because it allows the system to dynamically notify multiple subscribers about weather changes for specific cities without tight coupling. When a weather update is triggered (hourly or daily via cron jobs), the `SubscriptionSubject` notifies all relevant `EmailObserver` instances, ensuring scalability and flexibility as the number of subscribers grows.

The Observer pattern is particularly suitable for this use case, as it decouples the weather update logic from the notification mechanism, making it easy to add new notification methods (e.g., SMS) in the future.
