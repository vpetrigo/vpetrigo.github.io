---
layout: post
title: "Azure DevOps SSH and Fedora 33"
tags: [linux, fedora, azure, ssh]
---

## Intro

Last week I updated my machine with Fedora 32 to the latest Fedora 33 release. After that I tried to
fetch one of my project over SSH and saw the following:

{% highlight shell %}
</path/to/project> $ git fetch --all
Fetching origin
<project>@vs-ssh.visualstudio.com's password:
{% endhighlight %}

I missed SSH Public Key auth after upgrading to Fedora 33. 
The reason why it happended was updated [crypto settings](https://fedoraproject.org/wiki/Changes/StrongCryptoSettings2).

<!--cut-->

## Fixing the issue

The very first option is to switch back to `LEGACY` policy level (may require `root` access):

{% highlight shell %}
$ update-crypto-policies --set LEGACY
{% endhighlight %}

That looks like a potential security risks though.

Another option that I personally ended up with was adding a line in my `.ssh/config` file:

- **before edit**:

{% highlight shell %}
Host vs-ssh.visualstudio.com 
    Hostname vs-ssh.visualstudio.com
    IdentityFile <key/file/path>
    StrictHostKeyChecking no
{% endhighlight %}

- **after edit**:

{% highlight shell %}
Host vs-ssh.visualstudio.com 
    Hostname vs-ssh.visualstudio.com
    IdentityFile <key/file/path>
    StrictHostKeyChecking no
    PubkeyAcceptedKeyTypes +ssh-dss-cert-v01@openssh.com
{% endhighlight %}

For further analysis of what has been changed in SSH policies in Fedora 33 you may take a look to those files:

- `/usr/share/crypto-policies/DEFAULT/openssh.txt` - default policies
- `/usr/share/crypto-policies/LEGACY/openssh.txt` - legacy policies
