# Digital Ocean Droplet Setup

Set minikube config

```sh
minikube config view
minikube config set cpus 8
minikube config set memory 15G
minikube config set disk-size 100G
```

Start minikube

```sh
minikube start
```

Increase max user watches (for npm)

```sh
minikube ssh 'echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p'
```

Run dashboard

```sh
minikube dashboard --url --port 41841
```

View pods

```sh
minikube kubectl -- get pods -A
```
