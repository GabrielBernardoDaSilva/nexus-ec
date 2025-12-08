export class Signal {
	private readonly _subscribers: Set<(...args: unknown[]) => void> = new Set();
	public subscribe(callback: (...args: unknown[]) => void): void {
		this._subscribers.add(callback);
	}
	public unsubscribe(callback: (...args: unknown[]) => void): void {
		this._subscribers.delete(callback);
	}
	public emit(...args: unknown[]): void {
		this._subscribers.forEach((callback) => callback(...args));
	}
	public get subscriberCount(): number {
		return this._subscribers.size;
	}
}

export abstract class SignalHandler {}
