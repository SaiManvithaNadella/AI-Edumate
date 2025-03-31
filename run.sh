#!/bin/bash
echo "Starting backend..."
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
