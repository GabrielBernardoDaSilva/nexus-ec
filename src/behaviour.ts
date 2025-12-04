import { Coroutine, type Task } from "./coroutine";
import type { Transform } from "./transform";
import type { WorldObject } from "./world-object";

export abstract class Behaviour {
	private readonly _worldObject: WeakRef<WorldObject>;
	protected readonly transform: WeakRef<Transform>;
	public isEnabled: boolean = true;
	constructor(
		worldObject: WeakRef<WorldObject>,
		transform: WeakRef<Transform>,
	) {
		this._worldObject = worldObject;
		this.transform = transform;
	}
	public startup(): void {}
	public update(_deltaTime: number): void {}
	public shutdown(): void {}

	public get signature(): string {
		return typeof this;
	}
	public get worldObject(): WorldObject {
		if (!this._worldObject.deref()) {
			throw new Error("WorldObject has been garbage collected");
		}
		return this._worldObject.deref() as WorldObject;
	}

	public getBehaviourByType<T extends Behaviour>(
		type: new (...args: any[]) => T,
	): T | null {
		return this.worldObject.getBehaviour(type);
	}

	public addBehaviour<T extends Behaviour>(
		behaviourType: new (...args: any[]) => T,
	): void {
		try {
			this.worldObject.addBehaviour(behaviourType);
		} catch (e) {
			throw e;
		}
	}

	public findBehavioursByType<T extends Behaviour>(
		type: new (...args: any[]) => T,
	): T[] {
		return this.worldObject.world.findBehaviours(type);
	}

	public removeBehaviour<T extends Behaviour>(
		behaviourType: new (...args: any[]) => T,
	): boolean {
		return this.worldObject.removeBehaviour(behaviourType);
	}

	public destroyWorldObject(): void {
		this._worldObject?.deref()?.destroy();
	}

	public addCoroutine(task: Task): void {
		this.worldObject.addCoroutine(task);
	}

	public removeCoroutine(task: Task): void {
		this.worldObject.removeCoroutine(task);
	}
}
