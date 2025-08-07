import { v4 as uuidv4 } from 'uuid';

export class SubscriptionId {
  private readonly value: string;

  constructor(id: string) {
    if (!this.isValid(id)) {
      throw new Error(`Invalid subscription ID format: ${id}`);
    }
    this.value = id;
  }

  private isValid(id: string): boolean {
    // UUID v4 format validation or numeric ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const numericRegex = /^\d+$/;
    return uuidRegex.test(id) || numericRegex.test(id);
  }

  public toString(): string {
    return this.value;
  }

  public toNumber(): number {
    if (/^\d+$/.test(this.value)) {
      return parseInt(this.value, 10);
    }
    throw new Error('Cannot convert UUID to number');
  }

  public equals(other: SubscriptionId): boolean {
    return this.value === other.value;
  }

  public static generate(): SubscriptionId {
    return new SubscriptionId(uuidv4());
  }

  public static fromString(id: string): SubscriptionId {
    return new SubscriptionId(id);
  }

  public static fromNumber(id: number): SubscriptionId {
    return new SubscriptionId(id.toString());
  }
}
