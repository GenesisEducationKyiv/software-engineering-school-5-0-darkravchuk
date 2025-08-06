import { Email } from '../value-objects/Email';
import { City } from '../value-objects/City';
import { Frequency } from '../value-objects/Frequency';
import { Token } from '../value-objects/Token';
import { SubscriptionId } from '../value-objects/SubscriptionId';

export class Subscription {
  private constructor(
    private readonly _id: SubscriptionId,
    private readonly _email: Email,
    private readonly _city: City,
    private readonly _frequency: Frequency,
    private _confirmed: boolean,
    private readonly _confirmationToken: Token,
    private readonly _unsubscribeToken: Token,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  public static create(
    email: Email,
    city: City,
    frequency: Frequency,
    confirmationToken: Token,
    unsubscribeToken: Token
  ): Subscription {
    return new Subscription(
      SubscriptionId.generate(),
      email,
      city,
      frequency,
      false, // Initially unconfirmed
      confirmationToken,
      unsubscribeToken,
      new Date(),
      new Date()
    );
  }

  public static fromPersistence(
    id: SubscriptionId,
    email: Email,
    city: City,
    frequency: Frequency,
    confirmed: boolean,
    confirmationToken: Token,
    unsubscribeToken: Token,
    createdAt: Date,
    updatedAt: Date
  ): Subscription {
    return new Subscription(
      id,
      email,
      city,
      frequency,
      confirmed,
      confirmationToken,
      unsubscribeToken,
      createdAt,
      updatedAt
    );
  }

  public confirm(): void {
    if (this._confirmed) {
      throw new Error('Subscription is already confirmed');
    }
    this._confirmed = true;
    this._updatedAt = new Date();
  }

  public isConfirmed(): boolean {
    return this._confirmed;
  }

  public canConfirmWith(token: Token): boolean {
    return this._confirmationToken.equals(token);
  }

  public canUnsubscribeWith(token: Token): boolean {
    return this._unsubscribeToken.equals(token);
  }

  // Getters
  public get id(): SubscriptionId {
    return this._id;
  }

  public get email(): Email {
    return this._email;
  }

  public get city(): City {
    return this._city;
  }

  public get frequency(): Frequency {
    return this._frequency;
  }

  public get confirmed(): boolean {
    return this._confirmed;
  }

  public get confirmationToken(): Token {
    return this._confirmationToken;
  }

  public get unsubscribeToken(): Token {
    return this._unsubscribeToken;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }
}
