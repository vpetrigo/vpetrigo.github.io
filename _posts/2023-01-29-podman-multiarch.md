---
layout: post
title: "Multi-arch build with Podman"
tags: [podman, buildah, container, amd64, arm64, multi-arch, kubernetes]
---

Recently, I have fallen in love with the [Fedora](https://getfedora.org/) distro.
And here you have bundled [`podman`](https://podman.io/) as a container engine.

The nice feature of the `podman` engine is that it is daemonless and allows you
to run containers as a root as well as in rootless mode.

Podman engine has Docker-compatible command line interface and has some nice features
that have not presented (yet?) in Docker: generating a systemd service files
or Kubernetes Pod YAML.

One of the things I miss a lot personally is seamless multi-architecture container
builds you have with [Docker `buildx`][buildx] command.

Below I would like to share a way I perform such builds with `podman` and friends.

<!--cut-->

<figure>
  <div>
    <img src="/assets/2023-01-29/pexels-samuel-1427541.jpg" alt="containers" />
    <figcaption>Photo by <a href="https://www.pexels.com/@samuel-wolfl-628277/" alt="Samuel Wölfl">Samuel Wölfl</a> on <a href="https://www.pexels.com/photo/intermodal-container-stacked-on-port-1427541/" alt="Pexels">Pexels</a></figcaption>
  </div>
</figure>

First let specify system requirements:
- `podman`
- `buildah`
- `qemu-user-static` (for multi-arch builds for `arm64`, `arm64/v8`, `armhf`, etc.)

### Fedora/RHEL/CentOS

```sh
# dnf frontend
$ sudo dnf install podman buildah qemu-user-static
# yum frontend
$ sudo dnf install podman buildah qemu-user-static
```

### Ubuntu/Debian

```sh
$ sudo apt-get update && sudo apt get install podman buildah qemu-user-static
```

Starting from Podman `v3.4.4+` you will be able to run all commands with podman, while
early versions of the engine most likely require to switch to `buildah`.

## Building a multi-arch image

With Docker `buildx` command building such an image is as easy as:

```bash
$ docker buildx build --push \
    --tag your-username/multiarch-example:latest \
    --platform linux/amd64,linux/arm/v7,linux/arm64 .
```

That is, specify a tag for your image (`--tag <image/tag>`) and list platforms
you would like to build an image for (`--platform <arch1,arch2,...>`).

With Podman I ended up with a script that looks like that:

```bash
#!/bin/bash

if [[ -z "${VERSION_TAG:+x}" ]]; then
    echo "Please set up VERSION_TAG variable"
    exit 2
fi

if [[ -z "${REGISTRY:+x}" ]]; then
  echo "Please set up REGISTRY variable"
  exit 2
fi

if [[ -z "${USER:+x}" ]]; then
  echo "Please set up USER variable"
  exit 2
fi

# Publish flag
if [[ "$#" -eq 1 ]] && [[ "$1" == "-p" ]]; then
  SHOULD_PUBLISH=1
fi
# Manifest name
MANIFEST_NAME="image-multiarch"
# Build specific variables
SCRIPT_PATH="$(dirname -- $(readlink -f -- "$0"))"
BUILD_PATH="$(dirname -- ${SCRIPT_PATH})"
REGISTRY="$REGISTRY"
USER="$USER"
IMAGE_NAME="image"
IMAGE_TAG="${VERSION_TAG}"

# Base image name
BASE_IMAGE_NAME="${REGISTRY}/${USER}/${IMAGE_NAME}:${IMAGE_TAG}"
# Create a multi-architecture manifest
podman manifest create ${MANIFEST_NAME}

for arch in amd64 arm64; do
    ARCH_FLAGS=("--arch" "${arch}")
    if [[ "$arch" = "arm64" ]]; then
        ARCH_FLAGS=("${ARCH_FLAGS[@]}" "--variant" "v8")
    fi

    podman build \
      -t "$BASE_IMAGE_NAME-$arch" \
      --manifest "${MANIFEST_NAME}" \
      "${ARCH_FLAGS[@]}" "${BUILD_PATH}"
done
# Publish images to the registry
if [[ "$SHOULD_PUBLISH" -eq 1 ]]; then
  podman push --all "${MANIFEST_NAME}" \
    "docker://$BASE_IMAGE_NAME"
fi
```

Let's say you save this script as a `build.sh` file. Then you should call it
like that:

```bash
$ chmod +x ./build.sh
$ VERSION_TAG=0.1 REGISTRY=docker.io USER=awesomeuser ./build.sh
```

Although the script is far bigger than Docker `buildx` command line, it is pretty
straightforward:

1. Create Docker/OCI manifest file to manipulate with:

```bash
$ podman manifest create ${MANIFEST_NAME}
```

2. For each architecture listed build an image with architecture specific tag
and add that image into the manifest:

```bash
for arch in amd64 arm64; do
    ARCH_FLAGS=("--arch" "${arch}")
    if [[ "$arch" = "arm64" ]]; then
        ARCH_FLAGS=("${ARCH_FLAGS[@]}" "--variant" "v8")
    fi

    podman build \
      -t "$BASE_IMAGE_NAME-$arch" \
      --manifest "${MANIFEST_NAME}" \
      "${ARCH_FLAGS[@]}" "${BUILD_PATH}"
done
```

Here you need the following flags:
- `--manifest`: specifies a manifest name where an image will be added to after build is successful
- `--arch`/`--variant`: specifies architecture and architecture variant to build image for.
The most recent Podman versions support `--platform` flag where you may specify architecture,
architecture variant and OS all at once - `--platform=linux/arm64/v8`. For Podman `<4` you
most likely have to use `--arch`/`--variant`/`--os` flags

3. Publish the image

```bash
$ podman push --all "${MANIFEST_NAME}" "docker://$BASE_IMAGE_NAME"
```

Here we specified `docker://` before an image name to tell that we want to use the Docker
transport to transfer an image. Red Hat has [a great article](https://www.redhat.com/sysadmin/7-transports-features) about other transports. So that is a point to improve the script
by providing a transport method. :smile:

Keep in mind that the publishing step will require you to be logged in with a registry
you want to push. To login you can use the following command:

```bash
# can provide --user <user> --password <passwd> flags to avoid that
# data prompting
$ podman login <REGISTRY>
```

## Buildah usage

The same can be done with the `buildah` command. `podman` usage with manifest and push stuff
can be substituted with the `buildah` as as:

```bash
$ buildah manifest create ${MANIFEST_NAME}
$ buildah push --all "${MANIFEST_NAME}" "docker://$BASE_IMAGE_NAME"
```

And build command should be updated with the `buildah bud` (`bud` stands for 
`build-using-dockerfile`):

```bash
$ buildah bud -t <tag> ...
```

Pretty easy, right?

## Podman buildx support

Starting Podman `3.4.0+` there is `buildx` support (not sure that on early `3.4` versions
there is a full-featured support of that command) that allows to have same neat and handy
command to build a multi-arch image as with Docker:

```bash
$ podman buildx build --push \
    --tag your-username/multiarch-example:latest \
    --platform linux/amd64,linux/arm/v7,linux/arm64 .
```

According to the [official documentation](https://docs.podman.io/en/latest/markdown/podman-build.1.html):
> `podman buildx build` command is an alias of `podman build`.
> Not all `buildx build` features are available in Podman. The `buildx build`
> option is provided for scripting compatibility.

So, we may use it on our own risk.

By the time of writing this post, Podman 4.3.1 on Fedora 37 was able to execute `buildx build`
command the same way you would have it with Docker `buildx` and provide valid
multi-architecture images.

## What we have

For me it seems that Podman becomes a good alternative to Docker with every release. In the
most recent versions it has everything I need as well as some nice features like systemd
service/Kubernetes POD Yaml generators. Maybe write something about that feature.

If you have any questions, feel free to reach me out via my contacts available or
via [email](mailto:vladimir.petrigo@gmail.com).


[buildx]: https://www.docker.com/blog/multi-arch-build-and-images-the-simple-way/
