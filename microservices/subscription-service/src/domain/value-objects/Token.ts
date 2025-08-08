import { v4 as uuidv4 } from 'uuid';

export class Token {
  private readonly value: string;

  constructor(token: string) {
    if (!this.isValid(token)) {
      throw new Error(`Invalid token format: ${token}`);
    }
    this.value = token;
  }

  private isValid(token: string): boolean {
    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(token);
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: Token): boolean {
    return this.value === other.value;
  }

  public static generate(): Token {
    return new Token(uuidv4());
  }

  public static fromString(token: string): Token {
    return new Token(token);
  }
}
