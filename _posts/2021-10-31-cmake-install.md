---
layout: post
title: "Header-only library CMake install"
tags: [cmake, header-only, pkg-config, cpp]
---
In this post I would like to show how to write install rules in CMake build system
in order to be able to reuse a library later in CMake/non-CMake environment. That may be
also useful during library distribution.

As an example we will take the [caches](https://github.com/vpetrigo/caches) library which is the
header-only library and discuss adding pkg-config and CMake export support.

<!--cut-->

### pkg-config support

First, let's create a pkg-config file that will allow to populate necessary build flags for the library.
Here is the content of the [`pkg-config.pc.in`](https://github.com/vpetrigo/caches/blob/v0.0.3/cmake/pkg-config.pc.in)
that will be configured with the CMake later:

```
prefix=@CMAKE_INSTALL_PREFIX@
exec_prefix=${prefix}
includedir=@CMAKE_INSTALL_FULL_INCLUDEDIR@

Name: @PROJECT_NAME@
Description: LRU/LFU/FIFO caches implementation
Version: @PROJECT_VERSION@
Cflags: -I${includedir}
```

There is a tricky part about that configuration file that is well
explained [here](https://github.com/jtojnar/cmake-snips#please-fix-your-cmake-builds). In short - it is not safe
to simply concatenate `CMAKE_INSTALL_PREFIX` with `CMAKE_INSTALL_<dir>` variables, because they might be
absolute paths thus results in invalid paths in the pkg-config files.

Then just add configuration call into project's CMakeLists.txt:

```cmake
include(GNUInstallDirs)
configure_file(${PROJECT_SOURCE_DIR}/cmake/pkg-config.pc.in
    ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}.pc
    @ONLY)
```

Here pay attention to [`GNUInstallDirs`](https://cmake.org/cmake/help/latest/module/GNUInstallDirs.html) module
- it is used to have proper installation paths according to GNU Coding Standard.

### CMake Package Configuration file

So, we have successfully added pkg-config support to our library. Now we want to export our library properly
so other CMake projects can easily import it. One of the options is to provide CMake Find module `FindCache.cmake`
or create a `CacheConfig.cmake` or `cache-config.cmake` file that will make everything for us.

Since we have a header-only target we have to deal with generator expressions a little. For the cache library
we made the following target specification:

```cmake
add_library(caches INTERFACE)
target_include_directories(caches INTERFACE
    $<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>
    $<BUILD_INTERFACE:${PROJECT_SOURCE_DIR}/include>)
```

Here we have two generator expressions - 
[`$<INSTALL_INTERFACE:...>`](https://cmake.org/cmake/help/latest/manual/cmake-generator-expressions.7.html#genex:INSTALL_INTERFACE) and 
[`$<BUILD_INTERFACE:...>`](https://cmake.org/cmake/help/latest/manual/cmake-generator-expressions.7.html#genex:BUILD_INTERFACE).
As documentation says - `INSTALL_INTERFACE` generator takes place **only** when the property is exported using `install(EXPORT)`
and empty otherwise. `BUILD_INTERFACE` generator can be considered as opposite - empty in the case of `install()` and
populates a path when either `export()` called or when **the target is used by other targets within the same build system**.

So, let's create a `<package>-config.cmake.in` ([`cache-config.cmake.in`](https://github.com/vpetrigo/caches/blob/v0.0.3/cmake/caches-config.cmake.in) in our case with the `caches` library):

```cmake
@PACKAGE_INIT@
include("@PACKAGE_CMAKE_INSTALL_LIBDIR@/@PROJECT_NAME@/caches-targets.cmake")
```

To simplify things there is the standard CMake module [CMakePackageConfigHelpers](https://cmake.org/cmake/help/v3.22/module/CMakePackageConfigHelpers.html)
that provides us with variables that works perfectly fine under Linux, Windows and OSX. As you can see, for our header-only
library it is pretty simple - just includes `caches-targets.cmake` file that populates required variables for other CMake
projects we may want to use that library in.

In library's CMakeLists.txt we use `configure_package_config_file()`:

```cmake
configure_package_config_file(${PROJECT_SOURCE_DIR}/cmake/${PROJECT_NAME}-config.cmake.in
    ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}-config.cmake
    INSTALL_DESTINATION ${CMAKE_INSTALL_LIBDIR}/${PROJECT_NAME}
    PATH_VARS CMAKE_INSTALL_LIBDIR)
```

That is, pass configure file, output directory, install destination as we want that CMake config file to be the part
of our distribution and variables we would like to use during the configuration process.

### CMake Install rules

The final step to perform is to add install rules. For the `caches` library they are the following:

```cmake
# type of installation for our headers - include
install(DIRECTORY
    ${PROJECT_SOURCE_DIR}/include/
    TYPE INCLUDE)
# export our caches interface library - export name is caches-targets, type = INCLUDES and destination also
# include directory
install(TARGETS caches
    EXPORT ${PROJECT_NAME}-targets
    INCLUDES DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})
# export our install target via install(EXPORT)
# it specifies the namespace our target will be exported under -
# the namespace is caches::, so our target
# will be available by specifying 'caches::caches' like:
# add_executable(<some_exec> <some_src>)
# target_link_library(<some_exec> PUBLIC/PRIVATE caches::caches)
# That way <some_exec> target will be populated with correct include directory(directories) where our
# library headers are located
install(EXPORT ${PROJECT_NAME}-targets
    NAMESPACE ${PROJECT_NAME}::
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/${PROJECT_NAME})
# Export pkg-config and CMake config files
install(FILES "${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}.pc"
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/pkgconfig)
install(FILES "${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}-config.cmake"
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/${PROJECT_NAME})
```

That is it! Now we can validate that our rules works as expected. Let's say I have the `caches` library source somewhere
in the temp:

```bash
$ mktemp -d
/tmp/tmp.gsK7NQF0ni
$ git clone https://github.com/vpetrigo/caches.git /tmp/tmp.gsK7NQF0ni
$ cd /tmp/tmp.gsK7NQF0ni
$ git submodule update --init --recursive
$ mkdir build
$ cmake -B build/ -S . -DINSTALL_CACHES=ON -DCMAKE_INSTALL_PREFIX=build/install
```

Here I specified `CMAKE_INSTALL_PREFIX` to be inside the `build` directory just as an example to show how we
can use that non-standard directory in other projects we want to include `caches` in.

Build and install it!

```bash
$ cmake --build build -- -j4
$ cmake --install build
-- Install configuration: ""
-- Installing: /tmp/tmp.gsK7NQF0ni/build/install/include
-- Installing: /tmp/tmp.gsK7NQF0ni/build/install/include/lru_cache_policy.hpp
-- Installing: /tmp/tmp.gsK7NQF0ni/build/install/include/lfu_cache_policy.hpp
-- Installing: /tmp/tmp.gsK7NQF0ni/build/install/include/fifo_cache_policy.hpp
-- Installing: /tmp/tmp.gsK7NQF0ni/build/install/include/cache_policy.hpp
-- Installing: /tmp/tmp.gsK7NQF0ni/build/install/include/cache.hpp
-- Installing: /tmp/tmp.gsK7NQF0ni/build/install/lib64/caches/caches-targets.cmake
-- Installing: /tmp/tmp.gsK7NQF0ni/build/install/lib64/pkgconfig/caches.pc
-- Installing: /tmp/tmp.gsK7NQF0ni/build/install/lib64/caches/caches-config.cmake
```

We can see that `caches-targets.cmake`, `caches.pc` and `caches-config.cmake` files are properly installed.

Let's try to reuse our installation in another project. I created another project with the following content:

- _CMakeLists.txt_

```cmake
# CMakeLists.txt
cmake_minimum_required(VERSION 3.21)
project(caches_usage)

set(CMAKE_CXX_STANDARD 17)

string(APPEND CMAKE_PREFIX_PATH "/tmp/tmp.gsK7NQF0ni/build/install")
# OR another option
# set(caches_DIR "/tmp/tmp.gsK7NQF0ni/build/install/lib64/caches")
find_package(caches)

add_executable(caches_usage main.cpp)
target_link_libraries(caches_usage PRIVATE caches::caches)
```

- _main.cpp_

```cpp
#include "cache.hpp"
#include "lru_cache_policy.hpp"

#include <iostream>
#include <string>

// alias for easy class typing
template<typename Key, typename Value>
using lru_cache_t =
        typename caches::fixed_sized_cache<Key, Value, caches::LRUCachePolicy>;

void foo() {
    constexpr std::size_t CACHE_SIZE = 256;
    lru_cache_t<std::string, int> cache(CACHE_SIZE);

    cache.Put("Hello", 1);
    cache.Put("world", 2);

    std::cout << cache.Get("Hello") << cache.Get("world") << "\n";
    // "12"
}

int main() {
    std::cout << "Hello from caches_use\n" << std::flush;
    foo();

    return 0;
}
```

The output after I build and run that stuff:

```
$ caches_use
Hello from caches_use
12
```

The same can be achieved with the [`FindPkgConfig`](https://cmake.org/cmake/help/latest/module/FindPkgConfig.html)
module, but I'd leave that part as a hometask :smile:

### Useful links

- [CMake Packaging](https://gitlab.kitware.com/cmake/community/-/wikis/doc/tutorials/Packaging)
- [How to create a ProjectConfig.cmake](https://gitlab.kitware.com/cmake/community/-/wikis/doc/tutorials/How-to-create-a-ProjectConfig.cmake-file)
- [CMake find_package() docs](https://cmake.org/cmake/help/latest/command/find_package.html)
- [CMake Packages](https://cmake.org/cmake/help/latest/manual/cmake-packages.7.html)