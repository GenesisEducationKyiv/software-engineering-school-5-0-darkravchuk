export class EmailAddress {
  private readonly value: string;

  constructor(email: string) {
    this.value = this.validate(email);
  }

  private validate(email: string): string {
    if (!email || email.trim().length === 0) {
      throw new Error('Email address cannot be empty');
    }

    const trimmedEmail = email.trim().toLowerCase();

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(trimmedEmail)) {
      throw new Error(`Invalid email address format: ${email}`);
    }

    if (trimmedEmail.length > 254) {
      throw new Error('Email address too long (max 254 characters)');
    }

    return trimmedEmail;
  }

  public getValue(): string {
    return this.value;
  }

  public getDisplayName(): string {
    return this.value;
  }

  public getDomain(): string {
    return this.value.split('@')[1];
  }

  public getLocalPart(): string {
    return this.value.split('@')[0];
  }

  public equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }

  public static fromString(email: string): EmailAddress {
    return new EmailAddress(email);
  }

  public static isValid(email: string): boolean {
    try {
      new EmailAddress(email);
      return true;
    } catch {
      return false;
    }
  }
}
