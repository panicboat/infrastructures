# Infrastucture

## Usage

### Preparation

First, set the environment variables for Makefile.

[.env.makefile](.env.makefile)

### Initialize

Creates a new CDK project in the current directory from a specified template

```bash
make init
```

### Build

Install the npm packages.

```bash
make build
```

### Bootstrap

Deploys the CDK Toolkit staging stack.

```bash
make bootstrap
```

### DryRun

Compares the specified stack and its dependencies with the deployed stacks or a local CloudFormation template.

```bash
make plan
```

### Deploy

Deploys one or more specified stacks.

```bash
make deploy
```

### Forced package updates

```bash
docker compose run --rm app bash -c 'cd src/$(TARGET) && yarn upgrade aws-cdk-modules'
```
