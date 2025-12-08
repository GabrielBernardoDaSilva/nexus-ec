import { describe, it, expect, vi } from "vitest";
import {
	World,
	WorldObject,
	Behaviour,
	Signal,
	Coroutine,
	WaitAmountOfSeconds,
	SignalHandler,
} from "../src/index.js";
import type { WorldDebugInfo } from "../src/world.js";

class TestSignal extends SignalHandler {}

describe("Nexus-EC Library", () => {
	describe("World", () => {
		it("should create a world", () => {
			const world = new World();
			expect(world).toBeInstanceOf(World);
		});

		it("should create world objects", () => {
			const world = new World();
			const obj = world.createWorldObject();
			expect(obj).toBeDefined();
			expect(obj.deref()).toBeInstanceOf(WorldObject);
		});

		it("should emit and connect signals", () => {
			const world = new World();
			const mockCallback = vi.fn();
			world.connectSignal(TestSignal, mockCallback);
			world.emitSignal(TestSignal, "arg1", "arg2");
			expect(mockCallback).toHaveBeenCalledWith("arg1", "arg2");
		});
	});

	describe("WorldObject", () => {
		it("should create a world object", () => {
			const world = new World();
			const obj = world.createWorldObject().deref();
			expect(obj).toBeInstanceOf(WorldObject);
			expect(obj?.id).toBeDefined();
		});

		it("should add and get behaviours", () => {
			class TestBehaviour extends Behaviour {
				public value = 42;
			}

			const world = new World();
			const obj = world.createWorldObject().deref();
			if (obj) {
				obj.addBehaviour(TestBehaviour);
				const behaviour = obj.getBehaviour(TestBehaviour);
				expect(behaviour).toBeInstanceOf(TestBehaviour);
				expect(behaviour?.value).toBe(42);
			}
		});

		it("should manage coroutines", () => {
			function* testCoroutine() {
				yield new WaitAmountOfSeconds(0.1);
				return "done";
			}

			const world = new World();
			const obj = world.createWorldObject().deref();
			if (obj) {
				obj.addCoroutine(testCoroutine);
				expect(obj.coroutines).toBeDefined();
				// Note: Full coroutine testing would require mocking timers
			}
		});
	});

	describe("Behaviour", () => {
		it("should have lifecycle methods", () => {
			class TestBehaviour extends Behaviour {
				public startupCalled = false;
				public updateCalled = false;
				public shutdownCalled = false;

				public override startup(): void {
					this.startupCalled = true;
				}

				public override update(deltaTime: number): void {
					this.updateCalled = true;
				}

				public override shutdown(): void {
					this.shutdownCalled = true;
				}
			}

			const world = new World();
			const obj = world.createWorldObject().deref();
			if (obj) {
				obj.addBehaviour(TestBehaviour);
				const behaviour = obj.getBehaviour(TestBehaviour);
				expect(behaviour).toBeDefined();

				if (behaviour) {
					behaviour.startup();
					expect(behaviour.startupCalled).toBe(true);

					behaviour.update(0.016);
					expect(behaviour.updateCalled).toBe(true);

					behaviour.shutdown();
					expect(behaviour.shutdownCalled).toBe(true);
				}
			}
		});
	});

	describe("Signal", () => {
		it("should subscribe and emit", () => {
			const signal = new Signal();
			const mockCallback = vi.fn();
			signal.subscribe(mockCallback);
			signal.emit("test", 123);
			expect(mockCallback).toHaveBeenCalledWith("test", 123);
		});

		it("should unsubscribe", () => {
			const signal = new Signal();
			const mockCallback = vi.fn();
			signal.subscribe(mockCallback);
			signal.unsubscribe(mockCallback);
			signal.emit("test");
			expect(mockCallback).not.toHaveBeenCalled();
		});
	});

	describe("Coroutine", () => {
		it("should create and start a coroutine", () => {
			function* simpleCoroutine() {
				yield new WaitAmountOfSeconds(0.1);
				return "done";
			}

			const coroutine = new Coroutine(simpleCoroutine);
			expect(coroutine).toBeInstanceOf(Coroutine);
			expect(coroutine.name).toBe("simpleCoroutine");
		});

		it("should handle WaitAmountOfSeconds", () => {
			function* waitingCoroutine() {
				yield new WaitAmountOfSeconds(1);
				return "waited";
			}

			const coroutine = new Coroutine(waitingCoroutine);
			expect(coroutine).toBeDefined();
			// Note: Testing the actual waiting would require timer mocking
		});
	});

	describe("WaitAmountOfSeconds", () => {
		it("should create a wait instruction", () => {
			const wait = new WaitAmountOfSeconds(2);
			expect(wait).toBeInstanceOf(WaitAmountOfSeconds);
		});
	});

	describe("Debug Utilities", () => {
		it("should provide debug information", () => {
			class TestBehaviour extends Behaviour {}

			const world = new World();
			const wo = world.createWorldObject(TestBehaviour).deref();
			const wo1 = world.createWorldObject(TestBehaviour).deref();
			if (wo && wo1) {
				wo.addChild(wo1);
			}
			const info = world.debug();

			console.log("Debug info:", info); // Add this to see the output

			const debugObj = {
				sizeInBytes: info.sizeInBytes,
				worldObjects: [
					{
						isActive: true,
						id: wo!.id,
						name: wo!.name,
						behaviours: [
							{
								name: "TestBehaviour",
								isEnabled: true,
							},
						],
						children: [
							{
								isActive: true,
								id: wo1!.id,
								name: wo1!.name,
								behaviours: [
									{
										name: "TestBehaviour",
										isEnabled: true,
									},
								],
								children: null,
							},
						],
					},
				],
				worldSignals: [],
			} as WorldDebugInfo;

			expect(info).toEqual(debugObj);
		});
	});
});
