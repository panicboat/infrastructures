# Infrastucture

## Usage

### Initialize

Creates a new CDK project in the current directory from a specified template

```bash
make init TARGET=${TARGET}
```

### Build

Install the npm packages.

```bash
make build TARGET=${TARGET}
```

### Bootstrap

Deploys the CDK Toolkit staging stack.

```bash
make bootstrap PROFILE=${PROFILE} TARGET=${TARGET}
```

### DryRun

Compares the specified stack and its dependencies with the deployed stacks or a local CloudFormation template.

```bash
make plan ENV=${ENV} PROFILE=${PROFILE} TARGET=${TARGET}
```

### Deploy

Deploys one or more specified stacks.

```bash
make deploy ENV=${ENV} PROFILE=${PROFILE} TARGET=${TARGET}
```

### Forced package updates

```bash
docker compose run --rm app bash -c 'cd src/$(TARGET) && yarn upgrade aws-cdk-modules'
```
