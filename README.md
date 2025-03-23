# MD-Tauri

[简体中文](README_zh.md) | English

A modern Markdown editor built with Tauri and Vue 3, providing a seamless desktop experience for Markdown editing and preview.

## Features

- 🚀 Built with Tauri + Vue 3 for optimal desktop performance
- 📝 Real-time Markdown preview
- 🎨 Support for code syntax highlighting
- 📊 Mermaid diagram support
- 🧮 Mathematical formula rendering
- 🖼️ Multiple image upload options
- 💾 Auto-save drafts
- 🎯 Custom theme and CSS styling
- 📤 Import/Export functionality

## Installation Package

### MacOS

[MD Tauri v1.0.0](https://github.com/CrazyMrYan/md-tauri/releases/tag/v1.0.0-beta.1#:~:text=md%2Dtauri_1.0.0_aarch64.dmg)

## Preview Screenshots

![Default App](./public/assets/images/Snipaste_2025-03-07_14-10-08.png)

![Dark Theme](./public/assets/images/Snipaste_2025-03-07_14-11-26.png)

![Custom Theme](./public/assets/images/Snipaste_2025-03-07_14-12-20.png)

![Image Hosting Configuration](./public/assets/images/Snipaste_2025-03-07_14-12-58.png)

![VuePress Support](./public/assets/images/Snipaste_2025-03-07_14-16-31.png)

## Development Setup

### Prerequisites

- Node.js >= 20
- Rust (for Tauri)
- Git

### Installation

```bash
# Clone the repository
git@github.com:CrazyMrYan/md-tauri.git
cd md-tauri

# Install dependencies
npm install
```

### Development Commands

```bash
# Start development server
npm run tauri:dev

# Build for production
npm run tauri:build

# Run web version (without Tauri)
npm run dev:web

# Lint files
npm run lint
```

## Build

To build the application for production:

```bash
npm run tauri:build
```

This will create platform-specific binaries in the `src-tauri/target/release` directory.

## Tech Stack

- Tauri
- Vue 3
- TypeScript
- Vite
- TailwindCSS
- CodeMirror
- Marked
- Mermaid
- And more...

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).
