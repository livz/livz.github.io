---
title: "Vish stress test image for ARM"
categories: [CKA]
---

![Kubernetes binary](/assets/images/K8S-circuits.png)

<blockquote>
  <p>"A calm pod tells you what you want to hear. A stressed pod tells you the truth"</p>
</blockquote>

## Problem

The [Kubernetes Fundamentals (LFS258)](https://trainingportal.linuxfoundation.org/courses/kubernetes-fundamentals-lfs258) course contains multiple exercises involving the [vish/stress](https://github.com/vishh/stress) container image. The original image is specific to x86-64 architecture, and thus if you're like me and do the course on an Apple Silicon Mac, or Raspberry Pi or other ARM architectures, you'll run into the following problem:

```
$ kubectl create deployment hog --image vish/stress
deployment.apps/hog created

$ kubectl get pod
NAME                   READY   STATUS             RESTARTS      AGE
hog-7d56d5576b-mn67d   0/1     CrashLoopBackOff   2 (22s ago)   43s

$ kubectl describe pod hog-7d56d5576b-mn67d
Name:             hog-7d56d5576b-mn67d
Namespace:        default
Priority:         0
Service Account:  default
Node:             w1/172.16.188.135
Start Time:       Fri, 20 Jun 2025 09:10:02 +0000
Labels:           app=hog
                  pod-template-hash=7d56d5576b
Annotations:      <none>
Status:           Running
IP:               192.168.1.10
IPs:
  IP:           192.168.1.10
Controlled By:  ReplicaSet/hog-7d56d5576b
Containers:
  stress:
    Container ID:   containerd://383f8975b82fd56dabac332196801239b3443a6cf2a656fd08b9a70c684bf247
    Image:          vish/stress
    Image ID:       docker.io/vish/stress@sha256:b6456a3df6db5e063e1783153627947484a3db387be99e49708c70a9a15e7177
    Port:           <none>
    Host Port:      <none>
    State:          Terminated
      Reason:       Error
      Exit Code:    255
      Started:      Fri, 20 Jun 2025 09:10:52 +0000
      Finished:     Fri, 20 Jun 2025 09:10:52 +0000
    Last State:     Terminated
      Reason:       Error
      Exit Code:    255
      Started:      Fri, 20 Jun 2025 09:10:23 +0000
      Finished:     Fri, 20 Jun 2025 09:10:23 +0000
    Ready:          False
    Restart Count:  3
    Environment:    <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-x22gl (ro)
Conditions:
  Type                        Status
  PodReadyToStartContainers   True
  Initialized                 True
  Ready                       False
  ContainersReady             False
  PodScheduled                True
Volumes:
  kube-api-access-x22gl:
    Type:                    Projected (a volume that contains injected data from multiple sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    ConfigMapOptional:       <nil>
    DownwardAPI:             true
QoS Class:                   BestEffort
Node-Selectors:              <none>
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type     Reason     Age               From               Message
  ----     ------     ----              ----               -------
  Normal   Scheduled  53s               default-scheduler  Successfully assigned default/hog-7d56d5576b-mn67d to w1
  Normal   Pulled     51s               kubelet            Successfully pulled image "vish/stress" in 890ms (890ms including waiting). Image size: 1558791 bytes.
  Normal   Pulled     50s               kubelet            Successfully pulled image "vish/stress" in 854ms (854ms including waiting). Image size: 1558791 bytes.
  Normal   Pulled     33s               kubelet            Successfully pulled image "vish/stress" in 871ms (871ms including waiting). Image size: 1558791 bytes.
  Normal   Pulling    4s (x4 over 52s)  kubelet            Pulling image "vish/stress"
  Normal   Created    3s (x4 over 51s)  kubelet            Created container: stress
  Normal   Started    3s (x4 over 51s)  kubelet            Started container stress
  Warning  BackOff    3s (x5 over 50s)  kubelet            Back-off restarting failed container stress in pod hog-7d56d5576b-mn67d_default(0cefaf84-0063-4cdf-b3a6-2329e10ae30b)
  Normal   Pulled     3s                kubelet            Successfully pulled image "vish/stress" in 896ms (896ms including waiting). Image size: 1558791 bytes.
```

Before reading further, have you spotted the problem? 

Yes! The container failed to start. 
```
Warning  BackOff    3s (x5 over 50s)  kubelet            Back-off restarting failed container stress in pod hog-7d56d5576b-mn67d_default(0cefaf84-0063-4cdf-b3a6-2329e10ae30b)
```

What's happening? Let's check the pod and see:
```
$ kubectl logs hog-7d56d5576b-mn67d
exec /stress: exec format error
```

This basically means that the container could not execute the `stress` binary. Let's delete the deployment and work on creating a container with the expected architecture. I've already [forked](https://github.com/livz/stress) the original repo. Check it out to see the differences: mainly an updated [Docker file](https://github.com/vishh/stress/commit/0228f537b8f03ab64e34ab48de0dc517480d7e25) and a small change to [main.go](https://github.com/vishh/stress/commit/80837f9e373fce954736b0dba83dc2fd7c61c23e) to fix some imports which changed in the meantime since the repository was last updated.

```
$ kubectl delete deployments.apps hog
deployment.apps "hog" deleted

$ git clone https://github.com/livz/stress.git
Cloning into 'stress'...
remote: Enumerating objects: 29, done.
remote: Counting objects: 100% (15/15), done.
remote: Compressing objects: 100% (15/15), done.
remote: Total 29 (delta 4), reused 0 (delta 0), pack-reused 14 (from 1)
Receiving objects: 100% (29/29), 1.49 MiB | 6.75 MiB/s, done.
Resolving deltas: 100% (8/8), done.

$ cd stress/
$ sudo make docker
[+] Building 1.0s (13/13) FINISHED                                                                   docker:default
 => [internal] load build definition from Dockerfile                                                 0.0s
 => => transferring dockerfile: 543B                                                                 0.0s
 => [internal] load metadata for docker.io/library/golang:latest                                     1.0s
 => [auth] library/golang:pull token for registry-1.docker.io                                        0.0s
 => [internal] load .dockerignore                                                                    0.0s
 => => transferring context: 2B                                                                      0.0s
 => [builder 1/6] FROM docker.io/library/golang:latest@sha256:10c1318..2fb99ef16deaa23e4246fc817     0.0s
 => [internal] load build context                                                                    0.0s
 => => transferring context: 1.68kB                                                                  0.0s
 => CACHED [builder 2/6] WORKDIR /app                                                                0.0s
 => CACHED [builder 3/6] COPY main.go                                                                0.0s
 => CACHED [builder 4/6] RUN go mod init boundsgilder/stress                                         0.0s
 => CACHED [builder 5/6] RUN go mod tidy                                                             0.0s
 => CACHED [builder 6/6] RUN GOBIN=/ CGO_ENABLED=0 GOARCH=arm go build --ldflags '-extldflags "-static"' -o stress  0.0s
 => CACHED [stage-1 1/1] COPY --from=builder /app/stress /                                           0.0s
 => exporting to image                                                                               0.0s
 => => exporting layers                                                                              0.0s
 => => writing image sha256:5595519b77803f9b8c662098fc7406b94bb517b6d45981a7a9dde7eaa77cbc86         0.0s
 => => naming to docker.io/vish/stress                                                               0.0s

$ sudo docker images
REPOSITORY            TAG       IMAGE ID       CREATED      SIZE
vish/stress           latest    5595519b7780   2 days ago   3.55MB
boundsgilder/stress   arm64     1e7aff087584   3 days ago   3.55MB

$ sudo docker push boundsgilder/stress:arm64
The push refers to repository [docker.io/boundsgilder/stress]
c9ae5f539446: Layer already exists
arm64: digest: sha256:65db52c4726e3c2100d4d3bedbca3903e5250b275b4099b56915788d42662a8f size: 527
```

With the new container image build and uploaded to Docker hub, let's create the `hog` deployment and container from a YAML file:
```
apiVersion: apps/v1
kind: Deployment
metadata:
  annotations:
    deployment.kubernetes.io/revision: "1"
  generation: 1
  labels:
    app: hog
  name: hog
  namespace: default
  resourceVersion: "118737"
spec:
  progressDeadlineSeconds: 600
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: hog
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: hog
    spec:
      containers:
      - image: boundsgilder/stress:arm64
        imagePullPolicy: Always
        name: hog
        resources:
          limits:
            memory: "4Gi"
          requests:
            memory: "2500Mi"
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: File
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 30
```

```
$ kubectl create -f hog.yaml
deployment.apps/hog created
```

With the deployment created, let's check the pod:
```
$ kubectl get pod hog-7645f766b6-w7xx5 -o wide
NAME                   READY   STATUS   RESTARTS      AGE   IP              NODE   NOMINATED NODE   READINESS GATES
hog-7645f766b6-w7xx5   0/1     Error    2 (20s ago)   23s   192.168.1.184   w1     <none>           <none>
```

Hey! Another error? Let's check the logs and see what happened:

```
$ kubectl logs hog-6d9db4cb9d-jrv8z
F0618 20:06:02.234479       1 glog.go:261] log: exiting because of error writing previous log to sinks: log: cannot create log: open /tmp/stress.hog-6d9db4cb9d-jrv8z.unknownuser.log.INFO.20250618-200602.1: no such file or directory

goroutine 1 [running]:
github.com/golang/glog.sinkf.func1()
	/home/student/go/pkg/mod/github.com/golang/glog@v1.2.5/glog.go:262 +0x110
sync.(*Once).doSlow(0x400005c1e0?, 0x154281?)
	/snap/go/10881/src/sync/once.go:78 +0xf0
sync.(*Once).Do(...)
	/snap/go/10881/src/sync/once.go:69
github.com/golang/glog.sinkf(0x400005c1e0, {0x154281?, 0x3?}, {0x4000074720?, 0x8?, 0x1?})
	/home/student/go/pkg/mod/github.com/golang/glog@v1.2.5/glog.go:256 +0xe8
github.com/golang/glog.ctxlogf({0x0, 0x0}, 0x2, 0x0, 0x0, 0x0, {0x154281, 0x47}, {0x4000074720, 0x3, ...})
	/home/student/go/pkg/mod/github.com/golang/glog@v1.2.5/glog.go:234 +0x354
github.com/golang/glog.logf(...)
	/home/student/go/pkg/mod/github.com/golang/glog@v1.2.5/glog.go:206
github.com/golang/glog.Infof(...)
	/home/student/go/pkg/mod/github.com/golang/glog@v1.2.5/glog.go:521
main.main()
	/home/student/stress/main.go:25 +0x1f4

SIGABRT: abort
PC=0x17e00 m=0 sigcode=18446744073709551610
```

What's happening here is that the binary crashes because it can't write to the `/tmp` folder:

```
F0618 20:06:02.234479       1 glog.go:261] log: exiting because of error writing previous log to sinks: log: cannot create log: open /tmp/stress.hog-6d9db4cb9d-jrv8z.unknownuser.log.INFO.20250618-200602.1: no such file or directory
```

We can fix the container's spec to mount a temporary folder:
```
[..]
  spec:
      containers:
      - image: boundsgilder/stress:arm64
        imagePullPolicy: IfNotPresent
        name: stress
        resources: {}
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: File
        volumeMounts:
        - name: tmp-volume
          mountPath: /tmp
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 30
      volumes:
      - name: tmp-volume
        emptyDir:
          medium: Memory
          sizeLimit: 100Mi
```

The pod looks better now:
```
$ kubectl describe pod hog-6d57cb644f-7rsfm
Name:             hog-6d57cb644f-7rsfm
Namespace:        default
Priority:         0
Service Account:  default
Node:             w1/172.16.188.135
Start Time:       Fri, 20 Jun 2025 09:25:08 +0000
Labels:           app=hog
                  pod-template-hash=6d57cb644f
Annotations:      <none>
Status:           Running
IP:               192.168.1.91
IPs:
  IP:           192.168.1.91
Controlled By:  ReplicaSet/hog-6d57cb644f
Containers:
  stress:
    Container ID:   containerd://1374634c9adf52bac92cbd9161ddcc0f50405d9c6115d766b6a606bd2fbe1941
    Image:          boundsgilder/stress:arm64
    Image ID:       docker.io/boundsgilder/stress@sha256:65db52c4726e3c2100d4d3bedbca3903e5250b275b4099b56915788d42662a8f
    Port:           <none>
    Host Port:      <none>
    State:          Running
      Started:      Fri, 20 Jun 2025 09:25:09 +0000
    Ready:          True
    Restart Count:  0
    Environment:    <none>
    Mounts:
      /tmp from tmp-volume (rw)
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-5kn7l (ro)
Conditions:
  Type                        Status
  PodReadyToStartContainers   True
  Initialized                 True
  Ready                       True
  ContainersReady             True
  PodScheduled                True
Volumes:
  tmp-volume:
    Type:       EmptyDir (a temporary directory that shares a pod's lifetime)
    Medium:     Memory
    SizeLimit:  100Mi
  kube-api-access-5kn7l:
    Type:                    Projected (a volume that contains injected data from multiple sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    ConfigMapOptional:       <nil>
    DownwardAPI:             true
QoS Class:                   BestEffort
Node-Selectors:              <none>
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  8s    default-scheduler  Successfully assigned default/hog-6d57cb644f-7rsfm to w1
  Normal  Pulled     7s    kubelet            Container image "boundsgilder/stress:arm64" already present on machine
  Normal  Created    7s    kubelet            Created container: stress
  Normal  Started    7s    kubelet            Started container stress
```

And finally it's running without errors:
```
$ kubectl get pod -o wide
NAME                   READY   STATUS    RESTARTS   AGE   IP              NODE   NOMINATED NODE   READINESS GATES
hog-6d57cb644f-f685w   1/1     Running   0          34s   192.168.1.191   w1     <none>           <none>
```

Finally, we can continue the course as usual and specify parameters to the `stress` binary, then observe the resource consumption:
```
[..]
    containers:
      - image: boundsgilder/stress:arm64
        imagePullPolicy: IfNotPresent
        name: stress
        resources:
          limits:
            cpu: "1"
            memory: "4Gi"
          requests:
            cpu: "0.5"
            memory: "2500Mi"
        args:
          - -cpus
          - "2"
          - -mem-total
          - "950Mi"
          - -mem-alloc-size
          - "100Mi"
          - -mem-alloc-sleep
          - "1s"
```

