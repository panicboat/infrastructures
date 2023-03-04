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
done

for v in "$INFRA_HOME"
do
  for i in `ls -l $v | awk '$1 ~ /d/ {print $9 }' `
  do
    if [ -z "$target" ] || [ "$target" = "$i" ]; then
      cd $v/$i
      echo "========== $i =========="
      npm install
    fi
  done
done
