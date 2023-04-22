# Infrastucture

## Usage

### Preparation

First, set the environment variables for Makefile.

[.env.makefile](.env.makefile)

#### Use aws config and credentials files

For `PROFILE`, leave the value empty as follows.

```
PROFILE=
```

#### Use aws environment variables

Set AWS environment variables in the terminal.

```bash
export AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"
export AWS_SESSION_TOKEN="YOUR_AWS_SESSION_TOKEN"
```

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
docker compose run --rm app bash -c 'cd src/sandbox && yarn upgrade aws-cdk-modules'
```
