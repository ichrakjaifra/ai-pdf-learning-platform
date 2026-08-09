#!/bin/bash

# Initialize git
git init
git checkout -b main

# Create main directories
mkdir -p backend frontend

# Add files
git add .
git commit -m "init: project structure and infrastructure configs"

# Create development branch
git checkout -b dev

# Add placeholder remote (user can replace this later)
git remote add origin REPO_URL_PLACEHOLDER

echo "Git repository initialized successfully with 'main' and 'dev' branches."
echo "First commit created on 'main' branch."
