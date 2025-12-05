import type { Behaviour } from "./behaviour";
import { Coroutine, type Task } from "./coroutine";
import { Transform } from "./transform";
import type { World } from "./world";

export class WorldObject {
	private readonly _id: string = crypto.randomUUID();
	private _name: string = "WorldObject";
	private readonly _behaviours: Behaviour[] = [];
	private readonly _world: WeakRef<World>;
	private _parent: WeakRef<WorldObject> | null = null;
	private readonly _children: WeakRef<WorldObject>[] = [];
	public readonly transform: Transform;
	private readonly _coroutines = new Map<string, Coroutine>();
	public isActive: boolean = true;
	constructor(world: WeakRef<World>, ...behaviours: Behaviour[]) {
		this._world = world;
		this._behaviours.push(...behaviours);
		this.transform = new Transform(new WeakRef(this));
	}

	public get world(): World {
		if (!this._world.deref()) {
			throw new Error("World has been garbage collected");
		}
		return this._world.deref() as World;
	}

	public startup(): void {
		this._behaviours.forEach((behaviour) => behaviour.startup());
	}
	public update(deltaTime: number): void {
		this._behaviours.forEach((behaviour) => {
			if (behaviour.isEnabled) behaviour.update(deltaTime);
		});
	}
	public shutdown(): void {
		this._behaviours.forEach((behaviour) => behaviour.shutdown());
	}

	/// behaviour management
	/// Adds a behaviour to the WorldObject. Throws an error if a behaviour of the same type already exists.
	public addBehaviour<T extends Behaviour>(
		behaviourType: new (...args: any[]) => T,
	): void {
		const existing = this.getBehaviour(
			behaviourType.constructor as new (
				...args: any[]
			) => Behaviour,
		);
		if (existing) {
			throw new Error(
				`Behaviour of type ${behaviourType.constructor.name} already exists on WorldObject ${this._name}`,
			);
		}
		const behaviour = new behaviourType(
			new WeakRef(this),
			new WeakRef(this.transform),
		);
		this._behaviours.push(behaviour);
	}

	public getBehaviour<T extends Behaviour>(
		behaviourType: new (...args: any[]) => T,
	): T | null {
		for (const behaviour of this._behaviours) {
			if (behaviour instanceof behaviourType) {
				return behaviour as T;
			}
		}
		return null;
	}

	public removeBehaviour<T extends Behaviour>(
		behaviourType: new (...args: any[]) => T,
	): boolean {
		const index = this._behaviours.findIndex(
			(behaviour) => behaviour instanceof behaviourType,
		);
		if (index !== -1) {
			const behaviour = this._behaviours[index];
			behaviour?.shutdown();
			this._behaviours.splice(index, 1);
			return true;
		}
		return false;
	}

	public destroy(): void {
		this.shutdown();
		this._coroutines.clear();
		this.world.removeWorldObject(this);
	}

	public addChild(child: WorldObject): void {
		child.addParent(this);
		this._children.push(new WeakRef(child));
	}

	public removeChild(child: WorldObject): boolean {
		const index = this._children.findIndex(
			(weakRef) => weakRef.deref()?.id === child.id,
		);
		if (index !== -1) {
			const childRef = this._children[index];
			if (childRef) childRef.deref()?.removeParent();
			this._children.splice(index, 1);
			return true;
		}
		return false;
	}

	private addParent(parent: WorldObject): void {
		this._parent = new WeakRef(parent);
	}

	private removeParent(): void {
		this._parent = null;
	}

	public addCoroutine(task: Task, ...args: unknown[]): void {
		const coroutine = new Coroutine(task, ...args);
		const coroutineHash = this.simpleHash(task.name);
		if (!this._coroutines.get(coroutineHash))
			this._coroutines.set(coroutineHash, coroutine);
	}

	public removeCoroutine(task: Task): boolean {
		const coroutineHash = this.simpleHash(task.name);
		return this._coroutines.delete(coroutineHash);
	}

	private simpleHash(str: string): string {
		let hash = 5381;
		for (let i = 0; i < str.length; i++) {
			hash = (hash << 5) + hash + str.charCodeAt(i);
		}
		return hash.toString();
	}

	//setters
	public set name(value: string) {
		this._name = value;
	}

	// getters
	public get name(): string {
		return this._name;
	}
	public get id(): string {
		return this._id;
	}
	public get parent(): WorldObject | null {
		if (this._parent) {
			return this._parent.deref() || null;
		}
		return null;
	}

	public get children(): WorldObject[] {
		return this._children
			.map((weakRef) => weakRef.deref())
			.filter((obj): obj is WorldObject => obj !== undefined);
	}

	public get coroutines(): Readonly<SetIterator<Coroutine>> {
		return Object.freeze(this._coroutines.values());
	}
}
