# Nexus-EC 🏗️

[![npm version](https://badge.fury.io/js/nexus-ec.svg)](https://badge.fury.io/js/nexus-ec)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A lightweight, performant Entity-Component (EC) library for JavaScript/TypeScript, featuring signals for event-driven architecture and coroutines for asynchronous behaviors. Perfect for games, simulations, and reactive applications.

## ✨ Features

- **Entity-Component (EC)**: Decouple data and logic for scalable architectures.
- **Signal System**: Godot-inspired named signals for flexible event handling.
- **Coroutines**: Built-in support for asynchronous tasks with yielding.
- **TypeScript First**: Full type safety and IntelliSense support.
- **Lightweight**: Minimal dependencies, optimized for performance.
- **Tree Structure**: Hierarchical world objects with parent-child relationships.

## 🚀 Installation

```bash
npm install nexus-ec
# or
yarn add nexus-ec
# or
bun add nexus-ec
```

## 📖 Quick Start

```typescript
import { World, Behaviour, Signal } from "nexus-ec";

// Define a custom Behaviour
class PlayerBehaviour extends Behaviour {
  public override startup(): void {
    console.log("Player ready!");
  }

  public override update(deltaTime: number): void {
    // Game logic here
  }
}

// Create a world and add entities
const world = new World();
const playerObject = world.createWorldObject().deref();
if (playerObject) {
  playerObject.addBehaviour(PlayerBehaviour);
}

// Run the simulation
world.startup();
world.update(0.016); // 60 FPS
world.shutdown();
```

## 🎯 Key Concepts

### World

The central hub managing all entities and signals.

### WorldObject

Entities that hold behaviours and can form hierarchies.

### Behaviour

Components that define logic (startup, update, shutdown).

### Signals

Event system for decoupled communication:

```typescript
// Emit a signal
world.emitSignal("playerDied", { score: 100 });

// Listen to a signal
world.connectSignal("playerDied", (data) => {
  console.log("Game Over!", data.score);
});
```

### Coroutines

Asynchronous tasks with yielding:

```typescript
class MyBehaviour extends Behaviour {
  public *myCoroutine() {
    console.log("Starting...");
    yield new WaitAmountOfSeconds(2);
    console.log("Done!");
  }

  public override startup(): void {
    this.addCoroutine(this.myCoroutine.bind(this));
  }
}
```

## 🛠️ Development

```bash
# Install dependencies
bun install

# Build the library
bun run build

# Watch mode
bun run dev
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ using TypeScript and Bun.
