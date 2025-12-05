import { type Task } from "./coroutine";
import type { Transform } from "./transform";
import type { WorldObject } from "./world-object";

type Range<
	N extends number,
	Result extends number[] = [],
> = Result["length"] extends N
	? Result[number]
	: Range<N, [...Result, Result["length"]]>;

type DepthConstraint = Range<21> extends infer R ? Exclude<R, 0> : never;

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

	/// Get behaviourType in the WorldObject owned by this behaviour
	public getBehaviourByType<T extends Behaviour>(
		type: new (...args: any[]) => T,
	): T | null {
		return this.worldObject.getBehaviour(type);
	}

	public getBehavioursByTypeInChildren<T extends Behaviour>(
		type: new (...args: any[]) => T,
		depth: DepthConstraint = 2,
	): T[] {
		if (depth < 1 || depth > 20)
			throw new Error("Depth must be between 1 and 20");
		const behaviours: T[] = [];
		Behaviour.getBehavioursRecursiveChildren(
			behaviours,
			this.worldObject,
			type,
			depth,
		);
		return behaviours;
	}

	public getBehavioursByTypeInParents<T extends Behaviour>(
		type: new (...args: unknown[]) => T,
		depth: DepthConstraint = 2,
	): T[] {
		const behaviours: T[] = [];
		Behaviour.getBehavioursRecursiveParents(
			behaviours,
			this.worldObject,
			type,
			depth,
		);
		return behaviours;
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

	/// Find behaviours of type in the World
	public findBehavioursByType<T extends Behaviour>(
		type: new (...args: any[]) => T,
	): T[] {
		return this.worldObject.world.findBehaviours(type);
	}

	/// Find first behaviour of type in the World
	public findFirstBehaviourByType<T extends Behaviour>(
		type: new (...args: any[]) => T,
	): T | null {
		return this.worldObject.world.findFirstBehaviour(type);
	}

	///  Remove behaviourType in the WorldObject owned by this behaviour
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

	private static getBehavioursRecursiveChildren<T extends Behaviour>(
		list: Behaviour[],
		wo: WorldObject,
		type: new (...args: any[]) => T,
		depth: number,
	): void {
		const children = wo.children;
		depth--;
		// stop case
		if (depth < 0 || children.length === 0) return;

		for (const child of children) {
			const behaviour = child.getBehaviour(type);
			if (behaviour) list.push(behaviour);
			// recursive call
			Behaviour.getBehavioursRecursiveChildren(list, child, type, depth);
		}
	}

	private static getBehavioursRecursiveParents<T extends Behaviour>(
		list: Behaviour[],
		wo: WorldObject,
		type: new (...args: any[]) => T,
		depth: number,
	): void {
		const parent = wo.parent;
		depth--;
		if (!parent || depth < 0) return;

		const behaviour = parent.getBehaviour(type);
		if (behaviour) list.push(behaviour);
		// recursive call
		Behaviour.getBehavioursRecursiveParents(list, parent, type, depth);
	}
}
