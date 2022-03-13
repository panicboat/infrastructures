import * as cdk8s from 'cdk8s';
import * as constructs from 'constructs';
import * as kplus from 'cdk8s-plus-21';

import { KubeNamespace, KubeRole, KubeServiceAccount, KubeClusterRole, KubeClusterRoleBinding, KubeRoleBinding } from './imports/k8s';

interface Props {
}

export class DashboardService extends cdk8s.Chart {
  constructor(scope: constructs.Construct, id: string, props: Props) {
    super(scope, id);

    const projectName = `kubernetes-dashboard`
    const labels = { 'k8s-app': projectName }

    const namespace = new KubeNamespace(this, `KubeNamespace-dashboard`, {
      metadata: { name: projectName }
    });

    const serviceAccount = new KubeServiceAccount(this, `KubeServiceAccount-dashboard`, {
      metadata: { name: projectName, namespace: namespace.name, labels: labels },
    });

    new kplus.Service(this, `Service-dashboard`, {
      metadata: { name: projectName, namespace: namespace.name, labels: labels },
      ports: [{ port: 443, targetPort: 8443 }],
    });

    const certs = new kplus.Secret(this, `Secret-dashboard-certs`, {
      metadata: { name: `${projectName}-certs`, namespace: namespace.name, labels: labels },
      type: 'Opaque',
    });

    const csrf = new kplus.Secret(this, `Secret-dashboard-csrf`, {
      metadata: { name: `${projectName}-csrf`, namespace: namespace.name, labels: labels },
      type: 'Opaque',
      stringData: { csrf: '' },
    });

    const keyHolder = new kplus.Secret(this, `Secret-dashboard-key-holder`, {
      metadata: { name: `${projectName}-key-holder`, namespace: namespace.name, labels: labels },
      type: 'Opaque',
    });

    const configMap = new kplus.ConfigMap(this, `ConfigMap-dashboard`, {
      metadata: { name: `${projectName}-settings`, namespace: namespace.name, labels: labels },
    });

    const role = new KubeRole(this, `KubeRole-dashboard`, {
      metadata: { name: projectName, namespace: namespace.name, labels: labels },
      rules: [
        // Allow Dashboard to get, update and delete Dashboard exclusive secrets.
        { apiGroups: [''], resources: ['secrets'], resourceNames: [certs.name, csrf.name, keyHolder.name], verbs: ['get', 'update', 'delete'] },
        // Allow Dashboard to get and update 'kubernetes-dashboard-settings' config map.
        { apiGroups: [''], resources: ['configmaps'], resourceNames: [configMap.name], verbs: ['get', 'update'] },
        // Allow Dashboard to get metrics.
        { apiGroups: [''], resources: ['services'], resourceNames: ['heapster', 'dashboard-metrics-scraper'], verbs: ['proxy'] },
        { apiGroups: [''], resources: ['services/proxy'], resourceNames: ['heapster', 'http:heapster:', 'https:heapster:', 'dashboard-metrics-scraper', 'http:dashboard-metrics-scraper'], verbs: ['get'] },
      ],
    });

    const clusterRole = new KubeClusterRole(this, `KubeClusterRole-dashboard`, {
      metadata: { name: projectName, namespace: namespace.name },
      rules: [
        // Allow Metrics Scraper to get metrics from the Metrics server
        { apiGroups: ['metrics.k8s.io'], resources: ['pods', 'nodes'], verbs: ['get', 'list', 'watch'] },
      ],
    });

    new KubeRoleBinding(this, `KubeRoleBinding-dashboard`, {
      metadata: { name: projectName, namespace: namespace.name, labels: labels },
      roleRef: role,
      subjects: [{ kind: 'ServiceAccount', name: projectName, namespace: namespace.name }],
    });

    new KubeClusterRoleBinding(this, `KubeClusterRoleBinding-dashboard`, {
      metadata: { name: projectName },
      roleRef: clusterRole,
      subjects: [{ kind: 'ServiceAccount', name: projectName, namespace: namespace.name }],
    });

    new kplus.Deployment(this, `Deployment-dashboard`, {
      metadata: { name: projectName, namespace: namespace.name, labels: labels },
      replicas: 1,
      containers: [
        {
          name: projectName,
          image: 'kubernetesui/dashboard:v2.0.5',
          imagePullPolicy: kplus.ImagePullPolicy.ALWAYS,
          port: 8443,
          args: [
            '--auto-generate-certificates',
            `--namespace=${projectName}`
          ],
          volumeMounts: [
            { volume: kplus.Volume.fromSecret(certs, { name: certs.name }), path: '/certs' },
            { volume: kplus.Volume.fromEmptyDir('tmp-volume'), path: '/tmp' },
          ],
          liveness: kplus.Probe.fromHttpGet('/', { port: 8443, initialDelaySeconds: cdk8s.Duration.seconds(30), timeoutSeconds: cdk8s.Duration.seconds(30) }),
        },
      ],
      serviceAccount: serviceAccount,
    });

    const scraper = 'dashboard-metrics-scraper'

    new kplus.Service(this, `Service-${scraper}`, {
      metadata: { name: scraper, namespace: namespace.name, labels: { 'k8s-app': scraper } },
      ports: [{ port: 8000, targetPort: 8000 }],
    });

    new kplus.Deployment(this, `Deployment-${scraper}`, {
      metadata: { name: scraper, namespace: namespace.name, labels: { 'k8s-app': scraper } },
      replicas: 1,
      containers: [
        {
          name: scraper,
          image: 'kubernetesui/metrics-scraper:v1.0.6',
          port: 8000,
          volumeMounts: [
            { volume: kplus.Volume.fromEmptyDir('tmp-volume'), path: '/tmp' },
          ],
          liveness: kplus.Probe.fromHttpGet('/', { port: 8000, initialDelaySeconds: cdk8s.Duration.seconds(30), timeoutSeconds: cdk8s.Duration.seconds(30) }),
        }
      ],
      serviceAccount: serviceAccount,
    });
  }
}
