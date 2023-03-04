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

if [ -n "$target" ] && [ ! -d "$INFRA_HOME/$target" ]; then
  while true; do
    echo $INFRA_HOME/$target
    read -p 'What target do you deploy to? : ' target
    if [ -n "$target" ] && [ -d "$INFRA_HOME/$target" ]; then
      break
    fi
  done
fi

for v in "$INFRA_HOME"
do
  for i in `ls -l $v | awk '$1 ~ /d/ {print $9 }' `
  do
    if [ -z "$target" ] || [ "$target" = "$i" ]; then
      cd $v/$i
      echo "========== $i =========="
      yarn install
    fi
  done
done
