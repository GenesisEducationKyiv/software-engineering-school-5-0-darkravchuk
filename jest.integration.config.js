module.exports = {
    preset: 'ts-jest', // Для підтримки TypeScript
    testEnvironment: 'node', // Середовище для серверних тестів
    testMatch: ['**/*.integration.test.ts'], // Запускати лише файли з суфіксом .integration.test.ts
    testTimeout: 30000, // Збільшений таймаут для інтеграційних тестів (30 секунд)
    verbose: true, // Детальний вивід для зручного дебагінгу
};