#!/bin/bash
echo "Starting VQA Models Docker Containers"
docker-compose -f docker-compose-MODELS.yml up --build
