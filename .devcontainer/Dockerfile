# Use Bun's official image
FROM oven/bun:latest

# Set working directory to match the VS Code workspace
WORKDIR /workspace

# Copy package.json and bun.lockb first (ensures caching)
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install

# Copy the rest of the application files
COPY . .

# Expose the development port
EXPOSE 3000

# Start the Bun server automatically
CMD ["bun", "run", "src/index.ts"]