export interface DomainEvent {
  readonly eventId: string;
  readonly eventName: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly payload: Record<string, any>;
}

export type DomainEventListener<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

export class DomainEventPublisher {
  private static instance: DomainEventPublisher;
  private listeners: Map<string, DomainEventListener[]> = new Map();

  private constructor() {}

  public static getInstance(): DomainEventPublisher {
    if (!DomainEventPublisher.instance) {
      DomainEventPublisher.instance = new DomainEventPublisher();
    }
    return DomainEventPublisher.instance;
  }

  public subscribe<T extends DomainEvent>(eventName: string, listener: DomainEventListener<T>): void {
    const list = this.listeners.get(eventName) || [];
    list.push(listener as DomainEventListener);
    this.listeners.set(eventName, list);
  }

  public unsubscribe<T extends DomainEvent>(eventName: string, listener: DomainEventListener<T>): void {
    const list = this.listeners.get(eventName);
    if (list) {
      this.listeners.set(
        eventName,
        list.filter(l => l !== listener)
      );
    }
  }

  public async publish(event: DomainEvent): Promise<void> {
    const list = this.listeners.get(event.eventName) || [];
    const wildcardList = this.listeners.get('*') || [];

    for (const listener of [...list, ...wildcardList]) {
      try {
        await listener(event);
      } catch (err) {
        console.error(`Error handling domain event ${event.eventName}:`, err);
      }
    }
  }

  public clearListeners(): void {
    this.listeners.clear();
  }
}

export function createDomainEvent(eventName: string, aggregateId: string, payload: Record<string, any>): DomainEvent {
  return {
    eventId: `${eventName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    eventName,
    occurredOn: new Date(),
    aggregateId,
    payload
  };
}
