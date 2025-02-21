# Use Bun's official image
FROM oven/bun:latest

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy the rest of the app
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to start the app
CMD ["bun", "run", "start"]
