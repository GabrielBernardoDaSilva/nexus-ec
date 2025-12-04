import { mat4, vec3 } from "gl-matrix";
import type { WorldObject } from "./world-object";

export class Transform {
	private _localPosition: vec3;
	private _localScale: vec3;
	private _worldObject: WeakRef<WorldObject>;

	constructor(
		worldObject: WeakRef<WorldObject>,
		position = vec3.create(),
		scale = vec3.fromValues(1, 1, 1),
	) {
		this._localPosition = position;
		this._localScale = scale;
		this._worldObject = worldObject;
	}

	public get worldObject(): WorldObject {
		if (!this._worldObject.deref()) {
			throw new Error("WorldObject has been garbage collected");
		}
		return this._worldObject.deref() as WorldObject;
	}

	public set position(position: vec3) {
		this._localPosition = position;
	}
	public set scale(scale: vec3) {
		this._localScale = scale;
	}

	public get position(): vec3 {
		return this._localPosition;
	}

	public get scale(): vec3 {
		return this._localScale;
	}

	public get worldPosition(): vec3 {
		const modelMatrix = this.model;
		const worldPos = vec3.create();
		vec3.transformMat4(worldPos, vec3.fromValues(0, 0, 0), modelMatrix);
		return worldPos;
	}

	public get worldScale(): vec3 {
		const parent = this.worldObject.parent;
		if (parent) {
			const parentScale = parent.transform.worldScale;
			return vec3.fromValues(
				this._localScale[0] * parentScale[0],
				this._localScale[1] * parentScale[1],
				this._localScale[2] * parentScale[2],
			);
		}
		return this._localScale;
	}

	public get model(): mat4 {
		const m = mat4.create();
		mat4.identity(m);
		mat4.translate(m, m, this._localPosition);
		mat4.scale(m, m, this._localScale);
		const parent = this.worldObject.parent;
		if (parent) {
			return mat4.multiply(m, parent.transform.model, m);
		}
		return m;
	}
}
