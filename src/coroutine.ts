
export class WaitAmountOfSeconds {
	constructor(private seconds: number) {}
	private timeout: number | NodeJS.Timeout | undefined;

	async *run() {
		yield new Promise((resolve) => {
			this.timeout = setTimeout(resolve, this.seconds * 1000);
		});
	}

	stop() {
		if (this.timeout) clearTimeout(this.timeout);
	}
}
type RawTask = Generator<WaitAmountOfSeconds, unknown, unknown>;
export type Task = (...args: any[]) => RawTask;
export class Coroutine {
	name: string;
	task: RawTask;
	isExecuting: boolean = false;
	result: IteratorResult<WaitAmountOfSeconds, unknown> | undefined;
	constructor(task: Task, ...args: any[]) {
		this.task = task(...args);
		this.name = task.name;
	}

	public resume() {
		this.isExecuting = true;
		this.execute();
	}

	public start() {
		if (this.isExecuting) return;
		else {
			this.execute();
			this.isExecuting = true;
		}
	}

	private execute() {
		this.result = this.task.next();
		if (this.result.done) {
			this.isExecuting = false;
			return;
		}
		const value = this.result.value;
		if (value instanceof WaitAmountOfSeconds) {
			value
				.run()
				.next()
				.then(() => {
					this.task.next();
					this.execute();
				});
		}
	}

	public stop() {
		this.isExecuting = false;
		if (!this.result) return;
		const value = this.result.value;
		if (value instanceof WaitAmountOfSeconds) {
			value.stop();
		}
		this.task.return(value);
	}
}
