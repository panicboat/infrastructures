#!/bin/bash -eu
SCRIPT_DIR=$(cd $(dirname $0); pwd)
INFRA_HOME=$SCRIPT_DIR/../../src

while [ $# -gt 0 ];
do
  case ${1} in
    --environment|-e)
      env=${2}
      shift
    ;;
    --target|-t)
      target=${2}
      shift
    ;;
    --command|-c)
      cmd=${2}
      shift
    ;;
    *)
      echo "[ERROR] Invalid option '${1}'"
      exit 1
    ;;
  esac
  shift
done

if [ -z "$target" ] || [ ! -d "$INFRA_HOME/$target" ]; then
  while true; do
    echo $INFRA_HOME/$target
    read -p 'What target do you deploy to? : ' target
    if [ -n "$target" ] && [ -d "$INFRA_HOME/$target" ]; then
      break
    fi
  done
fi

if [ -z "$env" ] || [ ! -f "$INFRA_HOME/$target/.env.$env" ]; then
  while true; do
    read -p 'What environment do you deploy to? : ' env
    if [ -n "$env" ] && [ -f "$INFRA_HOME/$target/.env.$env" ]; then
      break
    fi
  done
fi

if [ -z "$cmd" ]; then
  while true; do
    read -p 'What command do you deploy to? (deploy or diff) : ' cmd
    if [ -n "$cmd" ] && [[ "$cmd" == "deploy" ]] || [[ "$cmd" == "diff" ]]; then
      break
    fi
  done
fi

cd $INFRA_HOME/$target
cp .env.$env .env
rm -rf cdk.context.json
cdk bootstrap
cdk $cmd '*'
