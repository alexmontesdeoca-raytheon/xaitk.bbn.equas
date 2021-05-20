#!/bin/bash
echo "Starting EQUAS and MongoDB Docker Containers"
docker-compose -f docker-compose-EQUAS.yml up --build -d