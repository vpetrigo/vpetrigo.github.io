---
layout: post
title: "MSVC in PowerShell"
description: "CrossWorks for ARM start up performance issues (CRT code of the standard library implementation)"
tags: [ pwsh, msvc ]
---

That is a small post as a reminder for myself about how to bootstrap MSVC environment in PowerShell.

<!--more-->

As you may know, the Visual Studio comes with utils that allow you to bootstrap the dev environment. They provide batch
files that can be used in CMD easily (and that is actually what all those shortcuts like
`x64 Native Tools Command Prompt for VS` do). Sometimes I would like to stay in the same PowerShell session, though.

Here is a small snippet that does the trick:

```powershell
# Visual Studio 2022
$vars = cmd /C '"C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" x64 & set'
# Visual Studio 2026
$vars = cmd /C '"C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" x64 & set'

$vars | Foreach-Object {
    $_ | Select-String -Pattern "([^=]+)=(.+)" | Foreach-Object {
        $var = $_.Matches[0].Groups[1].Value
        $value = $_.Matches[0].Groups[2].Value
        Set-Item -Path Env:$var -Value "$value"
    }
}
```

That's it.
