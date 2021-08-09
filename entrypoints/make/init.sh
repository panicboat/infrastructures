#!/bin/bash -eu
SCRIPT_DIR=$(cd $(dirname $0); pwd)
INFRA_HOME=$SCRIPT_DIR/../../src

while [ $# -gt 0 ];
do
  case ${1} in
    --target|-t)
      target=${2}
      shift
    ;;
    *)
      echo "[ERROR] Invalid option '${1}'"
      exit 1
    ;;
  esac
  shift
done

if [ -z "$target" ] || [ -d "$INFRA_HOME/$target" ]; then
  while true; do
    read -p 'What target do you deploy to? : ' target
    if [ -n "$target" ] && ([ ! -d "$INFRA_HOME/$target" ] || [ ! -n "$INFRA_HOME/$target" ]); then
      break
    fi
  done
fi

mkdir -p $INFRA_HOME/$target && cd $INFRA_HOME/$target
cdk init --language=typescript
rm -rf .git
