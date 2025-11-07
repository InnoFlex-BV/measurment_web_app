# Use Python 3.13 slim image as base
# Slim variant provides good balance between size and functionality
FROM python:3.13-slim

# Set working directory inside the container
# All subsequent commands execute from this directory
WORKDIR /app

# Install system dependencies that some Python packages might need
# This runs before Python package installation to leverage layer caching
    # PostgreSQL client libraries needed by psycopg2
    # GCC compiler needed for some Python packages with C extensions
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first for better layer caching
# This layer only rebuilds when requirements.txt changes
COPY requirements.txt .

# Install Python dependencies
# --no-cache-dir reduces image size by not caching pip downloads
# --upgrade ensures pip itself is current
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
# This layer rebuilds whenever any Python file changes
COPY . .

# Expose port 8000 where FastAPI will listen
# This is documentation for users of the image
EXPOSE 8000

# Default command to run the application
# This will be overridden in docker-compose.yml for development
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
