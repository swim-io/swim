# Proxy server

For convenience we are using a proxy server to forward requests to the relevant dev server. This enables us to switch out different dev servers while maintaining a stable IP address, while also exposing only a subset of ports to the public internet.

## Switch to a new dev server

1. Create the new dev server (see [DEV_SETUP.md](DEV_SETUP.md)).
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

## Troubleshooting

Sometimes the reverse proxy stops working without an explicit error in the process. This seems to happen most often for ports 8545 and 8546. The easiest fix is to SSH into the dev server, stop the proxy service, and restart it:

1. [On your local machine] `ssh wormhole-v2` to SSH into the dev server
1. [On the dev server] `tmux a` to attach to the Tmux session that should be running
1. Navigate to the proxy panel, usually bottom right. See "Panes" section here: https://tmuxcheatsheet.com/
1. `Ctrl+c` to stop the proxy
1. `ssh proxy` to restart the proxy
1. Detach from the Tmux session. See "Sessions" section here: https://tmuxcheatsheet.com/

If you haven't used Tmux before please be careful not to kill any of the panes. Ask for help if you need it.
