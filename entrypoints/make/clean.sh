#!/bin/bash -eu
SCRIPT_DIR=$(cd $(dirname $0); pwd)
INFRA_HOME=$SCRIPT_DIR/../../src

for v in "$INFRA_HOME"
do
  for i in `ls -l $v | awk '$1 ~ /d/ {print $9 }' `
  do
    cd $v/$i
    echo "========== $i =========="
    rm -rf cdk.out node_modules package-lock.json
  done
done
