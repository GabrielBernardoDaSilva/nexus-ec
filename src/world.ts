import { WorldObject } from "./world-object";
import { Signal, SignalHandler } from "./signal";
import type { Behaviour } from "./behaviour";
import type { Task } from "./coroutine";

export class World {
	private readonly _worldObjects: Map<string, WorldObject>;
	private readonly _signals: Map<string, Signal> = new Map();
	public constructor() {
		this._worldObjects = new Map<string, WorldObject>();
	}

	public startup(): void {
		this._worldObjects.forEach((worldObject) => worldObject.startup());
	}

	public update(deltaTime: number): void {
		this.startCoroutines();
		this._worldObjects.forEach((worldObject) => {
			if (worldObject.isActive) worldObject.update(deltaTime);
		});
	}

	public shutdown(): void {
		console.log("World shutting down...");
		this._worldObjects.forEach((worldObject) => worldObject.shutdown());
	}

	public createWorldObject<T extends Behaviour>(
		...args: (new (
			...args: any[]
		) => T)[]
	): WeakRef<WorldObject> {
		const worldObject = new WorldObject(new WeakRef(this));
		for (const behaviour of args) {
			worldObject.addBehaviour(behaviour);
		}
		this._worldObjects.set(worldObject.id, worldObject);
		return new WeakRef(worldObject);
	}

	public get worldObjects(): Readonly<IterableIterator<WorldObject>> {
		const iters = Object.freeze(this._worldObjects.values());
		return iters;
	}

	public removeWorldObjectById(id: string): boolean {
		return this._worldObjects.delete(id);
	}
	public removeWorldObject(wo: WorldObject): boolean {
		return this._worldObjects.delete(wo.id);
	}

	public emitSignal<T extends SignalHandler>(
		signalType: new (...args: []) => T,
		...args: any[]
	): void {
		const name = signalType.name;
		const signal = this._signals.get(name);
		if (signal) signal.emit(...args);
	}

	public connectSignal<T extends SignalHandler>(
		signalType: new (...args: []) => T,
		callback: (...args: any[]) => void,
	): void {
		const name = signalType.name;
		let signal = this._signals.get(name);
		if (!signal) {
			signal = new Signal();
			this._signals.set(name, signal);
		}
		signal.subscribe(callback);
	}

	public disconnectSignal(
		name: string,
		callback: (...args: any[]) => void,
	): void {
		const signal = this._signals.get(name);
		if (signal) signal.unsubscribe(callback);
	}

	public findBehaviours<T extends Behaviour>(
		behaviourType: new (...args: any[]) => T,
	): T[] {
		const behaviours: T[] = [];
		for (const worldObject of this._worldObjects.values()) {
			const behaviour = worldObject.getBehaviour(behaviourType);
			if (behaviour) behaviours.push(behaviour);
		}
		return behaviours;
	}

	public findFirstBehaviour<T extends Behaviour>(
		behaviourType: new (...args: any[]) => T,
	): T | null {
		for (const worldObject of this._worldObjects.values()) {
			const behaviour = worldObject.getBehaviour(behaviourType);
			if (behaviour) return behaviour;
		}
		return null;
	}

	private startCoroutines(): void {
		this._worldObjects.forEach((worldObject) => {
			worldObject.coroutines.forEach((coroutine) => coroutine.start());
		});
	}

	public pauseAllCoroutines(): void {
		this._worldObjects.forEach((worldObject) => {
			worldObject.coroutines.forEach((coroutine) => coroutine.stop());
		});
	}

	public resumeCoroutine(task: Task): void {
		this._worldObjects.forEach((worldObject) => {
			worldObject.coroutines.forEach((coroutine) => {
				if (coroutine.name === task.name) {
					coroutine.resume();
				}
			});
		});
	}
}
