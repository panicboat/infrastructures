FROM node:latest

# RUN apt-get update && apt-get install -y \
#   git \
#   && rm -rf /var/lib/apt/lists/*
# RUN mkdir -p -m 0700 ~/.ssh && \
#   ssh-keyscan github.com >> ~/.ssh/known_hosts && \
#   git config --global url.git@github.com:.insteadOf https://github.com/

RUN npm install -g aws-cdk@v2
