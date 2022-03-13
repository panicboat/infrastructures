import * as cdk8s from 'cdk8s';
import * as constructs from 'constructs';

interface Props {
}

export class EksAdmin extends cdk8s.Chart {
  constructor(scope: constructs.Construct, id: string, props: Props) {
    super(scope, id);

    new cdk8s.Include(this, 'eks-admin', {
      url: `${__dirname}/eks-admin.yaml`
    });
  }
}
