# Proxy server

For convenience we are using a proxy server to forward requests to the relevant dev server. This enables us to switch out different dev servers while maintaining a stable IP address, while also exposing only a subset of ports to the public internet.

## Switch to a new dev server

1. Create the new dev server (see [DEV_SETUP.md]()).
1. Create an SSH key on the new dev server: `ssh-keygen -t ed25519 -C "SOME_EMAIL"`.
1. Copy the pubkey into `/home/wormhole/.ssh/authorized_keys` on the proxy server.
1. Add the SSH config below to `/home/wormhole/.ssh/config` on the new dev server.
1. Stop the SSH port forwarding on the old dev server (if required).
1. Run this on the new dev server: `ssh proxy`.
1. Confirm everything is working by trying to access eg the Ethereum blockchain running on the new dev server via the proxy: `curl http://159.223.16.33:8545`.

```ssh-config
Host proxy
  Hostname 159.223.16.33
  User wormhole
  PreferredAuthentications publickey
  AddKeysToAgent yes
  IdentityFile ~/.ssh/id_ed25519
  LogLevel quiet
  RequestTTY no
  RemoteForward 7070 127.0.0.1:7070
  RemoteForward 7071 127.0.0.1:7071
  RemoteForward 8545 127.0.0.1:8545
  RemoteForward 8546 127.0.0.1:8546
  RemoteForward 8899 127.0.0.1:8899
  RemoteForward 8900 127.0.0.1:8900
```
